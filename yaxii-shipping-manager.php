<?php
/**
 * Plugin Name: Yaxii Shipping Manager – WooCommerce Shipping Zones for Algeria
 * Plugin URI: https://yaxii.dev/product/yaxii-shipping-manager/
 * Description: Create, preview, and manage Algeria WooCommerce shipping zones with protected manual zones and diagnostics.
 * Version: 1.0.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Author: Yaxii Dev
 * Author URI: https://yaxii.dev
 * Text Domain: yaxii-shipping-manager
 * Domain Path: /languages
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package YaxiiShippingManager
 */

defined( 'ABSPATH' ) || exit;

define( 'YAXII_SHIPPING_MANAGER_VERSION', '1.0.0' );
define( 'YAXII_SHIPPING_MANAGER_FILE', __FILE__ );
define( 'YAXII_SHIPPING_MANAGER_PATH', plugin_dir_path( __FILE__ ) );
define( 'YAXII_SHIPPING_MANAGER_URL', plugin_dir_url( __FILE__ ) );
define( 'YAXII_SHIPPING_MANAGER_TEXT_DOMAIN', 'yaxii-shipping-manager' );

$yaxii_shipping_manager_autoloader = __DIR__ . '/vendor/autoload.php';

if ( file_exists( $yaxii_shipping_manager_autoloader ) ) {
	require_once $yaxii_shipping_manager_autoloader;
} else {
	spl_autoload_register(
		static function ( string $class_name ): void {
			$prefix = 'Yaxii\\ShippingManager\\';

			if ( 0 !== strncmp( $prefix, $class_name, strlen( $prefix ) ) ) {
				return;
			}

			$relative_class = substr( $class_name, strlen( $prefix ) );
			$class_file     = YAXII_SHIPPING_MANAGER_PATH . 'src/' . str_replace( '\\', '/', $relative_class ) . '.php';

			if ( file_exists( $class_file ) ) {
				require_once $class_file;
			}
		}
	);
}

add_action(
	'plugins_loaded',
	static function (): void {
		$plugin = new Yaxii\ShippingManager\Plugin();
		$plugin->register();
	}
);
