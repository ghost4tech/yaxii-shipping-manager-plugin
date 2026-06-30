<?php
/**
 * Confirmed removal for Yaxii-managed WooCommerce setup.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Tools;

use WC_Shipping_Zones;
use WP_Error;
use Yaxii\ShippingManager\Apply\ManagedZoneRegistry;

defined( 'ABSPATH' ) || exit;

final class ManagedSetupRemovalExecutor {
	private const CONFIRMATION_TEXT = 'REMOVE YAXII SETUP';
	private const DRY_RUN_MAX_AGE_SECONDS = 1800;
	private const REQUEST_KEYS = array(
		'confirmed',
		'confirmationText',
		'dryRunHash',
		'dryRunGeneratedAt',
		'acceptedSummary',
	);
	private const SUMMARY_KEYS = array(
		'managedZoneCount',
		'managedMethodCount',
		'registryMismatchCount',
		'manualProtectedZoneCount',
	);

	private bool $woocommerce_active;
	private ManagedZoneRegistry $managed_registry;
	private ManagedSetupRemovalPreview $removal_preview;

	public function __construct(
		bool $woocommerce_active,
		ManagedZoneRegistry $managed_registry,
		ManagedSetupRemovalPreview $removal_preview
	) {
		$this->woocommerce_active = $woocommerce_active;
		$this->managed_registry   = $managed_registry;
		$this->removal_preview    = $removal_preview;
	}

	/**
	 * @param array<string,mixed> $request_payload JSON request payload.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	public function remove( array $request_payload ) {
		if ( ! $this->woocommerce_active ) {
			return new WP_Error(
				'yaxii_shipping_manager_woocommerce_inactive',
				__( 'WooCommerce is inactive. Managed setup removal is unavailable.', 'yaxii-shipping-manager' ),
				array( 'status' => 409 )
			);
		}

		if ( ! class_exists( WC_Shipping_Zones::class ) ) {
			return new WP_Error(
				'yaxii_shipping_manager_shipping_zones_unavailable',
				__( 'WooCommerce shipping zone APIs are unavailable. Removal was not started.', 'yaxii-shipping-manager' ),
				array( 'status' => 409 )
			);
		}

		$validated_request = $this->validate_request( $request_payload );
		if ( is_wp_error( $validated_request ) ) {
			return $validated_request;
		}

		$fresh_preview = $this->removal_preview->payload();
		$stale_error   = $this->stale_preview_error( $validated_request, $fresh_preview );
		if ( is_wp_error( $stale_error ) ) {
			return $stale_error;
		}

		$blocked_zones = is_array( $fresh_preview['blockedZones'] ?? null ) ? $fresh_preview['blockedZones'] : array();
		if ( array() !== $blocked_zones ) {
			return $this->blocked_response( $fresh_preview );
		}

		$removable_zones = $this->removable_zones( $fresh_preview );
		$delete_result   = $this->delete_verified_zones( $removable_zones );
		$registry_result = $this->reconcile_registry( $fresh_preview, $delete_result['deletedZoneIds'] );
		$warnings        = array_merge(
			$this->string_array( $fresh_preview['registryWarnings'] ?? array() ),
			$delete_result['warnings'],
			$registry_result['warnings']
		);

		$woo_changed = count( $delete_result['deletedZones'] ) > 0;
		$changed     = $woo_changed || $registry_result['registryRecordsRemoved'] > 0 || $registry_result['orphanRegistryRecordsCleaned'] > 0;

		return array(
			'removed'                       => $changed,
			'wooCommerceChanged'            => $woo_changed,
			'deletedZones'                  => $delete_result['deletedZones'],
			'deletedMethodsEstimated'       => $delete_result['deletedMethodsEstimated'],
			'registryRecordsRemoved'        => $registry_result['registryRecordsRemoved'],
			'orphanRegistryRecordsCleaned'  => $registry_result['orphanRegistryRecordsCleaned'],
			'manualZonesProtected'          => $fresh_preview['manualZonesProtected'] ?? array(),
			'blockedZones'                  => array(),
			'warnings'                      => $warnings,
			'message'                       => $this->success_message( $delete_result['deletedZones'], $registry_result ),
		);
	}

	/**
	 * @param array<string,mixed> $request_payload JSON request payload.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private function validate_request( array $request_payload ) {
		$unknown_keys = array_diff( array_keys( $request_payload ), self::REQUEST_KEYS );
		if ( array() !== $unknown_keys ) {
			return new WP_Error(
				'yaxii_shipping_manager_remove_unknown_fields',
				__( 'Removal request contained unsupported fields.', 'yaxii-shipping-manager' ),
				array( 'status' => 400 )
			);
		}

		if ( true !== ( $request_payload['confirmed'] ?? null ) ) {
			return new WP_Error(
				'yaxii_shipping_manager_remove_not_confirmed',
				__( 'Removal confirmation is required.', 'yaxii-shipping-manager' ),
				array( 'status' => 400 )
			);
		}

		if ( self::CONFIRMATION_TEXT !== (string) ( $request_payload['confirmationText'] ?? '' ) ) {
			return new WP_Error(
				'yaxii_shipping_manager_remove_confirmation_text',
				__( 'Confirmation text did not match. Removal was not started.', 'yaxii-shipping-manager' ),
				array( 'status' => 400 )
			);
		}

		$dry_run_hash = (string) ( $request_payload['dryRunHash'] ?? '' );
		if ( 1 !== preg_match( '/^[a-f0-9]{64}$/', $dry_run_hash ) ) {
			return new WP_Error(
				'yaxii_shipping_manager_remove_preview_hash',
				__( 'A valid removal preview hash is required.', 'yaxii-shipping-manager' ),
				array( 'status' => 400 )
			);
		}

		$generated_at = (string) ( $request_payload['dryRunGeneratedAt'] ?? '' );
		$timestamp    = strtotime( $generated_at );
		if ( false === $timestamp || time() - $timestamp > self::DRY_RUN_MAX_AGE_SECONDS ) {
			return new WP_Error(
				'yaxii_shipping_manager_remove_preview_stale',
				__( 'Removal preview is stale. Preview removal again before deleting anything.', 'yaxii-shipping-manager' ),
				array( 'status' => 409 )
			);
		}

		if ( ! is_array( $request_payload['acceptedSummary'] ?? null ) ) {
			return new WP_Error(
				'yaxii_shipping_manager_remove_summary_missing',
				__( 'Removal request must include the accepted dry-run summary.', 'yaxii-shipping-manager' ),
				array( 'status' => 400 )
			);
		}

		$summary = $request_payload['acceptedSummary'];
		if ( array() !== array_diff( array_keys( $summary ), self::SUMMARY_KEYS ) ) {
			return new WP_Error(
				'yaxii_shipping_manager_remove_summary_unknown_fields',
				__( 'Removal summary contained unsupported fields.', 'yaxii-shipping-manager' ),
				array( 'status' => 400 )
			);
		}

		foreach ( self::SUMMARY_KEYS as $key ) {
			if ( ! isset( $summary[ $key ] ) || ! is_numeric( $summary[ $key ] ) ) {
				return new WP_Error(
					'yaxii_shipping_manager_remove_summary_invalid',
					__( 'Removal summary did not match the expected contract.', 'yaxii-shipping-manager' ),
					array( 'status' => 400 )
				);
			}

			$summary[ $key ] = (int) $summary[ $key ];
		}

		return array(
			'dryRunHash'       => $dry_run_hash,
			'dryRunGeneratedAt' => $generated_at,
			'acceptedSummary'  => $summary,
		);
	}

	/**
	 * @param array<string,mixed> $validated_request Validated request payload.
	 * @param array<string,mixed> $fresh_preview Fresh dry-run preview.
	 *
	 * @return WP_Error|null
	 */
	private function stale_preview_error( array $validated_request, array $fresh_preview ): ?WP_Error {
		if ( (string) $fresh_preview['dryRunHash'] !== (string) $validated_request['dryRunHash'] ) {
			return new WP_Error(
				'yaxii_shipping_manager_remove_preview_changed',
				__( 'WooCommerce shipping setup changed after the preview. Preview removal again before deleting anything.', 'yaxii-shipping-manager' ),
				array( 'status' => 409 )
			);
		}

		foreach ( self::SUMMARY_KEYS as $key ) {
			if ( (int) $fresh_preview['acceptedSummary'][ $key ] !== (int) $validated_request['acceptedSummary'][ $key ] ) {
				return new WP_Error(
					'yaxii_shipping_manager_remove_summary_changed',
					__( 'Removal summary no longer matches WooCommerce. Preview removal again before deleting anything.', 'yaxii-shipping-manager' ),
					array( 'status' => 409 )
				);
			}
		}

		return null;
	}

	/**
	 * @param array<string,mixed> $fresh_preview Fresh dry-run preview.
	 *
	 * @return array<string,mixed>
	 */
	private function blocked_response( array $fresh_preview ): array {
		return array(
			'removed'                       => false,
			'wooCommerceChanged'            => false,
			'deletedZones'                  => array(),
			'deletedMethodsEstimated'       => 0,
			'registryRecordsRemoved'        => 0,
			'orphanRegistryRecordsCleaned'  => 0,
			'manualZonesProtected'          => $fresh_preview['manualZonesProtected'] ?? array(),
			'blockedZones'                  => $fresh_preview['blockedZones'] ?? array(),
			'warnings'                      => $this->string_array( $fresh_preview['registryWarnings'] ?? array() ),
			'message'                       => __( 'Removal was blocked because some Yaxii-managed zones contain unmanaged methods or unsafe location state.', 'yaxii-shipping-manager' ),
		);
	}

	/**
	 * @param array<string,mixed> $preview Fresh dry-run preview.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function removable_zones( array $preview ): array {
		$zones = is_array( $preview['zonesToRemoveLater'] ?? null ) ? $preview['zonesToRemoveLater'] : array();

		return array_values(
			array_filter(
				$zones,
				static fn( array $zone ): bool => true === (bool) ( $zone['canRemove'] ?? false )
			)
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $removable_zones Verified zone candidates.
	 *
	 * @return array<string,mixed>
	 */
	private function delete_verified_zones( array $removable_zones ): array {
		$deleted_zones             = array();
		$deleted_zone_ids          = array();
		$deleted_methods_estimated = 0;
		$warnings                  = array();

		foreach ( $removable_zones as $zone ) {
			$zone_id = (int) ( $zone['zoneId'] ?? 0 );
			if ( $zone_id <= 0 ) {
				continue;
			}

			WC_Shipping_Zones::delete_zone( $zone_id );
			if ( $this->zone_exists( $zone_id ) ) {
				$warnings[] = sprintf(
					/* translators: %d: WooCommerce shipping zone ID. */
					__( 'WooCommerce still returns managed zone #%d after deletion was attempted. Registry record was kept.', 'yaxii-shipping-manager' ),
					$zone_id
				);
				continue;
			}

			$deleted_zone_ids[]          = $zone_id;
			$deleted_zones[]             = $zone;
			$deleted_methods_estimated += (int) ( $zone['methodCount'] ?? 0 );
		}

		return array(
			'deletedZones'            => $deleted_zones,
			'deletedZoneIds'          => $deleted_zone_ids,
			'deletedMethodsEstimated' => $deleted_methods_estimated,
			'warnings'                => $warnings,
		);
	}

	private function zone_exists( int $zone_id ): bool {
		foreach ( WC_Shipping_Zones::get_zones( 'admin' ) as $zone ) {
			if ( $zone_id === (int) ( $zone['id'] ?? 0 ) || $zone_id === (int) ( $zone['zone_id'] ?? 0 ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @param array<string,mixed> $preview Fresh dry-run preview.
	 * @param array<int,int>      $deleted_zone_ids Deleted WooCommerce zone IDs.
	 *
	 * @return array<string,mixed>
	 */
	private function reconcile_registry( array $preview, array $deleted_zone_ids ): array {
		$deleted_zone_ids            = array_map( 'intval', $deleted_zone_ids );
		$orphan_zone_ids             = $this->zone_ids_from_records( $preview['orphanRegistryRecords'] ?? array() );
		$orphan_method_records       = $this->orphan_method_records_by_zone( $preview['orphanMethodRecords'] ?? array() );
		$registry_records_removed    = 0;
		$orphan_records_cleaned      = 0;
		$reconciled_records          = array();
		$warnings                    = array();

		foreach ( $this->managed_registry->records() as $record ) {
			$zone_id = (int) $record['zoneId'];

			if ( in_array( $zone_id, $deleted_zone_ids, true ) ) {
				++$registry_records_removed;
				continue;
			}

			if ( in_array( $zone_id, $orphan_zone_ids, true ) ) {
				++$orphan_records_cleaned;
				continue;
			}

			$method_instance_ids = $orphan_method_records[ $zone_id ] ?? array();
			if ( array() !== $method_instance_ids ) {
				$before_count              = count( $record['methodInstances'] );
				$record['methodInstances'] = array_values(
					array_filter(
						$record['methodInstances'],
						static fn( array $method_instance ): bool => ! in_array( (int) $method_instance['instanceId'], $method_instance_ids, true )
					)
				);
				$removed_method_records    = $before_count - count( $record['methodInstances'] );
				$orphan_records_cleaned   += $removed_method_records;

				if ( $removed_method_records > 0 ) {
					$record['updatedAt'] = gmdate( 'c' );
				}
			}

			$reconciled_records[] = $record;
		}

		if ( ! $this->managed_registry->replace_records( $reconciled_records ) ) {
			$warnings[] = __( 'WooCommerce removal finished, but the managed registry could not be saved.', 'yaxii-shipping-manager' );
		}

		return array(
			'registryRecordsRemoved'       => $registry_records_removed,
			'orphanRegistryRecordsCleaned' => $orphan_records_cleaned,
			'warnings'                     => $warnings,
		);
	}

	/**
	 * @param mixed $records Preview record list.
	 *
	 * @return array<int,int>
	 */
	private function zone_ids_from_records( $records ): array {
		if ( ! is_array( $records ) ) {
			return array();
		}

		$zone_ids = array();

		foreach ( $records as $record ) {
			if ( is_array( $record ) ) {
				$zone_ids[] = (int) ( $record['zoneId'] ?? 0 );
			}
		}

		return array_values( array_filter( $zone_ids ) );
	}

	/**
	 * @param mixed $records Preview orphan method record list.
	 *
	 * @return array<int,array<int,int>>
	 */
	private function orphan_method_records_by_zone( $records ): array {
		if ( ! is_array( $records ) ) {
			return array();
		}

		$by_zone = array();

		foreach ( $records as $record ) {
			if ( ! is_array( $record ) ) {
				continue;
			}

			$zone_id     = (int) ( $record['zoneId'] ?? 0 );
			$instance_id = (int) ( $record['instanceId'] ?? 0 );

			if ( $zone_id <= 0 || $instance_id <= 0 ) {
				continue;
			}

			if ( ! isset( $by_zone[ $zone_id ] ) ) {
				$by_zone[ $zone_id ] = array();
			}

			$by_zone[ $zone_id ][] = $instance_id;
		}

		return $by_zone;
	}

	/**
	 * @param array<int,array<string,mixed>> $deleted_zones Deleted zones.
	 * @param array<string,mixed>            $registry_result Registry cleanup result.
	 */
	private function success_message( array $deleted_zones, array $registry_result ): string {
		$deleted_count = count( $deleted_zones );

		if ( $deleted_count > 0 ) {
			return sprintf(
				/* translators: %d: deleted managed zone count. */
				_n(
					'Removed %d Yaxii-managed zone. Manual WooCommerce zones were not touched.',
					'Removed %d Yaxii-managed zones. Manual WooCommerce zones were not touched.',
					$deleted_count,
					'yaxii-shipping-manager'
				),
				$deleted_count
			);
		}

		if ( (int) $registry_result['orphanRegistryRecordsCleaned'] > 0 ) {
			return __( 'Cleaned missing Yaxii registry records. WooCommerce zones were not changed.', 'yaxii-shipping-manager' );
		}

		return __( 'No removable Yaxii-managed setup was found. WooCommerce zones were not changed.', 'yaxii-shipping-manager' );
	}

	/**
	 * @param mixed $value Value to coerce.
	 *
	 * @return array<int,string>
	 */
	private function string_array( $value ): array {
		if ( ! is_array( $value ) ) {
			return array();
		}

		return array_values(
			array_filter(
				$value,
				static fn( $entry ): bool => is_string( $entry )
			)
		);
	}
}
