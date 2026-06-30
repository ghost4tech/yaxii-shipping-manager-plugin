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

		return array(
			'woocommerceActive'          => true,
			'removalAvailable'          => false,
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
			'registryWarnings'          => $managed_preview['registryWarnings'],
			'blockingReasons'           => $this->blocking_reasons( $mismatch_count ),
			'requiredConfirmationText'  => self::CONFIRMATION_TEXT,
			'message'                   => __( 'This is a dry run. Nothing was deleted.', 'yaxii-shipping-manager' ),
			'generatedAt'               => gmdate( 'c' ),
		);
	}

	/**
	 * @return array<string,mixed>
	 */
	private function inactive_payload(): array {
		return array(
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
			'registryWarnings'          => array(),
			'blockingReasons'           => array(
				__( 'WooCommerce is inactive, so shipping zones cannot be inspected.', 'yaxii-shipping-manager' ),
			),
			'requiredConfirmationText'  => self::CONFIRMATION_TEXT,
			'message'                   => __( 'WooCommerce is inactive. This dry run did not inspect shipping zones.', 'yaxii-shipping-manager' ),
			'generatedAt'               => gmdate( 'c' ),
		);
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
	}

	/**
	 * @param array<string,mixed> $record Managed registry record.
	 * @param array<string,mixed> $zone WooCommerce zone.
	 *
	 * @return array<string,mixed>
	 */
	private function zone_candidate( array $record, array $zone ): array {
		return array(
			'zoneId'              => (int) $record['zoneId'],
			'zoneName'            => (string) $zone['name'],
			'registryZoneName'    => (string) $record['zoneName'],
			'wilayaCode'          => (string) $record['wilayaCode'],
			'recordedMethodCount' => count( $record['methodInstances'] ),
			'liveMethodCount'     => is_array( $zone['methods'] ?? null ) ? count( $zone['methods'] ) : 0,
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
	 * @return array<int,string>
	 */
	private function blocking_reasons( int $mismatch_count ): array {
		$reasons = array(
			__( 'Actual removal is not implemented yet.', 'yaxii-shipping-manager' ),
		);

		if ( $mismatch_count > 0 ) {
			$reasons[] = __( 'Registry mismatch detected. A future removal step must reconcile this before deleting anything.', 'yaxii-shipping-manager' );
		}

		return $reasons;
	}
}
