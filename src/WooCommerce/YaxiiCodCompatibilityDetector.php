<?php
/**
 * Read-only Yaxii COD Theme compatibility detector.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\WooCommerce;

use Yaxii\ShippingManager\Apply\ManagedZoneRegistry;
use Yaxii\ShippingManager\Data\DatasetRepository;

defined( 'ABSPATH' ) || exit;

final class YaxiiCodCompatibilityDetector {
	private bool $woocommerce_active;
	private DatasetRepository $datasets;
	private ManagedZoneRegistry $managed_registry;

	public function __construct(
		bool $woocommerce_active,
		DatasetRepository $datasets,
		ManagedZoneRegistry $managed_registry
	) {
		$this->woocommerce_active = $woocommerce_active;
		$this->datasets           = $datasets;
		$this->managed_registry   = $managed_registry;
	}

	/**
	 * Normalize known Algeria shipping references.
	 *
	 * @return array{normalizedWilayaCode:string,sourceFormat:string}|null
	 */
	public static function normalize_reference( string $reference ): ?array {
		if ( 1 === preg_match( '/^DZ:(\d{2})$/', $reference, $matches ) ) {
			return array(
				'normalizedWilayaCode' => $matches[1],
				'sourceFormat'         => 'ysm_current',
			);
		}

		if ( 1 === preg_match( '/^DZ:DZ-(\d{2})$/', $reference, $matches ) ) {
			return array(
				'normalizedWilayaCode' => $matches[1],
				'sourceFormat'         => 'yaxii_cod_theme',
			);
		}

		if ( 1 === preg_match( '/^DZ-(\d{2})$/', $reference, $matches ) ) {
			return array(
				'normalizedWilayaCode' => $matches[1],
				'sourceFormat'         => 'theme_state_key',
			);
		}

		return null;
	}

	/**
	 * @param array<int,array<string,mixed>> $zones WooCommerce zone records.
	 *
	 * @return array<string,mixed>
	 */
	public function detect( array $zones ): array {
		if ( ! $this->woocommerce_active ) {
			return $this->empty_result();
		}

		$theme               = $this->active_theme_info();
		$zone_map            = $this->yaxii_cod_zone_map();
		$theme_zone_ids      = $this->theme_zone_ids( $zone_map );
		$zones_by_wilaya     = $this->zones_by_normalized_wilaya( $zones, $zone_map, $theme_zone_ids );
		$duplicate_codes     = $this->duplicate_codes( $zones_by_wilaya );
		$source_formats      = $this->source_formats( $zones_by_wilaya );
		$yaxii_cod_zone_ids  = $this->yaxii_cod_zone_ids( $zones_by_wilaya );
		$legacy_only         = $this->legacy_only_coverage_detected( $zones_by_wilaya );
		$state_mismatch     = $this->state_format_mismatch_detected( $source_formats );
		$theme_setup_found   = (bool) $theme['looksLikeYaxiiCodTheme'] || array() !== $zone_map || array() !== $yaxii_cod_zone_ids;
		$checkout_risk       = $this->checkout_risk( (bool) $theme['looksLikeYaxiiCodTheme'], $theme_setup_found, $state_mismatch, $duplicate_codes );

		return array(
			'yaxiiCodThemeDetected'          => $theme_setup_found,
			'yaxiiCodThemeActive'            => (bool) $theme['looksLikeYaxiiCodTheme'],
			'yaxiiCodZoneMapDetected'        => array() !== $zone_map,
			'yaxiiCodZoneMapCount'           => count( $zone_map ),
			'yaxiiCodZoneCount'              => count( $yaxii_cod_zone_ids ),
			'ysmManagedZoneCount'            => $this->managed_registry->managed_zone_count(),
			'normalizedDuplicateWilayaCount' => count( $duplicate_codes ),
			'legacyOnlyCoverageDetected'     => $legacy_only,
			'stateFormatMismatchDetected'    => $state_mismatch,
			'checkoutCompatibilityRisk'      => $checkout_risk,
			'activeTheme'                    => $theme,
			'zonesByNormalizedWilaya'        => array_values( $zones_by_wilaya ),
			'duplicateNormalizedWilayas'     => $duplicate_codes,
			'warnings'                       => $this->warnings( $theme_setup_found, $duplicate_codes, $state_mismatch, $checkout_risk ),
			'recommendations'                => $this->recommendations( $theme_setup_found, $duplicate_codes, $state_mismatch, $checkout_risk ),
		);
	}

	/**
	 * @return array<string,mixed>
	 */
	private function empty_result(): array {
		return array(
			'yaxiiCodThemeDetected'          => false,
			'yaxiiCodThemeActive'            => false,
			'yaxiiCodZoneMapDetected'        => false,
			'yaxiiCodZoneMapCount'           => 0,
			'yaxiiCodZoneCount'              => 0,
			'ysmManagedZoneCount'            => 0,
			'normalizedDuplicateWilayaCount' => 0,
			'legacyOnlyCoverageDetected'     => false,
			'stateFormatMismatchDetected'    => false,
			'checkoutCompatibilityRisk'      => 'none',
			'activeTheme'                    => array(
				'name'                    => '',
				'stylesheet'              => '',
				'template'                => '',
				'looksLikeYaxiiCodTheme'  => false,
			),
			'zonesByNormalizedWilaya'        => array(),
			'duplicateNormalizedWilayas'     => array(),
			'warnings'                       => array(),
			'recommendations'                => array(),
		);
	}

	/**
	 * @return array{name:string,stylesheet:string,template:string,looksLikeYaxiiCodTheme:bool}
	 */
	private function active_theme_info(): array {
		if ( ! function_exists( 'wp_get_theme' ) ) {
			return array(
				'name'                   => '',
				'stylesheet'             => '',
				'template'               => '',
				'looksLikeYaxiiCodTheme' => false,
			);
		}

		$theme      = wp_get_theme();
		$name       = (string) $theme->get( 'Name' );
		$stylesheet = (string) $theme->get_stylesheet();
		$template   = (string) $theme->get_template();
		$haystack   = strtolower( $name . ' ' . $stylesheet . ' ' . $template );

		return array(
			'name'                   => $name,
			'stylesheet'             => $stylesheet,
			'template'               => $template,
			'looksLikeYaxiiCodTheme' => false !== strpos( $haystack, 'yaxii-cod' )
				|| false !== strpos( $haystack, 'yaxii cod' ),
		);
	}

	/**
	 * @return array<string,int>
	 */
	private function yaxii_cod_zone_map(): array {
		$stored = get_option( 'yaxii_zone_map', array() );
		if ( ! is_array( $stored ) ) {
			return array();
		}

		$zone_map = array();
		foreach ( $stored as $state_key => $zone_id ) {
			$normalized = self::normalize_reference( (string) $state_key );
			$zone_id    = (int) $zone_id;
			if ( null === $normalized || $zone_id <= 0 ) {
				continue;
			}

			$zone_map[ (string) $state_key ] = $zone_id;
		}

		return $zone_map;
	}

	/**
	 * @param array<string,int> $zone_map Yaxii COD map.
	 *
	 * @return array<int,int>
	 */
	private function theme_zone_ids( array $zone_map ): array {
		return array_values( array_unique( array_values( $zone_map ) ) );
	}

	/**
	 * @param array<int,array<string,mixed>> $zones WooCommerce zones.
	 * @param array<string,int>             $zone_map Yaxii COD map.
	 * @param array<int,int>                $theme_zone_ids Zone IDs from the Yaxii COD map.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	private function zones_by_normalized_wilaya( array $zones, array $zone_map, array $theme_zone_ids ): array {
		$groups        = array();
		$zones_by_id   = $this->zones_by_id( $zones );
		$recorded_keys = array();

		foreach ( $zones as $zone ) {
			foreach ( $zone['locations'] ?? array() as $location ) {
				$normalized = self::normalize_reference( (string) ( $location['code'] ?? '' ) );
				if ( null === $normalized ) {
					continue;
				}

				$entry = $this->zone_entry( $zone, $location, $normalized, $theme_zone_ids );
				$key   = $this->group_entry_key( $entry );
				$code  = (string) $entry['normalizedWilayaCode'];
				$recorded_keys[ $key ] = true;
				$groups[ $code ]       = $this->group_with_entry( $groups[ $code ] ?? null, $entry );
			}
		}

		foreach ( $zone_map as $state_key => $zone_id ) {
			$normalized = self::normalize_reference( (string) $state_key );
			if ( null === $normalized ) {
				continue;
			}

			$entry = $this->zone_map_entry( (string) $state_key, $zone_id, $zones_by_id[ $zone_id ] ?? null );
			$key   = $this->group_entry_key( $entry );
			if ( isset( $recorded_keys[ $key ] ) ) {
				continue;
			}

			$code            = (string) $entry['normalizedWilayaCode'];
			$groups[ $code ] = $this->group_with_entry( $groups[ $code ] ?? null, $entry );
		}

		ksort( $groups );
		return $groups;
	}

	/**
	 * @param array<int,array<string,mixed>> $zones WooCommerce zones.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function zones_by_id( array $zones ): array {
		$zones_by_id = array();

		foreach ( $zones as $zone ) {
			$zones_by_id[ (int) ( $zone['zoneId'] ?? 0 ) ] = $zone;
		}

		return $zones_by_id;
	}

	/**
	 * @param array<string,mixed> $zone WooCommerce zone.
	 * @param array<string,mixed> $location WooCommerce location.
	 * @param array<string,string> $normalized Normalized reference.
	 * @param array<int,int>      $theme_zone_ids Zone IDs from the Yaxii COD map.
	 *
	 * @return array<string,mixed>
	 */
	private function zone_entry( array $zone, array $location, array $normalized, array $theme_zone_ids ): array {
		$zone_id       = (int) ( $zone['zoneId'] ?? 0 );
		$source_format = (string) $normalized['sourceFormat'];

		return array(
			'normalizedWilayaCode' => (string) $normalized['normalizedWilayaCode'],
			'zoneId'               => $zone_id,
			'zoneName'             => (string) ( $zone['name'] ?? '' ),
			'locationCode'         => (string) ( $location['code'] ?? '' ),
			'locationFormat'       => $source_format,
			'sourceFormat'         => $source_format,
			'sourceClassification' => $this->source_classification( $zone, $source_format, $theme_zone_ids ),
		);
	}

	/**
	 * @param array<string,mixed>|null $zone WooCommerce zone.
	 *
	 * @return array<string,mixed>
	 */
	private function zone_map_entry( string $state_key, int $zone_id, ?array $zone ): array {
		$normalized = self::normalize_reference( $state_key );

		return array(
			'normalizedWilayaCode' => (string) $normalized['normalizedWilayaCode'],
			'zoneId'               => $zone_id,
			'zoneName'             => null === $zone ? '' : (string) ( $zone['name'] ?? '' ),
			'locationCode'         => $state_key,
			'locationFormat'       => 'theme_zone_map',
			'sourceFormat'         => 'theme_zone_map',
			'sourceClassification' => 'Yaxii COD Theme',
		);
	}

	/**
	 * @param array<string,mixed> $zone WooCommerce zone.
	 * @param array<int,int>      $theme_zone_ids Zone IDs from the Yaxii COD map.
	 */
	private function source_classification( array $zone, string $source_format, array $theme_zone_ids ): string {
		$zone_id = (int) ( $zone['zoneId'] ?? 0 );
		if ( null !== $this->managed_registry->record_for_zone_id( $zone_id ) ) {
			return 'Yaxii Shipping Manager';
		}

		if ( in_array( $zone_id, $theme_zone_ids, true ) ) {
			return 'Yaxii COD Theme';
		}

		if ( 'yaxii_cod_theme' === $source_format || false !== strpos( strtolower( (string) ( $zone['name'] ?? '' ) ), 'yaxii' ) ) {
			return 'External Yaxii zone';
		}

		return 'Manual WooCommerce zone';
	}

	/**
	 * @param array<string,mixed>|null $group Existing group.
	 * @param array<string,mixed>      $entry Group entry.
	 *
	 * @return array<string,mixed>
	 */
	private function group_with_entry( ?array $group, array $entry ): array {
		if ( null === $group ) {
			$group = array(
				'normalizedWilayaCode' => (string) $entry['normalizedWilayaCode'],
				'duplicate'            => false,
				'entries'              => array(),
			);
		}

		$group['entries'][] = $entry;
		$zone_ids           = array_values( array_unique( array_map( static fn( array $item ): int => (int) $item['zoneId'], $group['entries'] ) ) );
		$group['duplicate'] = count( $zone_ids ) > 1;

		return $group;
	}

	/**
	 * @param array<string,mixed> $entry Group entry.
	 */
	private function group_entry_key( array $entry ): string {
		return implode(
			'|',
			array(
				(string) $entry['normalizedWilayaCode'],
				(string) $entry['zoneId'],
				(string) $entry['sourceFormat'],
			)
		);
	}

	/**
	 * @param array<string,array<string,mixed>> $groups Groups keyed by normalized code.
	 *
	 * @return array<int,string>
	 */
	private function duplicate_codes( array $groups ): array {
		return array_values(
			array_keys(
				array_filter(
					$groups,
					static fn( array $group ): bool => (bool) $group['duplicate']
				)
			)
		);
	}

	/**
	 * @param array<string,array<string,mixed>> $groups Groups keyed by normalized code.
	 *
	 * @return array<int,string>
	 */
	private function source_formats( array $groups ): array {
		$formats = array();

		foreach ( $groups as $group ) {
			foreach ( $group['entries'] as $entry ) {
				$formats[] = (string) $entry['sourceFormat'];
			}
		}

		return array_values( array_unique( $formats ) );
	}

	/**
	 * @param array<string,array<string,mixed>> $groups Groups keyed by normalized code.
	 *
	 * @return array<int,int>
	 */
	private function yaxii_cod_zone_ids( array $groups ): array {
		$zone_ids = array();

		foreach ( $groups as $group ) {
			foreach ( $group['entries'] as $entry ) {
				if ( in_array( $entry['sourceClassification'], array( 'Yaxii COD Theme', 'External Yaxii zone' ), true ) ) {
					$zone_ids[] = (int) $entry['zoneId'];
				}
			}
		}

		return array_values( array_unique( array_filter( $zone_ids ) ) );
	}

	/**
	 * @param array<string,array<string,mixed>> $groups Groups keyed by normalized code.
	 */
	private function legacy_only_coverage_detected( array $groups ): bool {
		if ( array() === $groups ) {
			return false;
		}

		$status = $this->datasets->dataset_status();
		if ( (int) ( $status['legacy58']['wilayaCount'] ?? 0 ) >= (int) ( $status['current']['wilayaCount'] ?? 0 ) ) {
			return false;
		}

		foreach ( array_keys( $groups ) as $code ) {
			if ( (int) $code > 58 ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * @param array<int,string> $source_formats Source format codes.
	 */
	private function state_format_mismatch_detected( array $source_formats ): bool {
		$has_theme_format = in_array( 'yaxii_cod_theme', $source_formats, true ) || in_array( 'theme_zone_map', $source_formats, true );

		return $has_theme_format && in_array( 'ysm_current', $source_formats, true );
	}

	/**
	 * @param array<int,string> $duplicate_codes Duplicate normalized codes.
	 */
	private function checkout_risk( bool $theme_active, bool $theme_setup_found, bool $state_mismatch, array $duplicate_codes ): string {
		if ( ! $theme_setup_found ) {
			return 'none';
		}

		if ( $theme_active && ( $state_mismatch || array() !== $duplicate_codes ) ) {
			return 'high';
		}

		if ( $theme_active || $state_mismatch || array() !== $duplicate_codes ) {
			return 'medium';
		}

		return 'low';
	}

	/**
	 * @param array<int,string> $duplicate_codes Duplicate normalized codes.
	 *
	 * @return array<int,string>
	 */
	private function warnings( bool $theme_setup_found, array $duplicate_codes, bool $state_mismatch, string $checkout_risk ): array {
		$warnings = array();

		if ( $theme_setup_found ) {
			$warnings[] = __( 'Existing Yaxii COD shipping setup was detected. Yaxii Shipping Manager will not edit those zones automatically.', 'yaxii-shipping-manager' );
		}

		if ( array() !== $duplicate_codes ) {
			$warnings[] = __( 'Duplicate shipping zones appear to cover one or more wilayas using different code formats.', 'yaxii-shipping-manager' );
		}

		if ( $state_mismatch ) {
			$warnings[] = __( 'Mixed Algeria state-code formats were detected across WooCommerce shipping zones.', 'yaxii-shipping-manager' );
		}

		if ( in_array( $checkout_risk, array( 'medium', 'high' ), true ) ) {
			$warnings[] = __( 'Yaxii COD Theme checkout may use its own zone map until a bridge is added.', 'yaxii-shipping-manager' );
		}

		return $warnings;
	}

	/**
	 * @param array<int,string> $duplicate_codes Duplicate normalized codes.
	 *
	 * @return array<int,string>
	 */
	private function recommendations( bool $theme_setup_found, array $duplicate_codes, bool $state_mismatch, string $checkout_risk ): array {
		$recommendations = array();

		if ( $theme_setup_found ) {
			$recommendations[] = __( 'Review Diagnostics before generating new zones on stores that already use Yaxii COD Theme shipping.', 'yaxii-shipping-manager' );
		}

		if ( array() !== $duplicate_codes ) {
			$recommendations[] = __( 'Review duplicate wilayas in WooCommerce zones before applying any setup changes.', 'yaxii-shipping-manager' );
		}

		if ( $state_mismatch ) {
			$recommendations[] = __( 'Keep theme-owned zones read-only until a preview-based compatibility bridge is designed.', 'yaxii-shipping-manager' );
		}

		if ( in_array( $checkout_risk, array( 'medium', 'high' ), true ) ) {
			$recommendations[] = __( 'Do not assume Yaxii Shipping Manager zones power Yaxii COD Theme checkout without bridge verification.', 'yaxii-shipping-manager' );
		}

		return $recommendations;
	}
}
