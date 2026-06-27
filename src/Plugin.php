<?php
/**
 * Plugin bootstrap.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager;

use Yaxii\ShippingManager\Admin\AdminPage;
use Yaxii\ShippingManager\Admin\AssetRegistrar;
use Yaxii\ShippingManager\Data\DatasetRepository;
use Yaxii\ShippingManager\Rest\BootstrapController;
use Yaxii\ShippingManager\Rest\DatasetController;
use Yaxii\ShippingManager\Rest\DiagnosticsController;
use Yaxii\ShippingManager\Rest\Routes;
use Yaxii\ShippingManager\Rest\SettingsController;
use Yaxii\ShippingManager\Settings\SettingsRepository;
use Yaxii\ShippingManager\WooCommerce\AlgeriaStatesRegistrar;
use Yaxii\ShippingManager\WooCommerce\ShippingDiagnosticsService;
use Yaxii\ShippingManager\WooCommerce\ShippingZoneReader;

defined( 'ABSPATH' ) || exit;

final class Plugin {
	/**
	 * Register WordPress hooks.
	 */
	public function register(): void {
		$woocommerce_active  = $this->is_woocommerce_active();
		$datasets               = new DatasetRepository();
		$settings               = new SettingsRepository();
		$algeria_states         = new AlgeriaStatesRegistrar( $woocommerce_active, $datasets, $settings );
		$zone_reader            = new ShippingZoneReader( $woocommerce_active );
		$diagnostics            = new ShippingDiagnosticsService( $woocommerce_active, $datasets, $settings, $zone_reader );
		$bootstrap              = new BootstrapController( $woocommerce_active, $datasets, $algeria_states );
		$dataset_controller     = new DatasetController( $woocommerce_active, $datasets );
		$settings_controller    = new SettingsController( $woocommerce_active, $settings );
		$diagnostics_controller = new DiagnosticsController( $woocommerce_active, $diagnostics );

		add_action( 'init', array( $this, 'load_textdomain' ) );

		if ( is_admin() ) {
			$admin_page = new AdminPage( $woocommerce_active );
			$admin_page->register();

			$asset_registrar = new AssetRegistrar( $bootstrap );
			$asset_registrar->register();
		}

		$algeria_states->register();

		$routes = new Routes( $bootstrap, $dataset_controller, $settings_controller, $diagnostics_controller );
		$routes->register();
	}

	/**
	 * Load plugin translations.
	 */
	public function load_textdomain(): void {
		load_plugin_textdomain(
			'yaxii-shipping-manager',
			false,
			dirname( plugin_basename( YAXII_SHIPPING_MANAGER_FILE ) ) . '/languages'
		);
	}

	/**
	 * Detect WooCommerce without calling WooCommerce APIs.
	 */
	private function is_woocommerce_active(): bool {
		return class_exists( 'WooCommerce' ) || function_exists( 'WC' );
	}
}
