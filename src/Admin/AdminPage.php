<?php
/**
 * WordPress admin page.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Admin;

use Yaxii\ShippingManager\Support\Capabilities;

defined( 'ABSPATH' ) || exit;

final class AdminPage {
	public const MENU_SLUG = 'yaxii-shipping-manager';

	private bool $woocommerce_active;

	public function __construct( bool $woocommerce_active ) {
		$this->woocommerce_active = $woocommerce_active;
	}

	/**
	 * Register admin menu hooks.
	 */
	public function register(): void {
		add_action( 'admin_menu', array( $this, 'register_menu' ) );
	}

	/**
	 * Add the page under WooCommerce when available, otherwise under Tools.
	 */
	public function register_menu(): void {
		$capability = Capabilities::required_capability( $this->woocommerce_active );

		if ( $this->woocommerce_active ) {
			add_submenu_page(
				'woocommerce',
				__( 'Yaxii Shipping Manager', 'yaxii-shipping-manager' ),
				__( 'Yaxii Shipping', 'yaxii-shipping-manager' ),
				$capability,
				self::MENU_SLUG,
				array( $this, 'render' )
			);

			return;
		}

		add_management_page(
			__( 'Yaxii Shipping Manager', 'yaxii-shipping-manager' ),
			__( 'Yaxii Shipping', 'yaxii-shipping-manager' ),
			$capability,
			self::MENU_SLUG,
			array( $this, 'render' )
		);
	}

	/**
	 * Render only the React mount and server-side fallback.
	 */
	public function render(): void {
		$capability = Capabilities::required_capability( $this->woocommerce_active );

		if ( ! current_user_can( $capability ) ) {
			wp_die( esc_html__( 'You do not have permission to access Yaxii Shipping Manager.', 'yaxii-shipping-manager' ) );
		}

		echo '<div class="wrap yaxii-shipping-manager-admin">';

		if ( ! $this->woocommerce_active ) {
			echo '<div class="notice notice-warning"><p>';
			echo esc_html__( 'WooCommerce is not active. Yaxii Shipping Manager is loaded in read-only foundation mode.', 'yaxii-shipping-manager' );
			echo '</p></div>';
		}

		echo '<div id="yaxii-shipping-manager-admin-app" data-plugin-version="' . esc_attr( YAXII_SHIPPING_MANAGER_VERSION ) . '"></div>';
		echo '<noscript><p>';
		echo esc_html__( 'Yaxii Shipping Manager requires JavaScript to display the admin interface.', 'yaxii-shipping-manager' );
		echo '</p></noscript>';
		echo '</div>';
	}
}
