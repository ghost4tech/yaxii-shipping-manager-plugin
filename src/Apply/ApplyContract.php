<?php
/**
 * Read-only safe apply contract summary.
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
			'applyEngineAvailable'    => false,
			'managedRegistryAvailable' => true,
			'managedRegistryOption'    => ManagedZoneRegistry::OPTION_NAME,
			'managedZoneCount'         => $this->managed_registry->managed_zone_count(),
			'safetyPolicy'             => $settings_payload['settings']['safetyPolicy'],
			'requiredNextSteps'        => array(
				__( 'Review WooCommerce diagnostics.', 'yaxii-shipping-manager' ),
				__( 'Generate and review a preview plan.', 'yaxii-shipping-manager' ),
				__( 'Implement and audit the safe apply engine before any WooCommerce writes.', 'yaxii-shipping-manager' ),
			),
			'warnings'                 => array(
				__( 'Apply engine is not implemented yet.', 'yaxii-shipping-manager' ),
				__( 'Manual WooCommerce zones remain protected by default.', 'yaxii-shipping-manager' ),
			),
			'generatedAt'              => gmdate( 'c' ),
		);
	}
}
