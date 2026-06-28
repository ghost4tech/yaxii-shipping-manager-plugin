<?php
/**
 * Disabled apply safety validator.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Apply;

defined( 'ABSPATH' ) || exit;

final class ApplySafetyValidator {
	/**
	 * @param array<string,mixed> $apply_request Sanitized apply request.
	 *
	 * @return array<string,mixed>
	 */
	public function disabled_response( array $apply_request ): array {
		return array(
			'applyEngineAvailable' => false,
			'message'              => __( 'Apply engine is not enabled yet.', 'yaxii-shipping-manager' ),
			'applyContractVersion' => ApplyRequestSanitizer::CONTRACT_VERSION,
			'requestAccepted'      => true,
			'validatedRequest'     => $apply_request,
			'requiredNextSteps'    => array(
				__( 'Re-read WooCommerce zones immediately before a future apply.', 'yaxii-shipping-manager' ),
				__( 'Compare the submitted preview hash with a freshly generated preview.', 'yaxii-shipping-manager' ),
				__( 'Apply only an explicitly reviewed plan after the safe apply engine is implemented.', 'yaxii-shipping-manager' ),
			),
			'warnings'             => array(
				__( 'No WooCommerce changes were made.', 'yaxii-shipping-manager' ),
				__( 'The real apply engine is intentionally unavailable in this version.', 'yaxii-shipping-manager' ),
			),
		);
	}
}
