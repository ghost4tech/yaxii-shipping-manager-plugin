<?php
/**
 * Read-only WooCommerce preview planner.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Preview;

use Yaxii\ShippingManager\Apply\ApplyReadinessEvaluator;
use Yaxii\ShippingManager\Apply\ManagedZoneRegistry;
use Yaxii\ShippingManager\Data\DatasetMode;
use Yaxii\ShippingManager\Data\DatasetRepository;
use Yaxii\ShippingManager\Settings\SettingsRepository;
use Yaxii\ShippingManager\WooCommerce\ShippingDiagnosticsService;

defined( 'ABSPATH' ) || exit;

final class PreviewPlanner {
	private DatasetRepository $datasets;
	private SettingsRepository $settings;
	private ShippingDiagnosticsService $diagnostics;
	private ManagedZoneRegistry $managed_registry;

	public function __construct(
		DatasetRepository $datasets,
		SettingsRepository $settings,
		ShippingDiagnosticsService $diagnostics,
		ManagedZoneRegistry $managed_registry
	) {
		$this->datasets         = $datasets;
		$this->settings         = $settings;
		$this->diagnostics      = $diagnostics;
		$this->managed_registry = $managed_registry;
	}

	/**
	 * @param array<string,mixed> $overrides Sanitized preview overrides.
	 *
	 * @return array<string,mixed>
	 */
	public function plan( array $overrides ): array {
		$settings_payload = $this->settings->read();
		$settings         = $this->preview_settings( $settings_payload['settings'], $overrides );
		$wilayas          = $this->datasets->wilayas( DatasetMode::CURRENT );
		$diagnostics      = $this->diagnostics->diagnostics();
		$context          = $this->planning_context( $settings, $wilayas, $diagnostics, $overrides );
		$selected_count   = count( $context['selectedCodes'] );
		$plan_groups      = $this->empty_plan_groups();

		foreach ( $context['wilayas'] as $wilaya ) {
			$this->plan_wilaya( $wilaya, $context, $plan_groups );
		}

		$warning_messages        = $this->plan_warnings( $diagnostics, $plan_groups );
		$plan_groups['warnings'] = $this->warning_items( $warning_messages );
		$this->sort_plan_groups( $plan_groups );

		return array(
			'summary'              => $this->summary( $plan_groups, $selected_count ),
			'plan'                 => $plan_groups,
			'applyReadiness'       => $this->apply_readiness( $plan_groups, $diagnostics, $settings['safetyPolicy'], $selected_count ),
			'warnings'             => $warning_messages,
			'generatedAt'          => gmdate( 'c' ),
			'safetyPolicy'         => $settings['safetyPolicy'],
			'canApplyLater'        => false,
			'canApplyLaterMessage' => __( 'Apply engine is not implemented yet.', 'yaxii-shipping-manager' ),
		);
	}

	/**
	 * @param array<string,mixed> $settings Persisted settings.
	 * @param array<string,mixed> $overrides Preview overrides.
	 *
	 * @return array<string,mixed>
	 */
	private function preview_settings( array $settings, array $overrides ): array {
		foreach ( array( 'regionLabelFormat', 'zoneNameFormat', 'zonePrefix' ) as $field ) {
			if ( array_key_exists( $field, $overrides ) ) {
				$settings[ $field ] = $overrides[ $field ];
			}
		}

		if ( isset( $overrides['methods'] ) && is_array( $overrides['methods'] ) ) {
			$settings['methods'] = $overrides['methods'];
		}

		return $settings;
	}

	/**
	 * @param array<string,array<int,array<string,mixed>>> $plan_groups Preview plan groups.
	 * @param array<string,mixed>                          $diagnostics Diagnostics payload.
	 * @param array<string,mixed>                          $safety_policy Locked safety policy.
	 *
	 * @return array<string,mixed>
	 */
	private function apply_readiness( array $plan_groups, array $diagnostics, array $safety_policy, int $selected_count ): array {
		$evaluator = new ApplyReadinessEvaluator();

		return $evaluator->evaluate(
			array(
				'planGroups'    => $plan_groups,
				'diagnostics'   => $diagnostics,
				'applyContract' => $this->apply_contract_payload(),
				'safetyPolicy'  => $safety_policy,
				'selectedCount' => $selected_count,
			)
		);
	}

	/**
	 * @return array<string,mixed>
	 */
	private function apply_contract_payload(): array {
		return array(
			'applyEngineAvailable'     => false,
			'managedRegistryAvailable' => true,
			'managedRegistryOption'    => ManagedZoneRegistry::OPTION_NAME,
			'managedZoneCount'         => $this->managed_registry->managed_zone_count(),
		);
	}

	/**
	 * @param array<string,mixed>            $settings Preview settings.
	 * @param array<int,array<string,mixed>> $wilayas Dataset wilayas.
	 * @param array<string,mixed>            $diagnostics Diagnostics payload.
	 * @param array<string,mixed>            $overrides Preview overrides.
	 *
	 * @return array<string,mixed>
	 */
	private function planning_context( array $settings, array $wilayas, array $diagnostics, array $overrides ): array {
		return array(
			'settings'       => $settings,
			'wilayas'        => $wilayas,
			'selectedCodes'  => $this->selected_codes( $wilayas, $overrides ),
			'pricingRows'    => $this->pricing_rows_by_code( $overrides['pricingRows'] ?? array() ),
			'methods'        => $this->enabled_methods( $settings['methods'] ?? array() ),
			'zoneResults'    => $diagnostics['zoneResults'] ?? array(),
		);
	}

	/**
	 * @return array<string,array<int,array<string,mixed>>>
	 */
	private function empty_plan_groups(): array {
		return array(
			'createZones'     => array(),
			'updateZones'     => array(),
			'addMethods'      => array(),
			'updateMethods'   => array(),
			'skipManualZones' => array(),
			'conflicts'       => array(),
			'warnings'        => array(),
			'unchanged'       => array(),
		);
	}

	/**
	 * @param array<string,mixed>               $wilaya Dataset wilaya.
	 * @param array<string,mixed>               $context Planning context.
	 * @param array<string,array<int,array<string,mixed>>> $plan_groups Mutable plan groups.
	 */
	private function plan_wilaya( array $wilaya, array $context, array &$plan_groups ): void {
		$code = (string) $wilaya['code'];
		if ( ! in_array( $code, $context['selectedCodes'], true ) ) {
			return;
		}

		$zones = $this->direct_zones_for_wilaya( $code, $context['zoneResults'] );
		if ( count( $zones ) > 1 ) {
			$plan_groups['conflicts'][] = $this->conflict_item( $wilaya, $zones );
			return;
		}

		$manual_zone = $this->manual_zone_for_wilaya( $code, $context['zoneResults'] );
		if ( null !== $manual_zone ) {
			$plan_groups['skipManualZones'][] = $this->manual_skip_item( $wilaya, $manual_zone );
			return;
		}

		if ( array() === $zones ) {
			$plan_groups['createZones'][] = $this->create_zone_item( $wilaya, $context );
			return;
		}

		$this->plan_managed_zone( $wilaya, $zones[0], $context, $plan_groups );
	}

	/**
	 * @param array<string,mixed> $wilaya Dataset wilaya.
	 * @param array<string,mixed> $zone Zone diagnostics.
	 * @param array<string,mixed> $context Planning context.
	 * @param array<string,array<int,array<string,mixed>>> $plan_groups Mutable plan groups.
	 */
	private function plan_managed_zone( array $wilaya, array $zone, array $context, array &$plan_groups ): void {
		$zone_name = $this->zone_name( $wilaya, $context['settings'] );
		$changed   = false;

		if ( $zone_name !== (string) $zone['name'] ) {
			$plan_groups['updateZones'][] = $this->update_zone_item( $wilaya, $zone, $zone_name );
			$changed                      = true;
		}

		foreach ( $this->desired_methods( $wilaya, $context ) as $desired_method ) {
			$method_change = $this->method_change( $zone, $desired_method );
			if ( 'add' === $method_change['action'] ) {
				$plan_groups['addMethods'][] = $this->method_item( $wilaya, $zone, $desired_method, 'method_addition' );
				$changed                     = true;
			}

			if ( 'update' === $method_change['action'] ) {
				$plan_groups['updateMethods'][] = $this->method_item( $wilaya, $zone, $desired_method, 'method_update' );
				$changed                        = true;
			}
		}

		if ( ! $changed ) {
			$plan_groups['unchanged'][] = $this->unchanged_item( $wilaya, $zone );
		}
	}

	/**
	 * @param array<string,mixed> $zone Zone diagnostics.
	 * @param array<string,mixed> $desired_method Desired method.
	 *
	 * @return array<string,string>
	 */
	private function method_change( array $zone, array $desired_method ): array {
		$existing_method = $this->matching_method( $zone['methods'] ?? array(), $desired_method );
		if ( null === $existing_method ) {
			return array( 'action' => 'add' );
		}

		$desired_cost = $this->price_to_string( $desired_method['price'] );
		if ( (string) ( $existing_method['title'] ?? '' ) !== $desired_method['label'] ) {
			return array( 'action' => 'update' );
		}

		if ( $desired_cost !== (string) ( $existing_method['cost'] ?? '' ) ) {
			return array( 'action' => 'update' );
		}

		return array( 'action' => 'none' );
	}

	/**
	 * @param array<int,array<string,mixed>> $methods Existing methods.
	 * @param array<string,mixed>           $desired_method Desired method.
	 *
	 * @return array<string,mixed>|null
	 */
	private function matching_method( array $methods, array $desired_method ): ?array {
		foreach ( $methods as $method ) {
			if ( strtolower( (string) $method['title'] ) === strtolower( $desired_method['label'] ) ) {
				return $method;
			}
		}

		return $this->heuristic_method_match( $methods, (string) $desired_method['key'] );
	}

	/**
	 * @param array<int,array<string,mixed>> $methods Existing methods.
	 *
	 * @return array<string,mixed>|null
	 */
	private function heuristic_method_match( array $methods, string $method_key ): ?array {
		if ( 'home_delivery' !== $method_key && 'office_delivery' !== $method_key ) {
			return null;
		}

		$terms = 'office_delivery' === $method_key ? array( 'office', 'stopdesk', 'bureau' ) : array( 'home', 'domicile', 'livraison' );

		foreach ( $methods as $method ) {
			$title = strtolower( (string) $method['title'] . ' ' . (string) $method['methodTitle'] );
			foreach ( $terms as $term ) {
				if ( false !== strpos( $title, $term ) ) {
					return $method;
				}
			}
		}

		return null;
	}

	/**
	 * @param array<string,mixed> $wilaya Dataset wilaya.
	 * @param array<string,mixed> $context Planning context.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function desired_methods( array $wilaya, array $context ): array {
		$pricing_row = $context['pricingRows'][ (string) $wilaya['code'] ] ?? array();
		$methods     = array();

		foreach ( $context['methods'] as $method ) {
			$price = $pricing_row['methods'][ $method['key'] ] ?? $method['defaultPrice'];
			if ( null === $price ) {
				continue;
			}

			$methods[] = array(
				'key'   => (string) $method['key'],
				'label' => (string) $method['label'],
				'price' => $price,
			);
		}

		return $methods;
	}

	/**
	 * @param array<string,mixed> $wilaya Dataset wilaya.
	 * @param array<string,mixed> $context Planning context.
	 *
	 * @return array<string,mixed>
	 */
	private function create_zone_item( array $wilaya, array $context ): array {
		return array(
			'type'            => 'create_zone',
			'wilayaCode'      => (string) $wilaya['code'],
			'wilayaName'      => (string) $wilaya['name_fr'],
			'zoneName'        => $this->zone_name( $wilaya, $context['settings'] ),
			'location'        => 'DZ:' . (string) $wilaya['code'],
			'methods'         => $this->desired_methods( $wilaya, $context ),
			'ownershipSource' => 'managed_registry',
			'reason'          => __( 'No direct WooCommerce zone exists for this wilaya. A future apply engine would record it in the Yaxii managed registry.', 'yaxii-shipping-manager' ),
		);
	}

	/**
	 * @param array<string,mixed> $wilaya Dataset wilaya.
	 * @param array<string,mixed> $zone Zone diagnostics.
	 */
	private function update_zone_item( array $wilaya, array $zone, string $zone_name ): array {
		return array(
			'type'            => 'update_zone',
			'wilayaCode'      => (string) $wilaya['code'],
			'wilayaName'      => (string) $wilaya['name_fr'],
			'zoneId'          => (int) $zone['zoneId'],
			'currentName'     => (string) $zone['name'],
			'zoneName'        => $zone_name,
			'ownershipSource' => $this->ownership_source( $zone ),
			'reason'          => __( 'Existing Yaxii-managed or Yaxii-looking zone name differs from the current draft.', 'yaxii-shipping-manager' ),
		);
	}

	/**
	 * @param array<string,mixed> $wilaya Dataset wilaya.
	 * @param array<string,mixed> $zone Zone diagnostics.
	 * @param array<string,mixed> $method Desired method.
	 */
	private function method_item( array $wilaya, array $zone, array $method, string $type ): array {
		return array(
			'type'            => $type,
			'wilayaCode'      => (string) $wilaya['code'],
			'wilayaName'      => (string) $wilaya['name_fr'],
			'zoneId'          => (int) $zone['zoneId'],
			'zoneName'        => (string) $zone['name'],
			'methodKey'       => (string) $method['key'],
			'label'           => (string) $method['label'],
			'price'           => $method['price'],
			'ownershipSource' => $this->ownership_source( $zone ),
		);
	}

	/**
	 * @param array<string,mixed>             $wilaya Dataset wilaya.
	 * @param array<int,array<string,mixed>> $zones Conflicting zones.
	 *
	 * @return array<string,mixed>
	 */
	private function conflict_item( array $wilaya, array $zones ): array {
		return array(
			'type'             => 'duplicate_zone',
			'wilayaCode'       => (string) $wilaya['code'],
			'wilayaName'       => (string) $wilaya['name_fr'],
			'zoneIds'          => array_values( array_map( static fn( array $zone ): int => (int) $zone['zoneId'], $zones ) ),
			'zoneNames'        => array_values( array_map( static fn( array $zone ): string => (string) $zone['name'], $zones ) ),
			'ownershipSource'  => 'manual_unknown',
			'ownershipSources' => array_values( array_unique( array_map( fn( array $zone ): string => $this->ownership_source( $zone ), $zones ) ) ),
			'reason'           => __( 'Multiple direct WooCommerce zones match this wilaya.', 'yaxii-shipping-manager' ),
		);
	}

	/**
	 * @param array<string,mixed> $wilaya Dataset wilaya.
	 * @param array<string,mixed> $zone Manual zone.
	 */
	private function manual_skip_item( array $wilaya, array $zone ): array {
		return array(
			'type'            => 'skip_manual_zone',
			'wilayaCode'      => (string) $wilaya['code'],
			'wilayaName'      => (string) $wilaya['name_fr'],
			'zoneId'          => (int) $zone['zoneId'],
			'zoneName'        => (string) $zone['name'],
			'ownershipSource' => $this->ownership_source( $zone ),
			'reason'          => __( 'Manual or unknown WooCommerce zone overlaps this wilaya and is protected by default.', 'yaxii-shipping-manager' ),
		);
	}

	/**
	 * @param array<string,mixed> $wilaya Dataset wilaya.
	 * @param array<string,mixed> $zone Zone diagnostics.
	 */
	private function unchanged_item( array $wilaya, array $zone ): array {
		return array(
			'type'            => 'unchanged',
			'wilayaCode'      => (string) $wilaya['code'],
			'wilayaName'      => (string) $wilaya['name_fr'],
			'zoneId'          => (int) $zone['zoneId'],
			'zoneName'        => (string) $zone['name'],
			'ownershipSource' => $this->ownership_source( $zone ),
			'reason'          => __( 'Existing Yaxii-managed or Yaxii-looking zone already matches the preview draft.', 'yaxii-shipping-manager' ),
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $wilayas Dataset wilayas.
	 * @param array<string,mixed>           $overrides Preview overrides.
	 *
	 * @return array<int,string>
	 */
	private function selected_codes( array $wilayas, array $overrides ): array {
		$known_codes = array_fill_keys(
			array_map( static fn( array $wilaya ): string => (string) $wilaya['code'], $wilayas ),
			true
		);

		if ( isset( $overrides['selectedWilayaCodes'] ) && is_array( $overrides['selectedWilayaCodes'] ) ) {
			return array_values(
				array_filter(
					$overrides['selectedWilayaCodes'],
					static fn( string $code ): bool => isset( $known_codes[ $code ] )
				)
			);
		}

		return array_keys( $known_codes );
	}

	/**
	 * @param mixed $rows Pricing rows.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	private function pricing_rows_by_code( $rows ): array {
		$indexed_rows = array();
		if ( ! is_array( $rows ) ) {
			return $indexed_rows;
		}

		foreach ( $rows as $row ) {
			if ( is_array( $row ) && (bool) ( $row['enabled'] ?? true ) ) {
				$indexed_rows[ (string) $row['wilayaCode'] ] = $row;
			}
		}

		return $indexed_rows;
	}

	/**
	 * @param mixed $methods Method templates.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function enabled_methods( $methods ): array {
		if ( ! is_array( $methods ) ) {
			return array();
		}

		return array_values(
			array_filter(
				$methods,
				static fn( array $method ): bool => (bool) ( $method['enabled'] ?? false ) && 'flat_rate' === ( $method['type'] ?? '' )
			)
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $zones Zone diagnostics.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function direct_zones_for_wilaya( string $code, array $zones ): array {
		return array_values(
			array_filter(
				$zones,
				static fn( array $zone ): bool => in_array( $code, $zone['matchedWilayaCodes'] ?? array(), true )
			)
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $zones Zone diagnostics.
	 *
	 * @return array<string,mixed>|null
	 */
	private function manual_zone_for_wilaya( string $code, array $zones ): ?array {
		foreach ( $zones as $zone ) {
			if (
				'manual_unknown' === $this->ownership_source( $zone )
				&& in_array( $code, $zone['overlapWilayaCodes'] ?? array(), true )
			) {
				return $zone;
			}
		}

		return null;
	}

	/**
	 * @param array<string,mixed> $zone Zone diagnostics.
	 */
	private function ownership_source( array $zone ): string {
		if ( null !== $this->managed_registry->record_for_zone_id( (int) ( $zone['zoneId'] ?? 0 ) ) ) {
			return 'managed_registry';
		}

		if ( 'yaxii_hint' === ( $zone['ownershipHint'] ?? '' ) ) {
			return 'yaxii_name_hint';
		}

		return 'manual_unknown';
	}

	/**
	 * @param array<string,mixed> $wilaya Dataset wilaya.
	 * @param array<string,mixed> $settings Preview settings.
	 */
	private function zone_name( array $wilaya, array $settings ): string {
		$label  = $this->region_label( $wilaya, (string) $settings['regionLabelFormat'] );
		$prefix = trim( (string) $settings['zonePrefix'] );
		$prefix = '' === $prefix ? 'Yaxii' : $prefix;
		$format = (string) $settings['zoneNameFormat'];

		if ( 'code_name' === $format ) {
			return (string) $wilaya['code'] . ' - ' . $label;
		}

		if ( 'name_only' === $format ) {
			return $label;
		}

		if ( 'prefix_name' === $format ) {
			return $prefix . ' - ' . $label;
		}

		return $prefix . ' - ' . (string) $wilaya['code'] . ' ' . $label;
	}

	/**
	 * @param array<string,mixed> $wilaya Dataset wilaya.
	 */
	private function region_label( array $wilaya, string $format ): string {
		if ( 'ar' === $format ) {
			return (string) $wilaya['name_ar'];
		}

		if ( 'fr_ar' === $format ) {
			return (string) $wilaya['name_fr'] . ' - ' . (string) $wilaya['name_ar'];
		}

		if ( 'ar_fr' === $format ) {
			return (string) $wilaya['name_ar'] . ' - ' . (string) $wilaya['name_fr'];
		}

		return (string) $wilaya['name_fr'];
	}

	private function price_to_string( $price ): string {
		if ( null === $price ) {
			return '';
		}

		return (string) $price;
	}

	/**
	 * @param array<string,array<int,array<string,mixed>>> $plan_groups Plan groups.
	 *
	 * @return array<string,mixed>
	 */
	private function summary( array $plan_groups, int $selected_count ): array {
		return array(
			'selectedWilayas'   => $selected_count,
			'createZones'       => count( $plan_groups['createZones'] ),
			'updateZones'       => count( $plan_groups['updateZones'] ),
			'addMethods'        => count( $plan_groups['addMethods'] ),
			'updateMethods'     => count( $plan_groups['updateMethods'] ),
			'skipManualZones'   => count( $plan_groups['skipManualZones'] ),
			'conflicts'         => count( $plan_groups['conflicts'] ),
			'warnings'          => count( $plan_groups['warnings'] ),
			'unchanged'         => count( $plan_groups['unchanged'] ),
			'deleteZones'       => 0,
			'recommendedAction' => $this->recommended_action( $plan_groups ),
		);
	}

	/**
	 * @param array<string,array<int,array<string,mixed>>> $plan_groups Plan groups.
	 */
	private function recommended_action( array $plan_groups ): string {
		if ( count( $plan_groups['conflicts'] ) > 0 ) {
			return __( 'Resolve conflicts before any apply engine can run.', 'yaxii-shipping-manager' );
		}

		if ( count( $plan_groups['skipManualZones'] ) > 0 ) {
			return __( 'Review protected manual zones before applying future changes.', 'yaxii-shipping-manager' );
		}

		return __( 'Review this preview. The apply engine is not implemented yet.', 'yaxii-shipping-manager' );
	}

	/**
	 * @param array<string,mixed> $diagnostics Diagnostics payload.
	 * @param array<string,array<int,array<string,mixed>>> $plan_groups Plan groups.
	 *
	 * @return array<int,string>
	 */
	private function plan_warnings( array $diagnostics, array $plan_groups ): array {
		$warnings = array( __( 'This is a preview only. No WooCommerce changes were made.', 'yaxii-shipping-manager' ) );

		foreach ( $diagnostics['warnings'] ?? array() as $diagnostic_warning ) {
			if ( is_string( $diagnostic_warning ) ) {
				$warnings[] = $diagnostic_warning;
			}
		}

		if ( count( $plan_groups['skipManualZones'] ) > 0 ) {
			$warnings[] = __( 'Manual or unknown zones are skipped by default.', 'yaxii-shipping-manager' );
		}

		return array_values( array_unique( $warnings ) );
	}

	/**
	 * @param array<int,string> $warnings Warning messages.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function warning_items( array $warnings ): array {
		return array_values(
			array_map(
				static function ( string $warning ): array {
					return array(
						'type'    => 'warning',
						'message' => $warning,
					);
				},
				$warnings
			)
		);
	}

	/**
	 * @param array<string,array<int,array<string,mixed>>> $plan_groups Plan groups.
	 */
	private function sort_plan_groups( array &$plan_groups ): void {
		foreach ( $plan_groups as &$group ) {
			usort(
				$group,
				static function ( array $left, array $right ): int {
					$left_key  = (string) ( $left['wilayaCode'] ?? $left['message'] ?? $left['type'] ?? '' );
					$right_key = (string) ( $right['wilayaCode'] ?? $right['message'] ?? $right['type'] ?? '' );

					return strcmp( $left_key, $right_key );
				}
			);
		}
	}
}
