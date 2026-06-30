<?php
/**
 * REST controller for read-only managed setup tools.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use WP_REST_Request;
use Yaxii\ShippingManager\Support\Capabilities;
use Yaxii\ShippingManager\Support\JsonResponse;
use Yaxii\ShippingManager\Tools\ManagedSetupRemovalExecutor;
use Yaxii\ShippingManager\Tools\ManagedSetupRemovalPreview;

defined( 'ABSPATH' ) || exit;

final class ManagedSetupController {
	private bool $woocommerce_active;
	private ManagedSetupRemovalPreview $removal_preview;
	private ManagedSetupRemovalExecutor $removal_executor;

	public function __construct(
		bool $woocommerce_active,
		ManagedSetupRemovalPreview $removal_preview,
		ManagedSetupRemovalExecutor $removal_executor
	) {
		$this->woocommerce_active  = $woocommerce_active;
		$this->removal_preview     = $removal_preview;
		$this->removal_executor    = $removal_executor;
	}

	/**
	 * @return \WP_REST_Response
	 */
	public function get_removal_preview() {
		return JsonResponse::read( $this->removal_preview->payload() );
	}

	/**
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create_removal( WP_REST_Request $request ) {
		$payload = $request->get_json_params();
		$result  = $this->removal_executor->remove( is_array( $payload ) ? $payload : array() );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return JsonResponse::read( $result );
	}

	public function can_access(): bool {
		return current_user_can( Capabilities::required_capability( $this->woocommerce_active ) );
	}

	public function can_remove( WP_REST_Request $request ): bool {
		if ( ! current_user_can( Capabilities::required_capability( $this->woocommerce_active ) ) ) {
			return false;
		}

		return false !== wp_verify_nonce( (string) $request->get_header( 'X-WP-Nonce' ), 'wp_rest' );
	}
}
