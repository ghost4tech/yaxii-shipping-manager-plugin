<?php
/**
 * Read-only WooCommerce preview planner.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Preview;

use Yaxii\ShippingManager\Apply\ApplyReadinessEvaluator;
use Yaxii\ShippingManager\Apply\ApplyRequestSanitizer;
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
		$dataset_mode     = $this->dataset_mode( $settings );
		$wilayas          = $this->datasets->wilayas( $dataset_mode );
		$diagnostics      = $this->diagnostics->diagnostics( $dataset_mode );
		$context          = $this->planning_context( $settings, $wilayas, $diagnostics, $overrides );
		$selected_count   = count( $context['selectedCodes'] );
		$plan_groups      = $this->empty_plan_groups();

		foreach ( $context['wilayas'] as $wilaya ) {
			$this->plan_wilaya( $wilaya, $context, $plan_groups );
		}

		$warning_messages        = $this->plan_warnings( $diagnostics, $plan_groups );
		$plan_groups['warnings'] = $this->warning_items( $warning_messages );
		$this->sort_plan_groups( $plan_groups );
		$summary                 = $this->summary( $plan_groups, $selected_count );
		$generated_at            = gmdate( 'c' );
		$preview_hash            = $this->preview_hash( $summary, $plan_groups, $context['selectedCodes'], $settings['safetyPolicy'] );
		$apply_readiness         = $this->apply_readiness( $plan_groups, $diagnostics, $settings['safetyPolicy'], $selected_count );
		$can_apply_later         = $this->can_apply_later( $plan_groups, $apply_readiness );

		return array(
			'summary'              => $summary,
			'plan'                 => $plan_groups,
			'applyReadiness'       => $apply_readiness,
			'warnings'             => $warning_messages,
			'generatedAt'          => $generated_at,
			'previewGeneratedAt'   => $generated_at,
			'previewHash'          => $preview_hash,
			'applyContractVersion' => ApplyRequestSanitizer::CONTRACT_VERSION,
			'safetyPolicy'         => $settings['safetyPolicy'],
			'canApplyLater'        => $can_apply_later,
			'canApplyLaterMessage' => $can_apply_later
				? __( 'Apply can create missing Yaxii-managed zones, add missing methods, or update Yaxii-managed method prices, labels, and enabled status.', 'yaxii-shipping-manager' )
				: __( 'Apply is available only when the preview has supported Yaxii-managed work and no blocking conflicts.', 'yaxii-shipping-manager' ),
		);
	}

	/**
	 * @param array<string,array<int,array<string,mixed>>> $plan_groups Preview plan groups.
	 * @param array<string,mixed>                          $apply_readiness Apply readiness.
	 */
	private function can_apply_later( array $plan_groups, array $apply_readiness ): bool {
		return 'blocked' !== ( $apply_readiness['severity'] ?? '' )
			&& ( count( $plan_groups['createZones'] ) > 0 || count( $plan_groups['addMethods'] ) > 0 || count( $plan_groups['updateMethods'] ) > 0 || count( $plan_groups['updateMethodStatuses'] ) > 0 )
			&& count( $plan_groups['conflicts'] ) === 0;
	}

	/**
	 * @param array<string,mixed> $settings Persisted settings.
	 * @param array<string,mixed> $overrides Preview overrides.
	 *
	 * @return array<string,mixed>
	 */
	private function preview_settings( array $settings, array $overrides ): array {
		foreach ( array( 'datasetMode', 'regionLabelFormat', 'zoneNameFormat', 'zonePrefix' ) as $field ) {
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
	 * @param array<string,mixed> $settings Preview settings.
	 */
	private function dataset_mode( array $settings ): string {
		$mode = (string) ( $settings['datasetMode'] ?? DatasetMode::CURRENT );

		return DatasetMode::is_valid( $mode ) ? $mode : DatasetMode::CURRENT;
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
			'applyEngineAvailable'     => true,
			'managedRegistryAvailable' => true,
			'managedRegistryOption'    => ManagedZoneRegistry::OPTION_NAME,
			'managedZoneCount'         => $this->managed_registry->managed_zone_count(),
		);
	}

	/**
	 * @param array<string,mixed>                          $summary Preview summary.
	 * @param array<string,array<int,array<string,mixed>>> $plan_groups Preview plan groups.
	 * @param array<int,string>                            $selected_codes Selected wilaya codes.
	 * @param array<string,mixed>                          $safety_policy Locked safety policy.
	 */
	private function preview_hash( array $summary, array $plan_groups, array $selected_codes, array $safety_policy ): string {
		$hash_payload = array(
			'applyContractVersion' => ApplyRequestSanitizer::CONTRACT_VERSION,
			'selectedWilayaCodes'  => $selected_codes,
			'summary'              => $summary,
			'plan'                 => $plan_groups,
			'safetyPolicy'         => $safety_policy,
		);

		return hash( 'sha256', (string) wp_json_encode( $hash_payload ) );
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
			'methods'        => $this->flat_rate_methods( $settings['methods'] ?? array() ),
			'zoneResults'    => $diagnostics['zoneResults'] ?? array(),
			'externalCoverage' => $this->external_coverage_by_code( $diagnostics['compatibility']['zonesByNormalizedWilaya'] ?? array() ),
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
			'updateMethodStatuses' => array(),
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
		if ( isset( $context['externalCoverage'][ $code ] ) ) {
			$plan_groups['skipManualZones'][] = $this->external_skip_item( $wilaya, $context['externalCoverage'][ $code ] );
			return;
		}

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

			if ( 'update_status' === $method_change['statusAction'] ) {
				$plan_groups['updateMethodStatuses'][] = $this->method_status_item( $wilaya, $zone, $desired_method, $method_change );
				$changed                              = true;
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
	 * @return array<string,mixed>
	 */
	private function method_change( array $zone, array $desired_method ): array {
		$existing_method = $this->registry_method( $zone, $desired_method )
			?? $this->matching_method( $zone['methods'] ?? array(), $desired_method );
		if ( null === $existing_method ) {
			return array(
				'action'       => (bool) $desired_method['enabled'] ? 'add' : 'none',
				'statusAction' => 'none',
			);
		}

		$desired_cost = null === $desired_method['price'] ? null : $this->price_to_string( $desired_method['price'] );
		$desired_enabled = (bool) $desired_method['enabled'];
		$current_enabled = (bool) ( $existing_method['enabled'] ?? false );
		$price_action = 'none';
		if ( null !== $desired_cost && (string) ( $existing_method['title'] ?? '' ) !== $desired_method['label'] ) {
			$price_action = 'update';
		}

		if ( null !== $desired_cost && $desired_cost !== (string) ( $existing_method['cost'] ?? '' ) ) {
			$price_action = 'update';
		}

		return array(
			'action'         => $price_action,
			'statusAction'   => $desired_enabled === $current_enabled ? 'none' : 'update_status',
			'currentEnabled' => $current_enabled,
			'enabled'        => $desired_enabled,
		);
	}

	/**
	 * @param array<string,mixed> $zone Zone diagnostics.
	 * @param array<string,mixed> $desired_method Desired method.
	 *
	 * @return array<string,mixed>|null
	 */
	private function registry_method( array $zone, array $desired_method ): ?array {
		$record = $this->managed_registry->record_for_zone_id( (int) ( $zone['zoneId'] ?? 0 ) );
		if ( null === $record ) {
			return null;
		}

		$instance_id = 0;
		foreach ( $record['methodInstances'] as $method_instance ) {
			if ( (string) $desired_method['key'] === (string) $method_instance['methodKey'] ) {
				$instance_id = (int) $method_instance['instanceId'];
				break;
			}
		}

		if ( $instance_id <= 0 ) {
			return null;
		}

		foreach ( $zone['methods'] ?? array() as $method ) {
			if ( is_array( $method ) && $instance_id === (int) ( $method['instanceId'] ?? 0 ) ) {
				return $method;
			}
		}

		return null;
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
			$enabled = $pricing_row['methodStatuses'][ $method['key'] ] ?? (bool) $method['enabled'];
			if ( null === $price && $enabled ) {
				continue;
			}

			$methods[] = array(
				'key'     => (string) $method['key'],
				'label'   => (string) $method['label'],
				'price'   => $price,
				'enabled' => (bool) $enabled,
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
			'methods'         => array_values(
				array_filter(
					$this->desired_methods( $wilaya, $context ),
					static fn( array $method ): bool => (bool) $method['enabled']
				)
			),
			'ownershipSource' => 'managed_registry',
			'reason'          => __( 'No direct WooCommerce zone exists for this wilaya. Apply can create and record it in the Yaxii managed registry.', 'yaxii-shipping-manager' ),
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
	 * @param array<string,mixed> $wilaya Dataset wilaya.
	 * @param array<string,mixed> $zone Zone diagnostics.
	 * @param array<string,mixed> $method Desired method.
	 * @param array<string,mixed> $method_change Method change summary.
	 */
	private function method_status_item( array $wilaya, array $zone, array $method, array $method_change ): array {
		return array(
			'type'            => 'method_status_update',
			'wilayaCode'      => (string) $wilaya['code'],
			'wilayaName'      => (string) $wilaya['name_fr'],
			'zoneId'          => (int) $zone['zoneId'],
			'zoneName'        => (string) $zone['name'],
			'methodKey'       => (string) $method['key'],
			'label'           => (string) $method['label'],
			'currentEnabled'  => (bool) ( $method_change['currentEnabled'] ?? false ),
			'enabled'         => (bool) ( $method_change['enabled'] ?? false ),
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
	 * @param array<string,mixed> $entry Compatibility entry.
	 */
	private function external_skip_item( array $wilaya, array $entry ): array {
		$classification = (string) ( $entry['sourceClassification'] ?? 'External Yaxii zone' );
		$ownership      = 'Yaxii COD Theme' === $classification ? 'yaxii_cod_theme' : 'external_yaxii_zone';

		return array(
			'type'            => 'skip_external_yaxii_zone',
			'wilayaCode'      => (string) $wilaya['code'],
			'wilayaName'      => (string) $wilaya['name_fr'],
			'zoneId'          => (int) ( $entry['zoneId'] ?? 0 ),
			'zoneName'        => (string) ( $entry['zoneName'] ?? '' ),
			'location'        => (string) ( $entry['locationCode'] ?? '' ),
			'ownershipSource' => $ownership,
			'reason'          => 'Yaxii COD Theme' === $classification
				? __( 'Already covered by Yaxii COD Theme. Yaxii Shipping Manager will not create a duplicate zone.', 'yaxii-shipping-manager' )
				: __( 'Already covered by an external Yaxii-looking zone. Yaxii Shipping Manager will not edit it.', 'yaxii-shipping-manager' ),
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
	 * @param mixed $compatibility_groups Compatibility groups from diagnostics.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	private function external_coverage_by_code( $compatibility_groups ): array {
		$coverage = array();
		if ( ! is_array( $compatibility_groups ) ) {
			return $coverage;
		}

		foreach ( $compatibility_groups as $group ) {
			if ( ! is_array( $group ) ) {
				continue;
			}

			$code  = (string) ( $group['normalizedWilayaCode'] ?? '' );
			$entry = $this->first_external_coverage_entry( $group['entries'] ?? array() );
			if ( '' === $code || null === $entry ) {
				continue;
			}

			$coverage[ $code ] = $entry;
		}

		return $coverage;
	}

	/**
	 * @param mixed $entries Compatibility group entries.
	 *
	 * @return array<string,mixed>|null
	 */
	private function first_external_coverage_entry( $entries ): ?array {
		if ( ! is_array( $entries ) ) {
			return null;
		}

		foreach ( $entries as $entry ) {
			if ( ! is_array( $entry ) ) {
				continue;
			}

			if ( in_array( (string) ( $entry['sourceClassification'] ?? '' ), array( 'Yaxii COD Theme', 'External Yaxii zone' ), true ) ) {
				return $entry;
			}
		}

		return null;
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
	private function flat_rate_methods( $methods ): array {
		if ( ! is_array( $methods ) ) {
			return array();
		}

		return array_values(
			array_filter(
				$methods,
				static fn( array $method ): bool => 'flat_rate' === ( $method['type'] ?? '' )
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
			'updateMethodStatuses' => count( $plan_groups['updateMethodStatuses'] ),
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
			return __( 'Review protected manual zones before applying supported changes.', 'yaxii-shipping-manager' );
		}

		if ( count( $plan_groups['createZones'] ) > 0 && count( $plan_groups['addMethods'] ) > 0 ) {
			return __( 'Review this preview. Apply can create missing Yaxii-managed zones and add missing methods.', 'yaxii-shipping-manager' );
		}

		if ( count( $plan_groups['addMethods'] ) > 0 ) {
			return __( 'Review this preview. Apply can add missing methods and prices to Yaxii-managed zones.', 'yaxii-shipping-manager' );
		}

		if ( count( $plan_groups['updateMethods'] ) > 0 ) {
			return __( 'Review this preview. Apply can update Yaxii-managed method prices and labels.', 'yaxii-shipping-manager' );
		}

		if ( count( $plan_groups['updateMethodStatuses'] ) > 0 ) {
			return __( 'Review this preview. Apply can enable or disable Yaxii-managed methods.', 'yaxii-shipping-manager' );
		}

		if ( count( $plan_groups['createZones'] ) > 0 ) {
			return __( 'Review this preview. Apply can create missing Yaxii-managed zones.', 'yaxii-shipping-manager' );
		}

		return __( 'No supported shipping changes were found for this selection.', 'yaxii-shipping-manager' );
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
			$warnings[] = __( 'Manual, theme, or external zones are skipped by default.', 'yaxii-shipping-manager' );
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
