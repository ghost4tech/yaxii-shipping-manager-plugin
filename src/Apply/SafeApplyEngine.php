<?php
/**
 * Create-only safe apply engine.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Apply;

use WP_Error;
use Yaxii\ShippingManager\Data\DatasetReadException;
use Yaxii\ShippingManager\Preview\PreviewPlanner;

defined( 'ABSPATH' ) || exit;

final class SafeApplyEngine {
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
		if ( ! $this->can_write_zones() ) {
			return $this->blocked_error( __( 'WooCommerce is inactive, so zones cannot be created.', 'yaxii-shipping-manager' ), 400 );
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

		return $this->create_missing_zones( $preview );
	}

	private function can_write_zones(): bool {
		return $this->woocommerce_active && class_exists( 'WC_Shipping_Zone' ) && class_exists( 'WC_Shipping_Zones' );
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

		if ( 0 === count( $preview['plan']['createZones'] ?? array() ) && $this->has_unsupported_operations( $preview['plan'] ) ) {
			return $this->blocked_error( __( 'This preview only contains unsupported updates or method changes. No zones were created.', 'yaxii-shipping-manager' ), 409 );
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
			|| count( $plan['addMethods'] ?? array() ) > 0
			|| count( $plan['updateMethods'] ?? array() ) > 0;
	}

	/**
	 * @param array<string,mixed> $preview Fresh preview.
	 *
	 * @return array<string,mixed>
	 */
	private function create_missing_zones( array $preview ): array {
		$created_zones = array();
		$blocked_zones = $this->unsupported_operation_items( $preview['plan'] );
		$warnings      = array();
		$registry_ok   = true;

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
		}

		if ( array() !== $blocked_zones ) {
			$warnings[] = __( 'Only missing Yaxii-managed zones are supported in this apply step. Methods, prices, and updates were not applied.', 'yaxii-shipping-manager' );
		}

		return $this->apply_response( $preview, $created_zones, $blocked_zones, $warnings, $registry_ok );
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
	 * @param array<string,mixed> $create_zone Preview create-zone item.
	 */
	private function valid_create_zone_item( array $create_zone ): bool {
		return 'create_zone' === ( $create_zone['type'] ?? '' )
			&& isset( $create_zone['wilayaCode'], $create_zone['zoneName'], $create_zone['location'] )
			&& 1 === preg_match( '/^\d{2}$/', (string) $create_zone['wilayaCode'] )
			&& 'DZ:' . (string) $create_zone['wilayaCode'] === (string) $create_zone['location'];
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
	private function unsupported_operation_items( array $plan ): array {
		return array_merge(
			$this->blocked_items_for_group( $plan['updateZones'] ?? array(), __( 'Zone updates are not implemented yet.', 'yaxii-shipping-manager' ) ),
			$this->blocked_items_for_group( $plan['addMethods'] ?? array(), __( 'Shipping method creation is not implemented yet.', 'yaxii-shipping-manager' ) ),
			$this->blocked_items_for_group( $plan['updateMethods'] ?? array(), __( 'Shipping method price or label updates are not implemented yet.', 'yaxii-shipping-manager' ) )
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
	 * @param array<string,mixed>            $preview Fresh preview.
	 * @param array<int,array<string,mixed>> $created_zones Created zones.
	 * @param array<int,array<string,mixed>> $blocked_zones Blocked zones.
	 * @param array<int,string>              $warnings Warnings.
	 *
	 * @return array<string,mixed>
	 */
	private function apply_response( array $preview, array $created_zones, array $blocked_zones, array $warnings, bool $registry_ok ): array {
		$created_count = count( $created_zones );

		return array(
			'applyEngineAvailable' => true,
			'applied'              => $created_count > 0,
			'createdZones'         => $created_zones,
			'skippedZones'         => $preview['plan']['skipManualZones'],
			'blockedZones'         => $blocked_zones,
			'conflicts'            => $preview['plan']['conflicts'],
			'warnings'             => array_values( array_unique( $warnings ) ),
			'registryUpdated'      => $created_count > 0 && $registry_ok,
			'wooCommerceChanged'   => $created_count > 0,
			'previewHash'          => $preview['previewHash'],
			'applyContractVersion' => ApplyRequestSanitizer::CONTRACT_VERSION,
			'message'              => $this->response_message( $created_count, count( $preview['plan']['skipManualZones'] ) ),
		);
	}

	private function response_message( int $created_count, int $manual_skip_count ): string {
		if ( $created_count > 0 ) {
			return sprintf(
				/* translators: 1: created zone count, 2: skipped manual zone count. */
				__( 'Created %1$d Yaxii-managed zones. Manual zones skipped: %2$d. No methods or prices were created.', 'yaxii-shipping-manager' ),
				$created_count,
				$manual_skip_count
			);
		}

		return __( 'No zones were created. The current preview has no missing Yaxii-managed zones to create.', 'yaxii-shipping-manager' );
	}

	private function blocked_error( string $message, int $status ): WP_Error {
		return new WP_Error(
			'yaxii_shipping_manager_apply_blocked',
			$message,
			array( 'status' => $status )
		);
	}
}
