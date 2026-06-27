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
	private DatasetController $dataset;

	public function __construct( BootstrapController $bootstrap, DatasetController $dataset ) {
		$this->bootstrap = $bootstrap;
		$this->dataset   = $dataset;
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

		register_rest_route(
			self::NAMESPACE,
			'/dataset',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this->dataset, 'get_dataset' ),
				'permission_callback' => array( $this->dataset, 'can_access' ),
				'args'                => array(
					'mode'        => array(
						'default'           => 'current',
						'sanitize_callback' => array( DatasetController::class, 'sanitize_mode' ),
						'validate_callback' => array( DatasetController::class, 'validate_mode' ),
					),
					'include'     => array(
						'default'           => 'wilayas',
						'sanitize_callback' => array( DatasetController::class, 'sanitize_include' ),
						'validate_callback' => array( DatasetController::class, 'validate_include' ),
					),
					'wilaya_code' => array(
						'default'           => '',
						'sanitize_callback' => array( DatasetController::class, 'sanitize_wilaya_code' ),
						'validate_callback' => array( DatasetController::class, 'validate_wilaya_code' ),
					),
				),
			)
		);
	}
}
