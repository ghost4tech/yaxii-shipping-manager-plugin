<?php
/**
 * Safe apply contract summary.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Apply;

use Yaxii\ShippingManager\Settings\SettingsRepository;

defined( 'ABSPATH' ) || exit;

final class ApplyContract {
	private SettingsRepository $settings;
	private ManagedZoneRegistry $managed_registry;

	public function __construct( SettingsRepository $settings, ManagedZoneRegistry $managed_registry ) {
		$this->settings         = $settings;
		$this->managed_registry = $managed_registry;
	}

	/**
	 * @return array<string,mixed>
	 */
	public function payload(): array {
		$settings_payload = $this->settings->read();

		return array(
			'applyEngineAvailable'     => true,
			'managedRegistryAvailable' => true,
			'managedRegistryOption'    => ManagedZoneRegistry::OPTION_NAME,
			'applyContractVersion'     => ApplyRequestSanitizer::CONTRACT_VERSION,
			'requiredConfirmationText' => ApplyRequestSanitizer::CONFIRMATION_TEXT,
			'applyRequestFields'       => array(
				'previewHash',
				'previewGeneratedAt',
				'selectedWilayaCodes',
				'acceptedPlanSummary',
				'confirmed',
				'confirmationText',
				'safetyPolicySnapshot',
				'applyContractVersion',
				'previewRequest',
			),
			'managedZoneCount'         => $this->managed_registry->managed_zone_count(),
			'safetyPolicy'             => $settings_payload['settings']['safetyPolicy'],
			'requiredNextSteps'        => array(
				__( 'Generate and review a fresh preview plan.', 'yaxii-shipping-manager' ),
				__( 'Confirm the exact apply phrase before creating zones.', 'yaxii-shipping-manager' ),
				__( 'Create missing Yaxii-managed zones only. Methods and prices remain unchanged.', 'yaxii-shipping-manager' ),
			),
			'warnings'                 => array(
				__( 'This apply step creates missing zones only.', 'yaxii-shipping-manager' ),
				__( 'Manual WooCommerce zones remain protected by default.', 'yaxii-shipping-manager' ),
			),
			'generatedAt'              => gmdate( 'c' ),
		);
	}
}
