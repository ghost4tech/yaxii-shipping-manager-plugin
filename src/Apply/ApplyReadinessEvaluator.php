<?php
/**
 * Read-only apply workflow readiness evaluator.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Apply;

defined( 'ABSPATH' ) || exit;

final class ApplyReadinessEvaluator {
	/**
	 * @param array{planGroups:array<string,array<int,array<string,mixed>>>,diagnostics:array<string,mixed>,applyContract:array<string,mixed>,safetyPolicy:array<string,mixed>,selectedCount:int} $readiness_context Readiness inputs.
	 *
	 * @return array<string,mixed>
	 */
	public function evaluate( array $readiness_context ): array {
		$counts           = $this->counts( $readiness_context['planGroups'] );
		$blocking_reasons = $this->blocking_reasons( $readiness_context['diagnostics'], $readiness_context['selectedCount'] );

		if ( array() !== $blocking_reasons ) {
			return $this->state_payload( 'blocked', 'blocked', $blocking_reasons, $counts );
		}

		if ( $counts['conflicts'] > 0 ) {
			return $this->state_payload( 'conflicts_detected', 'blocked', array(), $counts );
		}

		$state    = $this->workflow_state( $counts, $readiness_context['diagnostics'], $readiness_context['applyContract'] );
		$severity = $this->severity( $state, $readiness_context['safetyPolicy'] );

		return $this->state_payload( $state, $severity, array(), $counts );
	}

	/**
	 * @param array<string,array<int,array<string,mixed>>> $plan_groups Preview plan groups.
	 *
	 * @return array<string,int>
	 */
	private function counts( array $plan_groups ): array {
		return array(
			'creates'         => count( $plan_groups['createZones'] ?? array() ),
			'updates'         => count( $plan_groups['updateZones'] ?? array() ),
			'manualSkips'     => count( $plan_groups['skipManualZones'] ?? array() ),
			'conflicts'       => count( $plan_groups['conflicts'] ?? array() ),
			'methodAdditions' => count( $plan_groups['addMethods'] ?? array() ),
			'methodUpdates'   => count( $plan_groups['updateMethods'] ?? array() ),
		);
	}

	/**
	 * @param array<string,mixed> $diagnostics Diagnostics payload.
	 *
	 * @return array<int,string>
	 */
	private function blocking_reasons( array $diagnostics, int $selected_count ): array {
		$reasons = array();

		if ( false === (bool) ( $diagnostics['woocommerceActive'] ?? true ) ) {
			$reasons[] = __( 'WooCommerce is inactive.', 'yaxii-shipping-manager' );
		}

		if ( $selected_count <= 0 ) {
			$reasons[] = __( 'No wilayas are selected for the preview.', 'yaxii-shipping-manager' );
		}

		return $reasons;
	}

	/**
	 * @param array<string,int>   $counts Apply readiness counts.
	 * @param array<string,mixed> $diagnostics Diagnostics payload.
	 * @param array<string,mixed> $apply_contract Apply contract payload.
	 */
	private function workflow_state( array $counts, array $diagnostics, array $apply_contract ): string {
		if ( $counts['manualSkips'] > 0 ) {
			return 'manual_zones_detected';
		}

		if ( $counts['methodAdditions'] > 0 || $counts['methodUpdates'] > 0 ) {
			return 'methods_missing';
		}

		if ( (int) ( $apply_contract['managedZoneCount'] ?? 0 ) > 0 ) {
			return 'yaxii_managed_ready';
		}

		if ( $this->has_partial_setup( $diagnostics, $counts ) ) {
			return 'partial_setup';
		}

		if ( $counts['creates'] > 0 && 0 === $counts['updates'] ) {
			return 'fresh_store';
		}

		return 'yaxii_managed_ready';
	}

	/**
	 * @param array<string,mixed> $diagnostics Diagnostics payload.
	 * @param array<string,int>   $counts Apply readiness counts.
	 */
	private function has_partial_setup( array $diagnostics, array $counts ): bool {
		$summary = $diagnostics['summary'] ?? array();

		return (int) ( $summary['configuredWilayas'] ?? 0 ) > 0
			&& $counts['creates'] > 0;
	}

	/**
	 * @param array<string,mixed> $safety_policy Locked safety policy.
	 */
	private function severity( string $state, array $safety_policy ): string {
		if ( 'conflicts_detected' === $state || false === (bool) ( $safety_policy['skipConflictsByDefault'] ?? true ) ) {
			return 'blocked';
		}

		if ( in_array( $state, array( 'manual_zones_detected', 'methods_missing', 'partial_setup' ), true ) ) {
			return 'attention';
		}

		return 'ready';
	}

	/**
	 * @param array<int,string> $blocking_reasons Blocking reasons.
	 * @param array<string,int> $counts Apply readiness counts.
	 *
	 * @return array<string,mixed>
	 */
	private function state_payload( string $state, string $severity, array $blocking_reasons, array $counts ): array {
		$copy = $this->state_copy( $state );

		return array(
			'state'             => $state,
			'severity'          => $severity,
			'title'             => $copy['title'],
			'message'           => $copy['message'],
			'recommendedAction' => $copy['recommendedAction'],
			'blockingReasons'   => $blocking_reasons,
			'counts'            => $counts,
		);
	}

	/**
	 * @return array{title:string,message:string,recommendedAction:string}
	 */
	private function state_copy( string $state ): array {
		$states = $this->state_copies();

		return $states[ $state ] ?? $states['blocked'];
	}

	/**
	 * @return array<string,array{title:string,message:string,recommendedAction:string}>
	 */
	private function state_copies(): array {
		return array(
			'fresh_store'            => array(
				'title'             => __( 'Ready to create Yaxii shipping zones', 'yaxii-shipping-manager' ),
				'message'           => __( 'No existing Algeria wilaya zones were found. Future apply can create reviewed Yaxii-managed zones.', 'yaxii-shipping-manager' ),
				'recommendedAction' => __( 'Review the plan before applying.', 'yaxii-shipping-manager' ),
			),
			'partial_setup'          => array(
				'title'             => __( 'Some wilayas are ready; missing wilayas can be created later', 'yaxii-shipping-manager' ),
				'message'           => __( 'Some Algeria wilayas already have WooCommerce zones and others are missing.', 'yaxii-shipping-manager' ),
				'recommendedAction' => __( 'Review existing coverage and missing wilayas before future apply.', 'yaxii-shipping-manager' ),
			),
			'manual_zones_detected'  => array(
				'title'             => __( 'Manual zones are protected and will be skipped', 'yaxii-shipping-manager' ),
				'message'           => __( 'Manual or unknown WooCommerce zones overlap selected wilayas. Yaxii will not overwrite them by default.', 'yaxii-shipping-manager' ),
				'recommendedAction' => __( 'Review skipped manual zones before future apply.', 'yaxii-shipping-manager' ),
			),
			'conflicts_detected'     => array(
				'title'             => __( 'Resolve conflicts before applying', 'yaxii-shipping-manager' ),
				'message'           => __( 'Duplicate or conflicting WooCommerce zones were found for selected wilayas.', 'yaxii-shipping-manager' ),
				'recommendedAction' => __( 'Resolve conflicts in WooCommerce before any apply engine can run.', 'yaxii-shipping-manager' ),
			),
			'methods_missing'        => array(
				'title'             => __( 'Methods can be added later through reviewed apply', 'yaxii-shipping-manager' ),
				'message'           => __( 'Some matching zones are missing required enabled shipping methods or need method updates.', 'yaxii-shipping-manager' ),
				'recommendedAction' => __( 'Review method additions and updates before future apply.', 'yaxii-shipping-manager' ),
			),
			'yaxii_managed_ready'    => array(
				'title'             => __( 'Yaxii-managed zones can be updated after review', 'yaxii-shipping-manager' ),
				'message'           => __( 'The preview includes zones known by the Yaxii managed registry or existing Yaxii-looking zones.', 'yaxii-shipping-manager' ),
				'recommendedAction' => __( 'Review every proposed update before applying later.', 'yaxii-shipping-manager' ),
			),
			'blocked'                => array(
				'title'             => __( 'Cannot apply yet', 'yaxii-shipping-manager' ),
				'message'           => __( 'A required condition is missing before an apply workflow can be reviewed.', 'yaxii-shipping-manager' ),
				'recommendedAction' => __( 'Fix the blocking reasons and generate the preview again.', 'yaxii-shipping-manager' ),
			),
		);
	}
}
