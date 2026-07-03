<?php
/**
 * REST response helpers.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Support;

defined( 'ABSPATH' ) || exit;

final class JsonResponse {
	/**
	 * @param array<string,mixed> $payload Response payload.
	 *
	 * @return \WP_REST_Response
	 */
	public static function read( array $payload ) {
		return rest_ensure_response( $payload );
	}
}
