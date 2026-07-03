<?php
/**
 * REST preview controller.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use WP_Error;
use WP_REST_Request;
use Yaxii\ShippingManager\Data\DatasetReadException;
use Yaxii\ShippingManager\Preview\PreviewPlanner;
use Yaxii\ShippingManager\Preview\PreviewRequestSanitizer;
use Yaxii\ShippingManager\Support\Capabilities;
use Yaxii\ShippingManager\Support\JsonResponse;

defined( 'ABSPATH' ) || exit;

final class PreviewController {
	private bool $woocommerce_active;
	private PreviewPlanner $planner;
	private PreviewRequestSanitizer $sanitizer;

	public function __construct(
		bool $woocommerce_active,
		PreviewPlanner $planner,
		PreviewRequestSanitizer $sanitizer
	) {
		$this->woocommerce_active = $woocommerce_active;
		$this->planner            = $planner;
		$this->sanitizer          = $sanitizer;
	}

	/**
	 * @return \WP_REST_Response|WP_Error
	 */
	public function create_preview( WP_REST_Request $request ) {
		$overrides = $this->sanitizer->sanitize( $request->get_json_params() );
		if ( is_wp_error( $overrides ) ) {
			return $overrides;
		}

		try {
			return JsonResponse::read( $this->planner->plan( $overrides ) );
		} catch ( DatasetReadException $exception ) {
			return new WP_Error(
				'yaxii_shipping_manager_preview_dataset_failed',
				$exception->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	public function can_preview( WP_REST_Request $request ): bool {
		if ( ! current_user_can( Capabilities::required_capability( $this->woocommerce_active ) ) ) {
			return false;
		}

		return false !== wp_verify_nonce( (string) $request->get_header( 'X-WP-Nonce' ), 'wp_rest' );
	}
}
