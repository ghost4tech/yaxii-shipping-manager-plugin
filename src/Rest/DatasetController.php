<?php
/**
 * REST dataset controller.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Rest;

use WP_Error;
use WP_REST_Request;
use Yaxii\ShippingManager\Data\DatasetMode;
use Yaxii\ShippingManager\Data\DatasetReadException;
use Yaxii\ShippingManager\Data\DatasetRepository;
use Yaxii\ShippingManager\Support\Capabilities;
use Yaxii\ShippingManager\Support\JsonResponse;

defined( 'ABSPATH' ) || exit;

final class DatasetController {
	private bool $woocommerce_active;
	private DatasetRepository $datasets;

	public function __construct( bool $woocommerce_active, DatasetRepository $datasets ) {
		$this->woocommerce_active = $woocommerce_active;
		$this->datasets           = $datasets;
	}

	/**
	 * REST callback for normalized dataset reads.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public function get_dataset( WP_REST_Request $request ) {
		$mode        = (string) $request->get_param( 'mode' );
		$include     = (string) $request->get_param( 'include' );
		$wilaya_code = (string) $request->get_param( 'wilaya_code' );

		try {
			$metadata = $this->datasets->metadata( $mode );
			$payload  = array(
				'mode'     => $mode,
				'include'  => $include,
				'metadata' => $metadata,
			);

			if ( 'summary' === $include ) {
				$payload['status'] = $this->datasets->dataset_status();
				return JsonResponse::read( $payload );
			}

			if ( 'wilayas' === $include ) {
				$payload['wilayas'] = $this->datasets->wilayas( $mode );
				return JsonResponse::read( $payload );
			}

			$payload['communes'] = $this->datasets->communes( $mode, $wilaya_code );
			return JsonResponse::read( $payload );
		} catch ( DatasetReadException $exception ) {
			return new WP_Error(
				'yaxii_shipping_manager_dataset_read_failed',
				$exception->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	public function can_access(): bool {
		return current_user_can( Capabilities::required_capability( $this->woocommerce_active ) );
	}

	public static function sanitize_mode( $mode, ...$context ): string {
		return sanitize_key( is_string( $mode ) ? $mode : DatasetMode::CURRENT );
	}

	public static function validate_mode( $mode, ...$context ): bool {
		return is_string( $mode ) && DatasetMode::is_valid( $mode );
	}

	public static function sanitize_include( $include, ...$context ): string {
		return sanitize_key( is_string( $include ) ? $include : 'wilayas' );
	}

	public static function validate_include( $include, ...$context ): bool {
		return is_string( $include ) && in_array( $include, array( 'summary', 'wilayas', 'communes' ), true );
	}

	public static function sanitize_wilaya_code( $wilaya_code, ...$context ): string {
		return sanitize_text_field( is_string( $wilaya_code ) ? $wilaya_code : '' );
	}

	public static function validate_wilaya_code( $wilaya_code, ...$context ): bool {
		return '' === $wilaya_code || ( is_string( $wilaya_code ) && 1 === preg_match( '/^\d{2}$/', $wilaya_code ) );
	}
}
