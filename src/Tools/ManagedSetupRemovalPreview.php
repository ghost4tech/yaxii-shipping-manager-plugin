<?php
/**
 * Read-only preview for a future managed setup removal tool.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Tools;

use Yaxii\ShippingManager\Apply\ManagedZoneRegistry;
use Yaxii\ShippingManager\WooCommerce\ShippingZoneReader;

defined( 'ABSPATH' ) || exit;

final class ManagedSetupRemovalPreview {
	private const CONFIRMATION_TEXT = 'REMOVE YAXII SETUP';

	private bool $woocommerce_active;
	private ManagedZoneRegistry $managed_registry;
	private ShippingZoneReader $zone_reader;

	public function __construct(
		bool $woocommerce_active,
		ManagedZoneRegistry $managed_registry,
		ShippingZoneReader $zone_reader
	) {
		$this->woocommerce_active = $woocommerce_active;
		$this->managed_registry   = $managed_registry;
		$this->zone_reader        = $zone_reader;
	}

	/**
	 * @return array<string,mixed>
	 */
	public function payload(): array {
		if ( ! $this->woocommerce_active ) {
			return $this->inactive_payload();
		}

		$registry_records = $this->managed_registry->records();
		$zones_by_id      = $this->zones_by_id( $this->zone_reader->zones() );
		$managed_zone_ids = $this->managed_zone_ids( $registry_records );
		$managed_preview  = $this->managed_preview( $registry_records, $zones_by_id );
		$manual_zones     = $this->manual_zones( $zones_by_id, $managed_zone_ids );
		$mismatch_count   = (int) $managed_preview['missingManagedZoneCount'] + (int) $managed_preview['missingManagedMethodCount'];
		$blocked_zones    = $this->blocked_zones( $managed_preview['zonesToRemoveLater'] );
		$removable_zones  = $this->removable_zones( $managed_preview['zonesToRemoveLater'] );
		$generated_at     = gmdate( 'c' );
		$payload          = array(
			'woocommerceActive'          => true,
			'removalAvailable'          => count( $removable_zones ) > 0 || $mismatch_count > 0,
			'dryRunOnly'                => true,
			'managedZoneCount'          => count( $managed_preview['zonesToRemoveLater'] ),
			'managedMethodCount'        => count( $managed_preview['methodsToRemoveLater'] ),
			'missingManagedZoneCount'   => $managed_preview['missingManagedZoneCount'],
			'missingManagedMethodCount' => $managed_preview['missingManagedMethodCount'],
			'manualProtectedZoneCount'  => count( $manual_zones ),
			'registryMismatchCount'     => $mismatch_count,
			'zonesToRemoveLater'        => $managed_preview['zonesToRemoveLater'],
			'methodsToRemoveLater'      => $managed_preview['methodsToRemoveLater'],
			'manualZonesProtected'      => $manual_zones,
			'orphanRegistryRecords'     => $managed_preview['orphanRegistryRecords'],
			'orphanMethodRecords'       => $managed_preview['orphanMethodRecords'],
			'blockedZones'              => $blocked_zones,
			'registryWarnings'          => $managed_preview['registryWarnings'],
			'blockingReasons'           => $this->blocking_reasons( $blocked_zones ),
			'requiredConfirmationText'  => self::CONFIRMATION_TEXT,
			'message'                   => __( 'This is a dry run. Nothing was deleted.', 'yaxii-shipping-manager' ),
			'generatedAt'               => $generated_at,
			'dryRunGeneratedAt'         => $generated_at,
		);

		$payload['acceptedSummary'] = $this->accepted_summary( $payload );
		$payload['dryRunHash']      = $this->dry_run_hash( $payload );

		return $payload;
	}

	/**
	 * @return array<string,mixed>
	 */
	private function inactive_payload(): array {
		$generated_at = gmdate( 'c' );
		$payload      = array(
			'woocommerceActive'          => false,
			'removalAvailable'          => false,
			'dryRunOnly'                => true,
			'managedZoneCount'          => 0,
			'managedMethodCount'        => 0,
			'missingManagedZoneCount'   => 0,
			'missingManagedMethodCount' => 0,
			'manualProtectedZoneCount'  => 0,
			'registryMismatchCount'     => 0,
			'zonesToRemoveLater'        => array(),
			'methodsToRemoveLater'      => array(),
			'manualZonesProtected'      => array(),
			'orphanRegistryRecords'     => array(),
			'orphanMethodRecords'       => array(),
			'blockedZones'              => array(),
			'registryWarnings'          => array(),
			'blockingReasons'           => array(
				__( 'WooCommerce is inactive, so shipping zones cannot be inspected.', 'yaxii-shipping-manager' ),
			),
			'requiredConfirmationText'  => self::CONFIRMATION_TEXT,
			'message'                   => __( 'WooCommerce is inactive. This dry run did not inspect shipping zones.', 'yaxii-shipping-manager' ),
			'generatedAt'               => $generated_at,
			'dryRunGeneratedAt'         => $generated_at,
		);

		$payload['acceptedSummary'] = $this->accepted_summary( $payload );
		$payload['dryRunHash']      = $this->dry_run_hash( $payload );

		return $payload;
	}

	/**
	 * @param array<int,array<string,mixed>> $registry_records Managed registry records.
	 * @param array<int,array<string,mixed>> $zones_by_id WooCommerce zones indexed by zone ID.
	 *
	 * @return array<string,mixed>
	 */
	private function managed_preview( array $registry_records, array $zones_by_id ): array {
		$preview = $this->empty_managed_preview();

		foreach ( $registry_records as $record ) {
			$this->append_registry_record_preview( $record, $zones_by_id, $preview );
		}

		return $preview;
	}

	/**
	 * @return array<string,mixed>
	 */
	private function empty_managed_preview(): array {
		return array(
			'zonesToRemoveLater'        => array(),
			'methodsToRemoveLater'      => array(),
			'orphanRegistryRecords'     => array(),
			'orphanMethodRecords'       => array(),
			'registryWarnings'          => array(),
			'missingManagedZoneCount'   => 0,
			'missingManagedMethodCount' => 0,
		);
	}

	/**
	 * @param array<string,mixed> $record Managed registry record.
	 * @param array<int,array<string,mixed>> $zones_by_id WooCommerce zones indexed by zone ID.
	 * @param array<string,mixed> $preview Mutable dry-run preview accumulator.
	 */
	private function append_registry_record_preview( array $record, array $zones_by_id, array &$preview ): void {
		$zone_id = (int) $record['zoneId'];
		$zone    = $zones_by_id[ $zone_id ] ?? null;

		if ( null === $zone ) {
			++$preview['missingManagedZoneCount'];
			$this->append_missing_zone_warnings( $record, $preview );
			$preview['orphanRegistryRecords'][] = array(
				'zoneId'     => $zone_id,
				'wilayaCode' => (string) $record['wilayaCode'],
				'zoneName'   => (string) $record['zoneName'],
				'reason'     => __( 'WooCommerce no longer returns this managed zone.', 'yaxii-shipping-manager' ),
			);
			return;
		}

		$preview['zonesToRemoveLater'][] = $this->zone_candidate( $record, $zone );
		$this->append_method_previews( $record, $zone, $preview );
	}

	/**
	 * @param array<string,mixed> $record Managed registry record.
	 * @param array<string,mixed> $preview Mutable dry-run preview accumulator.
	 */
	private function append_missing_zone_warnings( array $record, array &$preview ): void {
		$preview['registryWarnings'][] = sprintf(
			/* translators: 1: WooCommerce zone ID, 2: wilaya code. */
			__( 'Registry references managed zone #%1$d for wilaya %2$s, but WooCommerce no longer returns that zone.', 'yaxii-shipping-manager' ),
			(int) $record['zoneId'],
			(string) $record['wilayaCode']
		);

		$method_count = count( $record['methodInstances'] );
		$preview['missingManagedMethodCount'] += $method_count;

		foreach ( $record['methodInstances'] as $method_instance ) {
			$preview['orphanMethodRecords'][] = array(
				'zoneId'     => (int) $record['zoneId'],
				'wilayaCode' => (string) $record['wilayaCode'],
				'instanceId' => (int) $method_instance['instanceId'],
				'methodKey'  => (string) $method_instance['methodKey'],
				'reason'     => __( 'WooCommerce no longer returns this managed method because the zone is missing.', 'yaxii-shipping-manager' ),
			);
		}
	}

	/**
	 * @param array<string,mixed> $record Managed registry record.
	 * @param array<string,mixed> $zone WooCommerce zone.
	 *
	 * @return array<string,mixed>
	 */
	private function zone_candidate( array $record, array $zone ): array {
		$method_counts     = $this->method_ownership_counts( $record, $zone );
		$blocking_reasons  = $this->zone_blocking_reasons( $record, $zone, $method_counts['unmanagedMethodCount'] );
		$can_remove        = array() === $blocking_reasons;

		return array(
			'zoneId'                   => (int) $record['zoneId'],
			'zoneName'                 => (string) $zone['name'],
			'registryZoneName'         => (string) $record['zoneName'],
			'wilayaCode'               => (string) $record['wilayaCode'],
			'registryRecordStatus'     => 'matched',
			'methodCount'              => $method_counts['methodCount'],
			'registryOwnedMethodCount' => $method_counts['registryOwnedMethodCount'],
			'unmanagedMethodCount'     => $method_counts['unmanagedMethodCount'],
			'recordedMethodCount'      => count( $record['methodInstances'] ),
			'liveMethodCount'          => $method_counts['methodCount'],
			'canRemove'                => $can_remove,
			'blockingReasons'          => $blocking_reasons,
		);
	}

	/**
	 * @param array<string,mixed> $record Managed registry record.
	 * @param array<string,mixed> $zone WooCommerce zone.
	 * @param array<string,mixed> $preview Mutable dry-run preview accumulator.
	 */
	private function append_method_previews( array $record, array $zone, array &$preview ): void {
		foreach ( $record['methodInstances'] as $method_instance ) {
			$live_method = $this->live_method_for_instance( (int) $method_instance['instanceId'], $zone );

			if ( null === $live_method || (string) $live_method['methodId'] !== (string) $method_instance['methodId'] ) {
				++$preview['missingManagedMethodCount'];
				$preview['registryWarnings'][] = $this->missing_method_warning( $record, $method_instance );
				$preview['orphanMethodRecords'][] = array(
					'zoneId'     => (int) $record['zoneId'],
					'wilayaCode' => (string) $record['wilayaCode'],
					'instanceId' => (int) $method_instance['instanceId'],
					'methodKey'  => (string) $method_instance['methodKey'],
					'reason'     => __( 'WooCommerce no longer returns this managed method.', 'yaxii-shipping-manager' ),
				);
				continue;
			}

			$preview['methodsToRemoveLater'][] = $this->method_candidate( $record, $method_instance, $live_method );
		}
	}

	/**
	 * @param array<string,mixed> $record Managed registry record.
	 * @param array<string,mixed> $method_instance Managed registry method.
	 */
	private function missing_method_warning( array $record, array $method_instance ): string {
		return sprintf(
			/* translators: 1: WooCommerce method instance ID, 2: WooCommerce zone ID. */
			__( 'Registry references managed method instance #%1$d in zone #%2$d, but WooCommerce no longer returns a matching method.', 'yaxii-shipping-manager' ),
			(int) $method_instance['instanceId'],
			(int) $record['zoneId']
		);
	}

	/**
	 * @param array<string,mixed> $record Managed registry record.
	 * @param array<string,mixed> $method_instance Managed registry method.
	 * @param array<string,mixed> $live_method WooCommerce method.
	 *
	 * @return array<string,mixed>
	 */
	private function method_candidate( array $record, array $method_instance, array $live_method ): array {
		return array(
			'zoneId'           => (int) $record['zoneId'],
			'wilayaCode'       => (string) $record['wilayaCode'],
			'methodKey'        => (string) $method_instance['methodKey'],
			'instanceId'       => (int) $method_instance['instanceId'],
			'methodId'         => (string) $method_instance['methodId'],
			'title'            => (string) $live_method['title'],
			'registryTitle'    => (string) $method_instance['title'],
			'enabled'          => (bool) ( $live_method['enabled'] ?? false ),
			'lastKnownCost'    => $method_instance['lastKnownCost'],
			'currentKnownCost' => $live_method['cost'],
		);
	}

	/**
	 * @param array<string,mixed> $zone WooCommerce zone.
	 *
	 * @return array<string,mixed>|null
	 */
	private function live_method_for_instance( int $instance_id, array $zone ): ?array {
		if ( ! is_array( $zone['methods'] ?? null ) ) {
			return null;
		}

		foreach ( $zone['methods'] as $method ) {
			if ( is_array( $method ) && $instance_id === (int) ( $method['instanceId'] ?? 0 ) ) {
				return $method;
			}
		}

		return null;
	}

	/**
	 * @param array<int,array<string,mixed>> $zones_by_id WooCommerce zones indexed by zone ID.
	 * @param array<int,int> $managed_zone_ids Managed registry zone IDs.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function manual_zones( array $zones_by_id, array $managed_zone_ids ): array {
		$manual_zones = array();

		foreach ( $zones_by_id as $zone_id => $zone ) {
			if ( in_array( $zone_id, $managed_zone_ids, true ) ) {
				continue;
			}

			$manual_zones[] = array(
				'zoneId'      => $zone_id,
				'zoneName'    => (string) $zone['name'],
				'methodCount' => is_array( $zone['methods'] ?? null ) ? count( $zone['methods'] ) : 0,
				'locations'   => $zone['locations'] ?? array(),
			);
		}

		return $manual_zones;
	}

	/**
	 * @param array<int,array<string,mixed>> $zones WooCommerce zones.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function zones_by_id( array $zones ): array {
		$zones_by_id = array();

		foreach ( $zones as $zone ) {
			$zones_by_id[ (int) $zone['zoneId'] ] = $zone;
		}

		return $zones_by_id;
	}

	/**
	 * @param array<int,array<string,mixed>> $registry_records Managed registry records.
	 *
	 * @return array<int,int>
	 */
	private function managed_zone_ids( array $registry_records ): array {
		return array_values(
			array_map(
				static fn( array $record ): int => (int) $record['zoneId'],
				$registry_records
			)
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $blocked_zones Blocked zone candidates.
	 *
	 * @return array<int,string>
	 */
	private function blocking_reasons( array $blocked_zones ): array {
		if ( array() === $blocked_zones ) {
			return array();
		}

		return array(
			__( 'Removal is blocked because at least one Yaxii-managed zone contains unsupported or unsafe state.', 'yaxii-shipping-manager' ),
		);
	}

	/**
	 * @param array<string,mixed> $record Managed registry record.
	 * @param array<string,mixed> $zone WooCommerce zone.
	 *
	 * @return array<string,int>
	 */
	private function method_ownership_counts( array $record, array $zone ): array {
		$methods             = is_array( $zone['methods'] ?? null ) ? $zone['methods'] : array();
		$registry_method_ids = array();

		foreach ( $record['methodInstances'] as $method_instance ) {
			$registry_method_ids[ (int) $method_instance['instanceId'] ] = (string) $method_instance['methodId'];
		}

		$registry_owned_count = 0;
		$unmanaged_count      = 0;

		foreach ( $methods as $method ) {
			if ( ! is_array( $method ) ) {
				continue;
			}

			$instance_id = (int) ( $method['instanceId'] ?? 0 );
			$method_id   = (string) ( $method['methodId'] ?? '' );

			if ( isset( $registry_method_ids[ $instance_id ] ) && $registry_method_ids[ $instance_id ] === $method_id ) {
				++$registry_owned_count;
				continue;
			}

			++$unmanaged_count;
		}

		return array(
			'methodCount'              => count( $methods ),
			'registryOwnedMethodCount' => $registry_owned_count,
			'unmanagedMethodCount'     => $unmanaged_count,
		);
	}

	/**
	 * @param array<string,mixed> $record Managed registry record.
	 * @param array<string,mixed> $zone WooCommerce zone.
	 *
	 * @return array<int,string>
	 */
	private function zone_blocking_reasons( array $record, array $zone, int $unmanaged_method_count ): array {
		$reasons = array();

		if ( ! $this->has_expected_location( $zone, (string) $record['wilayaCode'] ) ) {
			$reasons[] = __( 'This Yaxii-managed zone does not have the expected Algeria state location. Review it in WooCommerce first.', 'yaxii-shipping-manager' );
		}

		if ( $unmanaged_method_count > 0 ) {
			$reasons[] = __( 'This Yaxii-managed zone contains methods not recorded by Yaxii. Remove or review them in WooCommerce first.', 'yaxii-shipping-manager' );
		}

		return $reasons;
	}

	/**
	 * @param array<string,mixed> $zone WooCommerce zone.
	 */
	private function has_expected_location( array $zone, string $wilaya_code ): bool {
		$expected_code = 'DZ:' . $wilaya_code;
		$locations     = is_array( $zone['locations'] ?? null ) ? $zone['locations'] : array();

		foreach ( $locations as $location ) {
			if (
				is_array( $location )
				&& 'state' === (string) ( $location['type'] ?? '' )
				&& $expected_code === (string) ( $location['code'] ?? '' )
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * @param array<int,array<string,mixed>> $zones Zone candidates.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function blocked_zones( array $zones ): array {
		return array_values(
			array_filter(
				$zones,
				static fn( array $zone ): bool => false === (bool) ( $zone['canRemove'] ?? false )
			)
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $zones Zone candidates.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function removable_zones( array $zones ): array {
		return array_values(
			array_filter(
				$zones,
				static fn( array $zone ): bool => true === (bool) ( $zone['canRemove'] ?? false )
			)
		);
	}

	/**
	 * @param array<string,mixed> $payload Preview payload.
	 *
	 * @return array<string,int>
	 */
	private function accepted_summary( array $payload ): array {
		return array(
			'managedZoneCount'         => (int) $payload['managedZoneCount'],
			'managedMethodCount'       => (int) $payload['managedMethodCount'],
			'registryMismatchCount'    => (int) $payload['registryMismatchCount'],
			'manualProtectedZoneCount' => (int) $payload['manualProtectedZoneCount'],
		);
	}

	/**
	 * @param array<string,mixed> $payload Preview payload.
	 */
	private function dry_run_hash( array $payload ): string {
		$hashable = $payload;
		unset( $hashable['dryRunHash'], $hashable['dryRunGeneratedAt'], $hashable['generatedAt'], $hashable['message'] );

		return hash( 'sha256', (string) wp_json_encode( $this->normalize_for_hash( $hashable ) ) );
	}

	/**
	 * @param mixed $value Value to normalize.
	 *
	 * @return mixed
	 */
	private function normalize_for_hash( $value ) {
		if ( ! is_array( $value ) ) {
			return $value;
		}

		if ( array_values( $value ) === $value ) {
			return array_map( array( $this, 'normalize_for_hash' ), $value );
		}

		ksort( $value );

		foreach ( $value as $key => $nested_value ) {
			$value[ $key ] = $this->normalize_for_hash( $nested_value );
		}

		return $value;
	}
}
