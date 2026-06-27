<?php
/**
 * REST diagnostics controller.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use WP_Error;
use Yaxii\ShippingManager\Data\DatasetReadException;
use Yaxii\ShippingManager\Support\Capabilities;
use Yaxii\ShippingManager\Support\JsonResponse;
use Yaxii\ShippingManager\WooCommerce\ShippingDiagnosticsService;

defined( 'ABSPATH' ) || exit;

final class DiagnosticsController {
	private bool $woocommerce_active;
	private ShippingDiagnosticsService $diagnostics;

	public function __construct( bool $woocommerce_active, ShippingDiagnosticsService $diagnostics ) {
		$this->woocommerce_active = $woocommerce_active;
		$this->diagnostics        = $diagnostics;
	}

	/**
	 * @return \WP_REST_Response|WP_Error
	 */
	public function get_diagnostics() {
		try {
			return JsonResponse::read( $this->diagnostics->diagnostics() );
		} catch ( DatasetReadException $exception ) {
			return new WP_Error(
				'yaxii_shipping_manager_diagnostics_dataset_failed',
				$exception->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	public function can_access(): bool {
		return current_user_can( Capabilities::required_capability( $this->woocommerce_active ) );
	}
}
