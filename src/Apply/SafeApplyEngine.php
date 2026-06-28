<?php
/**
 * Safe apply engine for Yaxii-managed shipping zones.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Apply;

use WP_Error;
use Yaxii\ShippingManager\Data\DatasetReadException;
use Yaxii\ShippingManager\Preview\PreviewPlanner;

defined( 'ABSPATH' ) || exit;

final class SafeApplyEngine {
	private const METHOD_KEYS = array( 'home_delivery', 'office_delivery', 'custom_1', 'custom_2' );

	private bool $woocommerce_active;
	private PreviewPlanner $preview_planner;
	private ManagedZoneRegistry $managed_registry;
	private ?int $next_zone_order = null;

	public function __construct(
		bool $woocommerce_active,
		PreviewPlanner $preview_planner,
		ManagedZoneRegistry $managed_registry
	) {
		$this->woocommerce_active = $woocommerce_active;
		$this->preview_planner    = $preview_planner;
		$this->managed_registry   = $managed_registry;
	}

	/**
	 * @param array<string,mixed> $apply_request Sanitized apply request.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	public function apply( array $apply_request ) {
		if ( ! $this->can_write_shipping_configuration() ) {
			return $this->blocked_error( __( 'WooCommerce is inactive, so zones and methods cannot be created.', 'yaxii-shipping-manager' ), 400 );
		}

		try {
			$preview = $this->preview_planner->plan( $apply_request['previewRequest'] );
		} catch ( DatasetReadException $exception ) {
			return new WP_Error(
				'yaxii_shipping_manager_apply_dataset_failed',
				$exception->getMessage(),
				array( 'status' => 500 )
			);
		}

		$blocked = $this->blocking_error( $apply_request, $preview );
		if ( is_wp_error( $blocked ) ) {
			return $blocked;
		}

		return $this->apply_preview_plan( $preview );
	}

	private function can_write_shipping_configuration(): bool {
		return $this->woocommerce_active
			&& class_exists( 'WC_Shipping_Zone' )
			&& class_exists( 'WC_Shipping_Zones' )
			&& class_exists( 'WC_Shipping' )
			&& class_exists( 'WC_Shipping_Method' )
			&& function_exists( 'wc_format_decimal' );
	}

	/**
	 * @param array<string,mixed> $apply_request Sanitized apply request.
	 * @param array<string,mixed> $preview Fresh preview.
	 */
	private function blocking_error( array $apply_request, array $preview ): ?WP_Error {
		if ( $apply_request['previewHash'] !== $preview['previewHash'] ) {
			return $this->blocked_error( __( 'Preview is stale. Generate a new preview before applying.', 'yaxii-shipping-manager' ), 409 );
		}

		if ( $apply_request['acceptedPlanSummary'] != $this->accepted_summary( $preview['summary'] ) ) {
			return $this->blocked_error( __( 'Preview summary changed. Review a fresh preview before applying.', 'yaxii-shipping-manager' ), 409 );
		}

		if ( 'blocked' === ( $preview['applyReadiness']['severity'] ?? '' ) ) {
			return $this->blocked_error( __( 'Apply readiness is blocked. Resolve the blocking reason before applying.', 'yaxii-shipping-manager' ), 409 );
		}

		if ( count( $preview['plan']['conflicts'] ?? array() ) > 0 ) {
			return $this->blocked_error( __( 'Conflicts exist. Resolve them before applying.', 'yaxii-shipping-manager' ), 409 );
		}

		if (
			0 === count( $preview['plan']['createZones'] ?? array() )
			&& 0 === count( $preview['plan']['addMethods'] ?? array() )
			&& $this->has_unsupported_operations( $preview['plan'] )
		) {
			return $this->blocked_error( __( 'This preview only contains unsupported updates. No zones or methods were created.', 'yaxii-shipping-manager' ), 409 );
		}

		return null;
	}

	/**
	 * @param array<string,mixed> $summary Fresh preview summary.
	 *
	 * @return array<string,int>
	 */
	private function accepted_summary( array $summary ): array {
		unset( $summary['recommendedAction'] );

		return array_map( 'intval', $summary );
	}

	/**
	 * @param array<string,array<int,array<string,mixed>>> $plan Preview plan groups.
	 */
	private function has_unsupported_operations( array $plan ): bool {
		return count( $plan['updateZones'] ?? array() ) > 0
			|| count( $plan['updateMethods'] ?? array() ) > 0;
	}

	/**
	 * @param array<string,mixed> $preview Fresh preview.
	 *
	 * @return array<string,mixed>
	 */
	private function apply_preview_plan( array $preview ): array {
		$created_zones   = array();
		$created_methods = array();
		$skipped_methods = $this->skipped_update_method_items( $preview['plan']['updateMethods'] ?? array() );
		$blocked_zones   = $this->blocked_zone_update_items( $preview['plan']['updateZones'] ?? array() );
		$warnings        = array();
		$registry_ok     = true;

		foreach ( $preview['plan']['createZones'] as $create_zone ) {
			$created_zone = $this->create_zone( $create_zone );
			if ( is_wp_error( $created_zone ) ) {
				$blocked_zones[] = $this->blocked_zone_item( $create_zone, $created_zone->get_error_message() );
				continue;
			}

			$created_zones[] = $created_zone['zone'];
			if ( ! $created_zone['registryUpdated'] ) {
				$registry_ok = false;
				$warnings[] = sprintf(
					/* translators: %s: wilaya code. */
					__( 'Registry could not be updated for wilaya %s.', 'yaxii-shipping-manager' ),
					$created_zone['zone']['wilayaCode']
				);
			}

			foreach ( $this->method_items_for_created_zone( $create_zone, $created_zone['zone'] ) as $method_item ) {
				$method_result = $this->create_method( $method_item );
				$this->collect_method_result( $method_result, $created_methods, $skipped_methods, $warnings, $registry_ok );
			}
		}

		foreach ( $preview['plan']['addMethods'] as $method_item ) {
			$method_result = $this->create_method( $method_item );
			$this->collect_method_result( $method_result, $created_methods, $skipped_methods, $warnings, $registry_ok );
		}

		if ( array() !== $blocked_zones ) {
			$warnings[] = __( 'Zone updates are not implemented yet. Zone names were not changed.', 'yaxii-shipping-manager' );
		}

		if ( array() !== $skipped_methods ) {
			$warnings[] = __( 'Some shipping methods were skipped. Existing method instances were not updated.', 'yaxii-shipping-manager' );
		}

		return $this->apply_response( $preview, $created_zones, $created_methods, $skipped_methods, $blocked_zones, $warnings, $registry_ok );
	}

	/**
	 * @param array<string,mixed> $create_zone Preview create-zone item.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private function create_zone( array $create_zone ) {
		if ( ! $this->valid_create_zone_item( $create_zone ) ) {
			return $this->blocked_error( __( 'Create-zone item is not valid for apply.', 'yaxii-shipping-manager' ), 409 );
		}

		try {
			$zone = new \WC_Shipping_Zone();
			$zone->set_zone_name( (string) $create_zone['zoneName'] );
			$zone->set_zone_order( $this->next_zone_order() );
			$zone->set_zone_locations(
				array(
					(object) array(
						'code' => (string) $create_zone['location'],
						'type' => 'state',
					),
				)
			);
			$zone_id = (int) $zone->save();
		} catch ( \Exception $exception ) {
			return $this->blocked_error( $exception->getMessage(), 500 );
		}

		if ( $zone_id <= 0 ) {
			return $this->blocked_error( __( 'WooCommerce did not return a created zone ID.', 'yaxii-shipping-manager' ), 500 );
		}

		$registry_updated = $this->record_created_zone( $create_zone, $zone_id );

		return array(
			'zone'            => array(
				'wilayaCode' => (string) $create_zone['wilayaCode'],
				'wilayaName' => (string) $create_zone['wilayaName'],
				'zoneId'     => $zone_id,
				'zoneName'   => (string) $create_zone['zoneName'],
				'location'   => (string) $create_zone['location'],
			),
			'registryUpdated' => $registry_updated,
		);
	}

	/**
	 * @param array<string,mixed> $method_item Preview method-addition item.
	 *
	 * @return array<string,mixed>
	 */
	private function create_method( array $method_item ): array {
		if ( ! $this->valid_method_item( $method_item ) ) {
			return $this->skipped_method_item( $method_item, __( 'Method item is not valid for apply.', 'yaxii-shipping-manager' ) );
		}

		$method_price = $this->method_price( $method_item['price'] ?? null );
		if ( is_wp_error( $method_price ) ) {
			return $this->skipped_method_item( $method_item, $method_price->get_error_message() );
		}

		$target = $this->managed_zone_target( $method_item );
		if ( is_wp_error( $target ) ) {
			return $this->skipped_method_item( $method_item, $target->get_error_message() );
		}

		$recorded_method = $this->recorded_method_for_key( $target['record'], (string) $method_item['methodKey'] );
		if ( null !== $recorded_method ) {
			return $this->skipped_method_item(
				$method_item,
				$this->recorded_method_skip_reason( $target['zone'], $recorded_method )
			);
		}

		try {
			$instance_id = (int) $target['zone']->add_shipping_method( 'flat_rate' );
		} catch ( \Exception $exception ) {
			return $this->skipped_method_item( $method_item, $exception->getMessage() );
		}

		if ( $instance_id <= 0 ) {
			return $this->skipped_method_item( $method_item, __( 'WooCommerce did not return a created method instance ID.', 'yaxii-shipping-manager' ) );
		}

		$method = $this->shipping_method_for_instance( (int) $target['zone']->get_id(), $instance_id );
		if ( null === $method ) {
			return $this->skipped_method_item( $method_item, __( 'WooCommerce did not return the created shipping method instance.', 'yaxii-shipping-manager' ) );
		}

		$title = sanitize_text_field( (string) $method_item['label'] );
		$settings_saved = $this->save_created_method_settings( $method, $title, $method_price );

		$created_method = array(
			'wilayaCode'    => (string) $method_item['wilayaCode'],
			'wilayaName'    => (string) ( $method_item['wilayaName'] ?? '' ),
			'zoneId'        => (int) $target['zone']->get_id(),
			'zoneName'      => (string) $method_item['zoneName'],
			'methodKey'     => (string) $method_item['methodKey'],
			'methodId'      => 'flat_rate',
			'instanceId'    => $instance_id,
			'title'         => $title,
			'lastKnownCost' => $method_price,
		);

		return array(
			'method'          => $created_method,
			'registryUpdated' => $settings_saved && $this->managed_registry->record_method_instance( (int) $target['zone']->get_id(), $created_method ),
		);
	}

	/**
	 * @param array<string,mixed> $method_item Preview method-addition item.
	 */
	private function valid_method_item( array $method_item ): bool {
		return 'method_addition' === ( $method_item['type'] ?? '' )
			&& isset( $method_item['wilayaCode'], $method_item['zoneId'], $method_item['zoneName'], $method_item['methodKey'], $method_item['label'], $method_item['price'] )
			&& 1 === preg_match( '/^\d{2}$/', (string) $method_item['wilayaCode'] )
			&& in_array( (string) $method_item['methodKey'], self::METHOD_KEYS, true )
			&& 'managed_registry' === (string) ( $method_item['ownershipSource'] ?? '' );
	}

	/**
	 * @param array<string,mixed> $method_result Method creation or skip result.
	 * @param array<int,array<string,mixed>> $created_methods Created methods.
	 * @param array<int,array<string,mixed>> $skipped_methods Skipped methods.
	 * @param array<int,string> $warnings Warnings.
	 */
	private function collect_method_result( array $method_result, array &$created_methods, array &$skipped_methods, array &$warnings, bool &$registry_ok ): void {
		if ( isset( $method_result['method'] ) && is_array( $method_result['method'] ) ) {
			$created_methods[] = $method_result['method'];
			if ( false === (bool) $method_result['registryUpdated'] ) {
				$registry_ok = false;
				$warnings[] = sprintf(
					/* translators: %s: shipping method title. */
					__( 'Method settings or registry could not be fully updated for %s.', 'yaxii-shipping-manager' ),
					(string) $method_result['method']['title']
				);
			}
			return;
		}

		$skipped_methods[] = $method_result;
	}

	/**
	 * @param array<string,mixed> $method_item Preview method item.
	 *
	 * @return array{zone:\WC_Shipping_Zone,record:array<string,mixed>}|WP_Error
	 */
	private function managed_zone_target( array $method_item ) {
		$wilaya_code = (string) ( $method_item['wilayaCode'] ?? '' );
		$zone_id     = (int) ( $method_item['zoneId'] ?? 0 );
		$record      = $this->managed_registry->record_for_zone_id( $zone_id );

		if ( null === $record || $wilaya_code !== (string) $record['wilayaCode'] ) {
			return $this->blocked_error( __( 'Target zone is not recorded in the Yaxii managed registry.', 'yaxii-shipping-manager' ), 409 );
		}

		try {
			$zone = new \WC_Shipping_Zone( $zone_id );
		} catch ( \Exception $exception ) {
			return $this->blocked_error( $exception->getMessage(), 409 );
		}

		if ( (int) $zone->get_id() !== $zone_id || ! $this->zone_has_expected_location( $zone, $wilaya_code ) ) {
			return $this->blocked_error( __( 'Managed registry and WooCommerce zone locations do not match.', 'yaxii-shipping-manager' ), 409 );
		}

		return array(
			'zone'   => $zone,
			'record' => $record,
		);
	}

	private function zone_has_expected_location( \WC_Shipping_Zone $zone, string $wilaya_code ): bool {
		foreach ( $zone->get_zone_locations() as $location ) {
			if (
				is_object( $location )
				&& 'state' === (string) ( $location->type ?? '' )
				&& 'DZ:' . $wilaya_code === (string) ( $location->code ?? '' )
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @param array<string,mixed> $record Registry record.
	 *
	 * @return array<string,mixed>|null
	 */
	private function recorded_method_for_key( array $record, string $method_key ): ?array {
		foreach ( $record['methodInstances'] as $method_instance ) {
			if ( $method_key === (string) $method_instance['methodKey'] ) {
				return $method_instance;
			}
		}

		return null;
	}

	/**
	 * @param array<string,mixed> $recorded_method Registry method instance.
	 */
	private function recorded_method_skip_reason( \WC_Shipping_Zone $zone, array $recorded_method ): string {
		$instance_id = (int) $recorded_method['instanceId'];
		if ( null === $this->shipping_method_for_instance( (int) $zone->get_id(), $instance_id ) ) {
			return __( 'Registry already records this method, but WooCommerce no longer returns the instance. Reconcile the registry before adding it again.', 'yaxii-shipping-manager' );
		}

		return __( 'Registry already records this method for the managed zone.', 'yaxii-shipping-manager' );
	}

	private function shipping_method_for_instance( int $zone_id, int $instance_id ): ?\WC_Shipping_Method {
		try {
			$zone = new \WC_Shipping_Zone( $zone_id );
		} catch ( \Exception $exception ) {
			return null;
		}

		foreach ( $zone->get_shipping_methods( false, 'admin' ) as $method ) {
			if (
				$method instanceof \WC_Shipping_Method
				&& method_exists( $method, 'get_instance_id' )
				&& $instance_id === (int) $method->get_instance_id()
			) {
				return $method;
			}
		}

		return null;
	}

	private function save_created_method_settings( \WC_Shipping_Method $method, string $title, string $cost ): bool {
		$method->init_instance_settings();
		$settings          = is_array( $method->instance_settings ) ? $method->instance_settings : array();
		$settings['title'] = $title;
		$settings['cost']  = $cost;
		$option_key        = $method->get_instance_option_key();
		$payload           = apply_filters( 'woocommerce_shipping_' . $method->id . '_instance_settings_values', $settings, $method );

		$saved = update_option( $option_key, $payload );

		return $saved || $payload === get_option( $option_key, array() );
	}

	/**
	 * @return string|WP_Error
	 */
	private function method_price( $price ) {
		if ( null === $price || '' === $price ) {
			return $this->blocked_error( __( 'Shipping method price is missing.', 'yaxii-shipping-manager' ), 409 );
		}

		if ( ! is_int( $price ) && ! is_float( $price ) && ! ( is_string( $price ) && is_numeric( $price ) ) ) {
			return $this->blocked_error( __( 'Shipping method price is invalid.', 'yaxii-shipping-manager' ), 409 );
		}

		$formatted = wc_format_decimal( $price );
		if ( '' === $formatted || '-' === substr( $formatted, 0, 1 ) ) {
			return $this->blocked_error( __( 'Shipping method price cannot be negative.', 'yaxii-shipping-manager' ), 409 );
		}

		return $formatted;
	}

	/**
	 * @param array<string,mixed> $create_zone Preview create-zone item.
	 */
	private function valid_create_zone_item( array $create_zone ): bool {
		return 'create_zone' === ( $create_zone['type'] ?? '' )
			&& isset( $create_zone['wilayaCode'], $create_zone['zoneName'], $create_zone['location'] )
			&& 1 === preg_match( '/^\d{2}$/', (string) $create_zone['wilayaCode'] )
			&& 'DZ:' . (string) $create_zone['wilayaCode'] === (string) $create_zone['location'];
	}

	/**
	 * @param array<string,mixed> $create_zone Preview create-zone item.
	 * @param array<string,mixed> $created_zone Created zone response item.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function method_items_for_created_zone( array $create_zone, array $created_zone ): array {
		$methods = is_array( $create_zone['methods'] ?? null ) ? $create_zone['methods'] : array();

		return array_values(
			array_map(
				static function ( array $method ) use ( $create_zone, $created_zone ): array {
					return array(
						'type'            => 'method_addition',
						'wilayaCode'      => (string) $created_zone['wilayaCode'],
						'wilayaName'      => (string) $created_zone['wilayaName'],
						'zoneId'          => (int) $created_zone['zoneId'],
						'zoneName'        => (string) $created_zone['zoneName'],
						'methodKey'       => (string) $method['key'],
						'label'           => (string) $method['label'],
						'price'           => $method['price'],
						'ownershipSource' => (string) ( $create_zone['ownershipSource'] ?? 'managed_registry' ),
					);
				},
				$methods
			)
		);
	}

	private function next_zone_order(): int {
		if ( null !== $this->next_zone_order ) {
			$order                 = $this->next_zone_order;
			$this->next_zone_order = $order + 1;
			return $order;
		}

		$orders = array_map(
			static fn( array $zone ): int => (int) ( $zone['zone_order'] ?? 0 ),
			\WC_Shipping_Zones::get_zones( 'admin' )
		);

		$this->next_zone_order = array() === $orders ? 2 : max( $orders ) + 2;

		return $this->next_zone_order - 1;
	}

	/**
	 * @param array<string,mixed> $create_zone Preview create-zone item.
	 */
	private function record_created_zone( array $create_zone, int $zone_id ): bool {
		$timestamp = gmdate( 'c' );

		return $this->managed_registry->record_created_zone(
			array(
				'wilayaCode'      => (string) $create_zone['wilayaCode'],
				'zoneId'          => $zone_id,
				'zoneName'        => (string) $create_zone['zoneName'],
				'methodInstances' => array(),
				'createdBy'       => 'yaxii_shipping_manager',
				'createdAt'       => $timestamp,
				'updatedAt'       => $timestamp,
				'source'          => 'apply_create_missing_zones',
				'schemaVersion'   => ManagedZoneRegistry::SCHEMA_VERSION,
			)
		);
	}

	/**
	 * @param array<string,array<int,array<string,mixed>>> $plan Preview plan groups.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function blocked_zone_update_items( array $items ): array {
		return $this->blocked_items_for_group( $items, __( 'Zone updates are not implemented yet.', 'yaxii-shipping-manager' ) );
	}

	/**
	 * @param array<int,array<string,mixed>> $items Preview method update items.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function skipped_update_method_items( array $items ): array {
		return array_map(
			fn( array $item ): array => $this->skipped_method_item( $item, __( 'Existing method updates are not implemented yet.', 'yaxii-shipping-manager' ) ),
			$items
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $items Preview plan items.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function blocked_items_for_group( array $items, string $reason ): array {
		return array_map(
			fn( array $item ): array => $this->blocked_zone_item( $item, $reason ),
			$items
		);
	}

	/**
	 * @param array<string,mixed> $item Preview plan item.
	 *
	 * @return array<string,mixed>
	 */
	private function blocked_zone_item( array $item, string $reason ): array {
		return array(
			'wilayaCode' => (string) ( $item['wilayaCode'] ?? '' ),
			'wilayaName' => (string) ( $item['wilayaName'] ?? '' ),
			'zoneId'     => isset( $item['zoneId'] ) ? (int) $item['zoneId'] : null,
			'zoneName'   => (string) ( $item['zoneName'] ?? '' ),
			'type'       => (string) ( $item['type'] ?? 'blocked' ),
			'reason'     => $reason,
		);
	}

	/**
	 * @param array<string,mixed> $item Preview method item.
	 *
	 * @return array<string,mixed>
	 */
	private function skipped_method_item( array $item, string $reason ): array {
		return array(
			'wilayaCode' => (string) ( $item['wilayaCode'] ?? '' ),
			'wilayaName' => (string) ( $item['wilayaName'] ?? '' ),
			'zoneId'     => isset( $item['zoneId'] ) ? (int) $item['zoneId'] : null,
			'zoneName'   => (string) ( $item['zoneName'] ?? '' ),
			'methodKey'  => (string) ( $item['methodKey'] ?? '' ),
			'title'      => (string) ( $item['label'] ?? $item['title'] ?? '' ),
			'type'       => (string) ( $item['type'] ?? 'method_skipped' ),
			'reason'     => $reason,
		);
	}

	/**
	 * @param array<string,mixed>            $preview Fresh preview.
	 * @param array<int,array<string,mixed>> $created_zones Created zones.
	 * @param array<int,array<string,mixed>> $created_methods Created methods.
	 * @param array<int,array<string,mixed>> $skipped_methods Skipped methods.
	 * @param array<int,array<string,mixed>> $blocked_zones Blocked zones.
	 * @param array<int,string>              $warnings Warnings.
	 *
	 * @return array<string,mixed>
	 */
	private function apply_response( array $preview, array $created_zones, array $created_methods, array $skipped_methods, array $blocked_zones, array $warnings, bool $registry_ok ): array {
		$created_zone_count   = count( $created_zones );
		$created_method_count = count( $created_methods );
		$changed              = $created_zone_count > 0 || $created_method_count > 0;

		return array(
			'applyEngineAvailable' => true,
			'applied'              => $changed,
			'createdZones'         => $created_zones,
			'createdMethods'       => $created_methods,
			'skippedZones'         => $preview['plan']['skipManualZones'],
			'skippedMethods'       => $skipped_methods,
			'blockedZones'         => $blocked_zones,
			'conflicts'            => $preview['plan']['conflicts'],
			'warnings'             => array_values( array_unique( $warnings ) ),
			'registryUpdated'      => $changed && $registry_ok,
			'wooCommerceChanged'   => $changed,
			'previewHash'          => $preview['previewHash'],
			'applyContractVersion' => ApplyRequestSanitizer::CONTRACT_VERSION,
			'message'              => $this->response_message( $created_zone_count, $created_method_count, count( $preview['plan']['skipManualZones'] ) ),
		);
	}

	private function response_message( int $created_zone_count, int $created_method_count, int $manual_skip_count ): string {
		if ( $created_zone_count > 0 && $created_method_count > 0 ) {
			return sprintf(
				/* translators: 1: created zone count, 2: created method count, 3: skipped manual zone count. */
				__( 'Created %1$d Yaxii-managed zones and added %2$d shipping methods. Manual zones skipped: %3$d.', 'yaxii-shipping-manager' ),
				$created_zone_count,
				$created_method_count,
				$manual_skip_count
			);
		}

		if ( $created_method_count > 0 ) {
			return sprintf(
				/* translators: 1: created method count, 2: skipped manual zone count. */
				__( 'Added %1$d shipping methods to Yaxii-managed zones. Manual zones skipped: %2$d.', 'yaxii-shipping-manager' ),
				$created_method_count,
				$manual_skip_count
			);
		}

		if ( $created_zone_count > 0 ) {
			return sprintf(
				/* translators: 1: created zone count, 2: skipped manual zone count. */
				__( 'Created %1$d Yaxii-managed zones. Manual zones skipped: %2$d.', 'yaxii-shipping-manager' ),
				$created_zone_count,
				$manual_skip_count
			);
		}

		return __( 'No zones or methods were created. The current preview has no supported missing Yaxii-managed work to apply.', 'yaxii-shipping-manager' );
	}

	private function blocked_error( string $message, int $status ): WP_Error {
		return new WP_Error(
			'yaxii_shipping_manager_apply_blocked',
			$message,
			array( 'status' => $status )
		);
	}
}
