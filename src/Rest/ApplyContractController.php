<?php
/**
 * REST apply contract controller.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use Yaxii\ShippingManager\Apply\ApplyContract;
use Yaxii\ShippingManager\Support\Capabilities;
use Yaxii\ShippingManager\Support\JsonResponse;

defined( 'ABSPATH' ) || exit;

final class ApplyContractController {
	private bool $woocommerce_active;
	private ApplyContract $apply_contract;

	public function __construct( bool $woocommerce_active, ApplyContract $apply_contract ) {
		$this->woocommerce_active = $woocommerce_active;
		$this->apply_contract     = $apply_contract;
	}

	/**
	 * @return \WP_REST_Response
	 */
	public function get_apply_contract() {
		return JsonResponse::read( $this->apply_contract->payload() );
	}

	public function can_access(): bool {
		return current_user_can( Capabilities::required_capability( $this->woocommerce_active ) );
	}
}
