<?php
/**
 * REST apply controller.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use WP_REST_Request;
use Yaxii\ShippingManager\Apply\ApplyRequestSanitizer;
use Yaxii\ShippingManager\Apply\SafeApplyEngine;
use Yaxii\ShippingManager\Support\Capabilities;
use Yaxii\ShippingManager\Support\JsonResponse;

defined( 'ABSPATH' ) || exit;

final class ApplyController {
	private bool $woocommerce_active;
	private ApplyRequestSanitizer $sanitizer;
	private SafeApplyEngine $apply_engine;

	public function __construct(
		bool $woocommerce_active,
		ApplyRequestSanitizer $sanitizer,
		SafeApplyEngine $apply_engine
	) {
		$this->woocommerce_active = $woocommerce_active;
		$this->sanitizer          = $sanitizer;
		$this->apply_engine       = $apply_engine;
	}

	/**
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_apply_contract( WP_REST_Request $request ) {
		$apply_request = $this->sanitizer->sanitize( $request->get_json_params() );
		if ( is_wp_error( $apply_request ) ) {
			return $apply_request;
		}

		$apply_response = $this->apply_engine->apply( $apply_request );
		if ( is_wp_error( $apply_response ) ) {
			return $apply_response;
		}

		return JsonResponse::read( $apply_response );
	}

	public function can_apply( WP_REST_Request $request ): bool {
		if ( ! current_user_can( Capabilities::required_capability( $this->woocommerce_active ) ) ) {
			return false;
		}

		return false !== wp_verify_nonce( (string) $request->get_header( 'X-WP-Nonce' ), 'wp_rest' );
	}
}
