<?php
/**
 * REST bootstrap controller.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use Yaxii\ShippingManager\Admin\AdminPage;
use Yaxii\ShippingManager\Data\DatasetRepository;
use Yaxii\ShippingManager\Support\Capabilities;
use Yaxii\ShippingManager\Support\JsonResponse;

defined( 'ABSPATH' ) || exit;

final class BootstrapController {
	private bool $woocommerce_active;
	private DatasetRepository $datasets;

	public function __construct( bool $woocommerce_active, DatasetRepository $datasets ) {
		$this->woocommerce_active = $woocommerce_active;
		$this->datasets           = $datasets;
	}

	/**
	 * REST callback for the admin bootstrap payload.
	 *
	 * @return \WP_REST_Response
	 */
	public function get_bootstrap() {
		return JsonResponse::read( $this->bootstrap_data() );
	}

	/**
	 * REST permission callback.
	 */
	public function can_access(): bool {
		return current_user_can( $this->required_capability() );
	}

	public function required_capability(): string {
		return Capabilities::required_capability( $this->woocommerce_active );
	}

	/**
	 * Build the config consumed by the admin app and REST endpoint.
	 *
	 * @return array<string,mixed>
	 */
	public function bootstrap_data(): array {
		return array(
			'pluginVersion'     => YAXII_SHIPPING_MANAGER_VERSION,
			'restNamespace'     => Routes::NAMESPACE,
			'restUrl'           => esc_url_raw( rest_url( Routes::NAMESPACE . '/' ) ),
			'nonce'             => wp_create_nonce( 'wp_rest' ),
			'capabilities'      => array(
				'manageWooCommerce' => current_user_can( 'manage_woocommerce' ),
				'manageOptions'     => current_user_can( 'manage_options' ),
				'accessPlugin'      => current_user_can( $this->required_capability() ),
			),
			'woocommerceActive' => $this->woocommerce_active,
			'adminUrls'         => array(
				'pluginPage'          => esc_url_raw( $this->plugin_page_url() ),
				'woocommerceSettings' => esc_url_raw( admin_url( 'admin.php?page=wc-settings&tab=shipping' ) ),
				'plugins'             => esc_url_raw( admin_url( 'plugins.php' ) ),
			),
			'featureFlags'      => array(
				'diagnostics'     => false,
				'previewPlanner'  => false,
				'applyEngine'     => false,
				'csvImportExport' => false,
				'ysfSync'         => false,
			),
			'datasetStatus'     => $this->datasets->dataset_status(),
		);
	}

	private function plugin_page_url(): string {
		$page = rawurlencode( AdminPage::MENU_SLUG );

		if ( $this->woocommerce_active ) {
			return admin_url( 'admin.php?page=' . $page );
		}

		return admin_url( 'tools.php?page=' . $page );
	}
}
