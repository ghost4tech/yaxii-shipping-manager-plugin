<?php
/**
 * REST apply controller.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use WP_REST_Request;
use Yaxii\ShippingManager\Apply\ApplyRequestSanitizer;
use Yaxii\ShippingManager\Apply\ApplySafetyValidator;
use Yaxii\ShippingManager\Support\Capabilities;
use Yaxii\ShippingManager\Support\JsonResponse;

defined( 'ABSPATH' ) || exit;

final class ApplyController {
	private bool $woocommerce_active;
	private ApplyRequestSanitizer $sanitizer;
	private ApplySafetyValidator $validator;

	public function __construct(
		bool $woocommerce_active,
		ApplyRequestSanitizer $sanitizer,
		ApplySafetyValidator $validator
	) {
		$this->woocommerce_active = $woocommerce_active;
		$this->sanitizer          = $sanitizer;
		$this->validator          = $validator;
	}

	/**
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_apply_contract( WP_REST_Request $request ) {
		$apply_request = $this->sanitizer->sanitize( $request->get_json_params() );
		if ( is_wp_error( $apply_request ) ) {
			return $apply_request;
		}

		return JsonResponse::read( $this->validator->disabled_response( $apply_request ) );
	}

	public function can_apply( WP_REST_Request $request ): bool {
		if ( ! current_user_can( Capabilities::required_capability( $this->woocommerce_active ) ) ) {
			return false;
		}

		return false !== wp_verify_nonce( (string) $request->get_header( 'X-WP-Nonce' ), 'wp_rest' );
	}
}
