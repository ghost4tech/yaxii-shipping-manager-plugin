<?php
/**
 * Plugin bootstrap.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager;

use Yaxii\ShippingManager\Admin\AdminPage;
use Yaxii\ShippingManager\Admin\AssetRegistrar;
use Yaxii\ShippingManager\Rest\BootstrapController;
use Yaxii\ShippingManager\Rest\Routes;

defined( 'ABSPATH' ) || exit;

final class Plugin {
	/**
	 * Register WordPress hooks.
	 */
	public function register(): void {
		$woocommerce_active = $this->is_woocommerce_active();
		$bootstrap         = new BootstrapController( $woocommerce_active );

		add_action( 'init', array( $this, 'load_textdomain' ) );

		if ( is_admin() ) {
			$admin_page = new AdminPage( $woocommerce_active );
			$admin_page->register();

			$asset_registrar = new AssetRegistrar( $bootstrap );
			$asset_registrar->register();
		}

		$routes = new Routes( $bootstrap );
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
