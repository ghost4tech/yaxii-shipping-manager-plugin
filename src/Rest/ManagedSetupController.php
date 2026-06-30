<?php
/**
 * REST controller for read-only managed setup tools.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use Yaxii\ShippingManager\Support\Capabilities;
use Yaxii\ShippingManager\Support\JsonResponse;
use Yaxii\ShippingManager\Tools\ManagedSetupRemovalPreview;

defined( 'ABSPATH' ) || exit;

final class ManagedSetupController {
	private bool $woocommerce_active;
	private ManagedSetupRemovalPreview $removal_preview;

	public function __construct( bool $woocommerce_active, ManagedSetupRemovalPreview $removal_preview ) {
		$this->woocommerce_active = $woocommerce_active;
		$this->removal_preview    = $removal_preview;
	}

	/**
	 * @return \WP_REST_Response
	 */
	public function get_removal_preview() {
		return JsonResponse::read( $this->removal_preview->payload() );
	}

	public function can_access(): bool {
		return current_user_can( Capabilities::required_capability( $this->woocommerce_active ) );
	}
}
