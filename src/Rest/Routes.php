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
	private SettingsController $settings;
	private DiagnosticsController $diagnostics;
	private PreviewController $preview;
	private ApplyContractController $apply_contract;
	private ApplyController $apply;

	public function __construct(
		BootstrapController $bootstrap,
		DatasetController $dataset,
		SettingsController $settings,
		DiagnosticsController $diagnostics,
		PreviewController $preview,
		ApplyContractController $apply_contract,
		ApplyController $apply
	) {
		$this->bootstrap      = $bootstrap;
		$this->dataset        = $dataset;
		$this->settings       = $settings;
		$this->diagnostics    = $diagnostics;
		$this->preview        = $preview;
		$this->apply_contract = $apply_contract;
		$this->apply          = $apply;
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

		register_rest_route(
			self::NAMESPACE,
			'/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this->settings, 'get_settings' ),
					'permission_callback' => array( $this->settings, 'can_read' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this->settings, 'update_settings' ),
					'permission_callback' => array( $this->settings, 'can_update' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/diagnostics',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this->diagnostics, 'get_diagnostics' ),
				'permission_callback' => array( $this->diagnostics, 'can_access' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/preview',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this->preview, 'create_preview' ),
				'permission_callback' => array( $this->preview, 'can_preview' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/apply-contract',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this->apply_contract, 'get_apply_contract' ),
				'permission_callback' => array( $this->apply_contract, 'can_access' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/apply',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this->apply, 'create_apply_contract' ),
				'permission_callback' => array( $this->apply, 'can_apply' ),
			)
		);
	}
}
