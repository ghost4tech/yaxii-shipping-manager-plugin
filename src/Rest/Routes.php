<?php
/**
 * REST route registration.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

final class Routes {
	public const NAMESPACE = 'yaxii-shipping-manager/v1';

	private BootstrapController $bootstrap;

	public function __construct( BootstrapController $bootstrap ) {
		$this->bootstrap = $bootstrap;
	}

	/**
	 * Register REST hooks.
	 */
	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register plugin REST endpoints.
	 */
	public function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/bootstrap',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this->bootstrap, 'get_bootstrap' ),
				'permission_callback' => array( $this->bootstrap, 'can_access' ),
			)
		);
	}
}
