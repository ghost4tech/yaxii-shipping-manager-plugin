<?php
/**
 * Read-only WooCommerce shipping diagnostics.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\WooCommerce;

use Yaxii\ShippingManager\Apply\ManagedZoneRegistry;
use Yaxii\ShippingManager\Data\DatasetMode;
use Yaxii\ShippingManager\Data\DatasetRepository;
use Yaxii\ShippingManager\Settings\SettingsRepository;

defined( 'ABSPATH' ) || exit;

final class ShippingDiagnosticsService {
	private bool $woocommerce_active;
	private DatasetRepository $datasets;
	private SettingsRepository $settings;
	private ShippingZoneReader $zone_reader;
	private ManagedZoneRegistry $managed_registry;

	public function __construct(
		bool $woocommerce_active,
		DatasetRepository $datasets,
		SettingsRepository $settings,
		ShippingZoneReader $zone_reader,
		ManagedZoneRegistry $managed_registry
	) {
		$this->woocommerce_active = $woocommerce_active;
		$this->datasets           = $datasets;
		$this->settings           = $settings;
		$this->zone_reader        = $zone_reader;
		$this->managed_registry   = $managed_registry;
	}

	/**
	 * @return array<string,mixed>
	 */
	public function diagnostics(): array {
		if ( ! $this->woocommerce_active ) {
			return $this->inactive_payload();
		}

		$wilayas             = $this->datasets->wilayas( DatasetMode::CURRENT );
		$zones               = $this->zone_reader->zones();
		$rest_of_world_zone  = $this->zone_reader->rest_of_world_zone();
		$zone_results        = $this->zone_results( $zones, $wilayas );
		$wilaya_results      = $this->wilaya_results( $wilayas, $zone_results );
		$summary             = $this->summary( $wilaya_results, $zone_results, $rest_of_world_zone );

		return array(
			'woocommerceActive' => true,
			'summary'           => $summary,
			'wilayaResults'     => $wilaya_results,
			'zoneResults'       => $zone_results,
			'warnings'          => $this->warnings( $summary ),
			'generatedAt'       => gmdate( 'c' ),
		);
	}

	/**
	 * @return array<string,mixed>
	 */
	private function inactive_payload(): array {
		return array(
			'woocommerceActive' => false,
			'summary'           => array(
				'totalWilayas'            => 69,
				'configuredWilayas'       => 0,
				'missingWilayas'          => 69,
				'duplicateConflictCount'  => 0,
				'zonesWithoutMethods'     => 0,
				'checkoutFallbackRisk'    => 'high',
				'recommendedNextAction'   => __( 'Activate WooCommerce before running shipping diagnostics.', 'yaxii-shipping-manager' ),
				'restOfWorldHasMethods'   => false,
			),
			'wilayaResults'     => array(),
			'zoneResults'       => array(),
			'warnings'          => array( __( 'WooCommerce is inactive, so shipping zones could not be inspected.', 'yaxii-shipping-manager' ) ),
			'generatedAt'       => gmdate( 'c' ),
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $zones WooCommerce zones.
	 * @param array<int,array<string,mixed>> $wilayas Dataset wilayas.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function zone_results( array $zones, array $wilayas ): array {
		$wilayas_by_code = $this->wilayas_by_code( $wilayas );

		return array_values(
			array_map(
				fn( array $zone ): array => $this->zone_result( $zone, $wilayas_by_code ),
				$zones
			)
		);
	}

	/**
	 * @param array<string,mixed>              $zone WooCommerce zone.
	 * @param array<string,array<string,mixed>> $wilayas_by_code Dataset wilayas indexed by code.
	 *
	 * @return array<string,mixed>
	 */
	private function zone_result( array $zone, array $wilayas_by_code ): array {
		$matched_codes   = $this->matched_wilaya_codes( $zone, $wilayas_by_code );
		$overlap_codes   = $this->overlap_wilaya_codes( $zone, $wilayas_by_code );
		$methods         = $this->method_results( $zone['methods'] ?? array() );
		$registry_record = $this->managed_registry->record_for_zone_id( (int) $zone['zoneId'] );

		return array(
			'zoneId'               => (int) $zone['zoneId'],
			'name'                 => (string) $zone['name'],
			'locations'            => $zone['locations'],
			'matchedWilayaCodes'   => $matched_codes,
			'overlapWilayaCodes'   => $overlap_codes,
			'ownershipHint'        => $this->ownership_hint( (string) $zone['name'], $registry_record ),
			'managedMethods'       => $this->managed_method_results( $registry_record ),
			'methodCount'          => count( $methods ),
			'enabledMethodCount'   => count( array_filter( $methods, static fn( array $method ): bool => (bool) $method['enabled'] ) ),
			'disabledMethods'      => count( array_filter( $methods, static fn( array $method ): bool => ! (bool) $method['enabled'] ) ),
			'hasHomeLikeMethod'    => $this->has_title_match( $methods, $this->home_terms() ),
			'hasOfficeLikeMethod'  => $this->has_title_match( $methods, $this->office_terms() ),
			'methods'              => $methods,
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $wilayas Dataset wilayas.
	 * @param array<int,array<string,mixed>> $zone_results Zone diagnostics.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function wilaya_results( array $wilayas, array $zone_results ): array {
		return array_values(
			array_map(
				fn( array $wilaya ): array => $this->wilaya_result( $wilaya, $zone_results ),
				$wilayas
			)
		);
	}

	/**
	 * @param array<string,mixed>             $wilaya Dataset wilaya.
	 * @param array<int,array<string,mixed>> $zone_results Zone diagnostics.
	 *
	 * @return array<string,mixed>
	 */
	private function wilaya_result( array $wilaya, array $zone_results ): array {
		$code           = (string) $wilaya['code'];
		$matching_zones = $this->zones_for_wilaya( $code, $zone_results );
		$status         = $this->wilaya_status( $matching_zones );

		return array(
			'code'      => $code,
			'nameFr'    => (string) $wilaya['name_fr'],
			'nameAr'    => (string) $wilaya['name_ar'],
			'status'    => $status,
			'zoneIds'   => array_values( array_map( static fn( array $zone ): int => (int) $zone['zoneId'], $matching_zones ) ),
			'zoneNames' => array_values( array_map( static fn( array $zone ): string => (string) $zone['name'], $matching_zones ) ),
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $wilaya_results Wilaya diagnostics.
	 * @param array<int,array<string,mixed>> $zone_results Zone diagnostics.
	 * @param array<string,mixed>|null      $rest_of_world_zone Rest-of-world zone.
	 *
	 * @return array<string,mixed>
	 */
	private function summary( array $wilaya_results, array $zone_results, ?array $rest_of_world_zone ): array {
		$total            = count( $wilaya_results );
		$missing          = $this->count_status( $wilaya_results, 'missing' );
		$conflicts        = $this->count_status( $wilaya_results, 'conflict' );
		$without_methods  = count( array_filter( $zone_results, static fn( array $zone ): bool => 0 === (int) $zone['enabledMethodCount'] ) );
		$rest_has_methods = $this->rest_of_world_has_methods( $rest_of_world_zone );
		$risk             = $this->fallback_risk( $total, $missing, $conflicts, $without_methods, $rest_has_methods );

		return array(
			'totalWilayas'           => $total,
			'configuredWilayas'      => $this->count_status( $wilaya_results, 'configured' ),
			'missingWilayas'         => $missing,
			'duplicateConflictCount' => $conflicts,
			'zonesWithoutMethods'    => $without_methods,
			'checkoutFallbackRisk'   => $risk,
			'recommendedNextAction'  => $this->recommended_next_action( $risk ),
			'restOfWorldHasMethods'  => $rest_has_methods,
		);
	}

	/**
	 * @param mixed $methods WooCommerce methods.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function method_results( $methods ): array {
		if ( ! is_array( $methods ) ) {
			return array();
		}

		return array_values(
			array_map(
				static function ( array $method ): array {
					return array(
						'instanceId'  => (int) $method['instanceId'],
						'methodId'    => (string) $method['methodId'],
						'title'       => (string) $method['title'],
						'methodTitle' => (string) $method['methodTitle'],
						'enabled'     => (bool) $method['enabled'],
						'cost'        => $method['cost'],
					);
				},
				$methods
			)
		);
	}

	/**
	 * @param array<string,mixed>|null $registry_record Managed registry record.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function managed_method_results( ?array $registry_record ): array {
		if ( null === $registry_record || ! is_array( $registry_record['methodInstances'] ?? null ) ) {
			return array();
		}

		return array_values(
			array_map(
				static function ( array $method ): array {
					return array(
						'methodKey'     => (string) $method['methodKey'],
						'instanceId'    => (int) $method['instanceId'],
						'methodId'      => (string) $method['methodId'],
						'title'         => (string) $method['title'],
						'lastKnownCost' => isset( $method['lastKnownCost'] ) ? (string) $method['lastKnownCost'] : null,
					);
				},
				$registry_record['methodInstances']
			)
		);
	}

	/**
	 * @param array<string,mixed>                $zone WooCommerce zone.
	 * @param array<string,array<string,mixed>> $wilayas_by_code Dataset wilayas indexed by code.
	 *
	 * @return array<int,string>
	 */
	private function matched_wilaya_codes( array $zone, array $wilayas_by_code ): array {
		$matched_codes = array();

		foreach ( $zone['locations'] as $location ) {
			if (
				'state' === $location['type']
				&& 1 === preg_match( '/^DZ:(\d{2})$/', $location['code'], $matches )
				&& isset( $wilayas_by_code[ $matches[1] ] )
			) {
				$matched_codes[] = $matches[1];
			}
		}

		return array_values( array_unique( $matched_codes ) );
	}

	/**
	 * @param array<string,string>               $location WooCommerce location.
	 * @param array<string,array<string,mixed>> $wilayas_by_code Dataset wilayas indexed by code.
	 *
	 * @return array<int,string>
	 */
	private function overlap_wilaya_codes( array $zone, array $wilayas_by_code ): array {
		$overlap_codes = array();

		foreach ( $zone['locations'] as $location ) {
			$overlap_codes = array_merge( $overlap_codes, $this->location_overlap_codes( $location, $wilayas_by_code ) );
		}

		return array_values( array_unique( $overlap_codes ) );
	}

	/**
	 * @param array<string,string>               $location WooCommerce location.
	 * @param array<string,array<string,mixed>> $wilayas_by_code Dataset wilayas indexed by code.
	 *
	 * @return array<int,string>
	 */
	private function location_overlap_codes( array $location, array $wilayas_by_code ): array {
		if ( 'country' === $location['type'] && 'DZ' === $location['code'] ) {
			return array_keys( $wilayas_by_code );
		}

		if ( 'state' === $location['type'] && 1 === preg_match( '/^DZ:(\d{2})$/', $location['code'], $matches ) ) {
			return isset( $wilayas_by_code[ $matches[1] ] ) ? array( $matches[1] ) : array();
		}

		return array();
	}

	/**
	 * @param array<int,array<string,mixed>> $wilayas Dataset wilayas.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	private function wilayas_by_code( array $wilayas ): array {
		$wilayas_by_code = array();

		foreach ( $wilayas as $wilaya ) {
			$wilayas_by_code[ (string) $wilaya['code'] ] = $wilaya;
		}

		return $wilayas_by_code;
	}

	/**
	 * @param array<int,array<string,mixed>> $zone_results Zone diagnostics.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function zones_for_wilaya( string $code, array $zone_results ): array {
		return array_values(
			array_filter(
				$zone_results,
				static fn( array $zone ): bool => in_array( $code, $zone['matchedWilayaCodes'], true )
			)
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $matching_zones Zones matching one wilaya.
	 */
	private function wilaya_status( array $matching_zones ): string {
		if ( array() === $matching_zones ) {
			return 'missing';
		}

		return count( $matching_zones ) > 1 ? 'conflict' : 'configured';
	}

	/**
	 * @param array<string,mixed>|null $registry_record Managed registry record.
	 */
	private function ownership_hint( string $zone_name, ?array $registry_record ): string {
		if ( null !== $registry_record ) {
			return 'managed_registry';
		}

		$settings    = $this->settings->read();
		$zone_prefix = (string) ( $settings['settings']['zonePrefix'] ?? 'Yaxii' );
		$haystack    = strtolower( $zone_name );

		if ( '' !== $zone_prefix && 0 === strpos( $haystack, strtolower( $zone_prefix ) ) ) {
			return 'yaxii_hint';
		}

		return false !== strpos( $haystack, 'yaxii' ) ? 'yaxii_hint' : 'manual_unknown';
	}

	/**
	 * @return array<int,string>
	 */
	private function home_terms(): array {
		return array( 'home', 'domicile', 'livraison' );
	}

	/**
	 * @return array<int,string>
	 */
	private function office_terms(): array {
		return array( 'office', 'stopdesk', 'bureau' );
	}

	/**
	 * @param array<int,array<string,mixed>> $methods Method diagnostics.
	 * @param array<int,string>             $terms Search terms.
	 */
	private function has_title_match( array $methods, array $terms ): bool {
		foreach ( $methods as $method ) {
			$method_label = strtolower( (string) $method['title'] . ' ' . (string) $method['methodTitle'] );

			foreach ( $terms as $term ) {
				if ( false !== strpos( $method_label, $term ) ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * @param array<int,array<string,mixed>> $wilaya_results Wilaya diagnostics.
	 */
	private function count_status( array $wilaya_results, string $status ): int {
		return count(
			array_filter(
				$wilaya_results,
				static fn( array $wilaya ): bool => $status === $wilaya['status']
			)
		);
	}

	/**
	 * @param array<string,mixed>|null $rest_of_world_zone Rest-of-world zone.
	 */
	private function rest_of_world_has_methods( ?array $rest_of_world_zone ): bool {
		if ( null === $rest_of_world_zone || ! is_array( $rest_of_world_zone['methods'] ?? null ) ) {
			return false;
		}

		foreach ( $rest_of_world_zone['methods'] as $method ) {
			if ( (bool) $method['enabled'] ) {
				return true;
			}
		}

		return false;
	}

	private function fallback_risk( int $total, int $missing, int $conflicts, int $without_methods, bool $rest_has_methods ): string {
		if ( $total === $missing && ! $rest_has_methods ) {
			return 'high';
		}

		if ( $missing > 0 || $conflicts > 0 || $without_methods > 0 ) {
			return 'medium';
		}

		return 'low';
	}

	private function recommended_next_action( string $risk ): string {
		if ( 'high' === $risk ) {
			return __( 'Review missing Algeria coverage before enabling native checkout traffic.', 'yaxii-shipping-manager' );
		}

		if ( 'medium' === $risk ) {
			return __( 'Review missing wilayas, conflicts, and method gaps before preview planning.', 'yaxii-shipping-manager' );
		}

		return __( 'Review the diagnostics, then use the future preview planner before any changes are applied.', 'yaxii-shipping-manager' );
	}

	/**
	 * @param array<string,mixed> $summary Diagnostics summary.
	 *
	 * @return array<int,string>
	 */
	private function warnings( array $summary ): array {
		if ( 'low' === $summary['checkoutFallbackRisk'] ) {
			return array();
		}

		return array( __( 'Diagnostics are read-only and do not prove checkout is fully safe until preview planning is available.', 'yaxii-shipping-manager' ) );
	}
}
