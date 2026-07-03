<?php
/**
 * REST settings controller.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use WP_Error;
use WP_REST_Request;
use Yaxii\ShippingManager\Settings\SettingsRepository;
use Yaxii\ShippingManager\Support\Capabilities;
use Yaxii\ShippingManager\Support\JsonResponse;

defined( 'ABSPATH' ) || exit;

final class SettingsController {
	private bool $woocommerce_active;
	private SettingsRepository $settings;

	public function __construct( bool $woocommerce_active, SettingsRepository $settings ) {
		$this->woocommerce_active = $woocommerce_active;
		$this->settings           = $settings;
	}

	/**
	 * @return \WP_REST_Response
	 */
	public function get_settings() {
		return JsonResponse::read( $this->settings->read() );
	}

	/**
	 * @return \WP_REST_Response|WP_Error
	 */
	public function update_settings( WP_REST_Request $request ) {
		$saved_settings = $this->settings->save( $request->get_json_params() );

		if ( is_wp_error( $saved_settings ) ) {
			return $saved_settings;
		}

		return JsonResponse::read( $saved_settings );
	}

	public function can_read(): bool {
		return current_user_can( $this->required_capability() );
	}

	public function can_update( WP_REST_Request $request ): bool {
		if ( ! current_user_can( $this->required_capability() ) ) {
			return false;
		}

		return false !== wp_verify_nonce( (string) $request->get_header( 'X-WP-Nonce' ), 'wp_rest' );
	}

	private function required_capability(): string {
		return Capabilities::required_capability( $this->woocommerce_active );
	}
}
