<?php
/**
 * Future apply request sanitizer.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Apply;

use WP_Error;
use Yaxii\ShippingManager\Preview\PreviewRequestSanitizer;

defined( 'ABSPATH' ) || exit;

final class ApplyRequestSanitizer {
	public const CONTRACT_VERSION = 'apply-contract-v1';
	public const CONFIRMATION_TEXT = 'APPLY YAXII SHIPPING PLAN';
	private const MAX_PREVIEW_AGE_SECONDS = 1800;
	private const FUTURE_PREVIEW_GRACE_SECONDS = 300;
	private const TOP_LEVEL_KEYS = array(
		'previewHash',
		'previewGeneratedAt',
		'selectedWilayaCodes',
		'acceptedPlanSummary',
		'confirmed',
		'confirmationText',
		'safetyPolicySnapshot',
		'applyContractVersion',
		'previewRequest',
	);
	private const SUMMARY_KEYS = array(
		'selectedWilayas',
		'createZones',
		'updateZones',
		'addMethods',
		'updateMethods',
		'updateMethodStatuses',
		'skipManualZones',
		'conflicts',
		'warnings',
		'unchanged',
		'deleteZones',
	);
	private const SAFETY_KEYS = array(
		'protectManualZones',
		'requirePreviewBeforeApply',
		'skipConflictsByDefault',
		'neverDeleteManualZones',
	);

	private PreviewRequestSanitizer $preview_sanitizer;

	public function __construct( ?PreviewRequestSanitizer $preview_sanitizer = null ) {
		$this->preview_sanitizer = $preview_sanitizer ?? new PreviewRequestSanitizer();
	}

	/**
	 * @param mixed $payload Request JSON payload.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	public function sanitize( $payload ) {
		if ( ! is_array( $payload ) || $this->is_list( $payload ) ) {
			return $this->validation_error( __( 'Apply payload must be a JSON object.', 'yaxii-shipping-manager' ) );
		}

		$unknown_keys = $this->unknown_keys( $payload, self::TOP_LEVEL_KEYS );
		if ( array() !== $unknown_keys ) {
			return $this->validation_error(
				sprintf(
					/* translators: %s: comma-separated apply request keys. */
					__( 'Unknown apply keys: %s.', 'yaxii-shipping-manager' ),
					implode( ', ', $unknown_keys )
				)
			);
		}

		return $this->sanitize_required_payload( $payload );
	}

	/**
	 * @param array<string,mixed> $payload Request payload.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private function sanitize_required_payload( array $payload ) {
		$missing_keys = array_values( array_diff( self::TOP_LEVEL_KEYS, array_keys( $payload ) ) );
		if ( array() !== $missing_keys ) {
			return $this->validation_error( __( 'Apply request is missing required fields.', 'yaxii-shipping-manager' ) );
		}

		$preview_hash = $this->preview_hash( $payload['previewHash'] );
		if ( is_wp_error( $preview_hash ) ) {
			return $preview_hash;
		}

		$preview_generated_at = $this->preview_generated_at( $payload['previewGeneratedAt'] );
		if ( is_wp_error( $preview_generated_at ) ) {
			return $preview_generated_at;
		}

		return $this->sanitize_remaining_fields( $payload, $preview_hash, $preview_generated_at );
	}

	/**
	 * @param array<string,mixed> $payload Request payload.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private function sanitize_remaining_fields( array $payload, string $preview_hash, string $preview_generated_at ) {
		$codes = $this->wilaya_codes( $payload['selectedWilayaCodes'] );
		if ( is_wp_error( $codes ) ) {
			return $codes;
		}

		$summary = $this->accepted_plan_summary( $payload['acceptedPlanSummary'] );
		if ( is_wp_error( $summary ) ) {
			return $summary;
		}

		$safety_policy = $this->safety_policy_snapshot( $payload['safetyPolicySnapshot'] );
		if ( is_wp_error( $safety_policy ) ) {
			return $safety_policy;
		}

		$preview_request = $this->preview_request( $payload['previewRequest'], $codes );
		if ( is_wp_error( $preview_request ) ) {
			return $preview_request;
		}

		return $this->confirmed_payload( $payload, $preview_hash, $preview_generated_at, $codes, $summary, $safety_policy, $preview_request );
	}

	/**
	 * @param array<string,mixed> $payload Request payload.
	 * @param array<int,string>   $codes Selected wilaya codes.
	 * @param array<string,int>   $summary Accepted plan summary.
	 * @param array<string,bool>  $safety_policy Safety policy snapshot.
	 * @param array<string,mixed> $preview_request Sanitized preview request snapshot.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private function confirmed_payload( array $payload, string $preview_hash, string $preview_generated_at, array $codes, array $summary, array $safety_policy, array $preview_request ) {
		if ( true !== $payload['confirmed'] ) {
			return $this->validation_error( __( 'Apply request requires explicit confirmation.', 'yaxii-shipping-manager' ) );
		}

		$confirmation_text = sanitize_text_field( (string) $payload['confirmationText'] );
		if ( self::CONFIRMATION_TEXT !== $confirmation_text ) {
			return $this->validation_error( __( 'Apply confirmation text does not match the required phrase.', 'yaxii-shipping-manager' ) );
		}

		$contract_version = sanitize_key( (string) $payload['applyContractVersion'] );
		if ( self::CONTRACT_VERSION !== $contract_version ) {
			return $this->validation_error( __( 'Apply contract version is not supported.', 'yaxii-shipping-manager' ) );
		}

		return array(
			'previewHash'          => $preview_hash,
			'previewGeneratedAt'   => $preview_generated_at,
			'selectedWilayaCodes'  => $codes,
			'acceptedPlanSummary'  => $summary,
			'confirmed'            => true,
			'confirmationText'     => $confirmation_text,
			'safetyPolicySnapshot' => $safety_policy,
			'applyContractVersion' => $contract_version,
			'previewRequest'       => $preview_request,
		);
	}

	/**
	 * @param mixed             $raw_preview_request Raw preview request snapshot.
	 * @param array<int,string> $codes Selected wilaya codes.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private function preview_request( $raw_preview_request, array $codes ) {
		$preview_request = $this->preview_sanitizer->sanitize( $raw_preview_request );
		if ( is_wp_error( $preview_request ) ) {
			return $preview_request;
		}

		if ( ! isset( $preview_request['selectedWilayaCodes'] ) || $codes !== $preview_request['selectedWilayaCodes'] ) {
			return $this->validation_error( __( 'Apply selected wilayas must match the preview request snapshot.', 'yaxii-shipping-manager' ) );
		}

		return $preview_request;
	}

	/**
	 * @param mixed $raw_hash Raw preview hash.
	 *
	 * @return string|WP_Error
	 */
	private function preview_hash( $raw_hash ) {
		$preview_hash = strtolower( sanitize_text_field( (string) $raw_hash ) );
		if ( 1 !== preg_match( '/^[a-f0-9]{64}$/', $preview_hash ) ) {
			return $this->validation_error( __( 'Preview hash must be a 64-character SHA-256 value.', 'yaxii-shipping-manager' ) );
		}

		return $preview_hash;
	}

	/**
	 * @param mixed $raw_timestamp Raw preview timestamp.
	 *
	 * @return string|WP_Error
	 */
	private function preview_generated_at( $raw_timestamp ) {
		$preview_generated_at = sanitize_text_field( (string) $raw_timestamp );
		$timestamp            = strtotime( $preview_generated_at );
		if ( false === $timestamp ) {
			return $this->validation_error( __( 'Preview timestamp is invalid.', 'yaxii-shipping-manager' ) );
		}

		$now = time();
		if ( $timestamp < ( $now - self::MAX_PREVIEW_AGE_SECONDS ) || $timestamp > ( $now + self::FUTURE_PREVIEW_GRACE_SECONDS ) ) {
			return $this->validation_error( __( 'Preview is stale or from the future. Generate a new preview before applying.', 'yaxii-shipping-manager' ) );
		}

		return gmdate( 'c', $timestamp );
	}

	/**
	 * @param mixed $raw_codes Raw code list.
	 *
	 * @return array<int,string>|WP_Error
	 */
	private function wilaya_codes( $raw_codes ) {
		if ( ! is_array( $raw_codes ) || ! $this->is_list( $raw_codes ) || array() === $raw_codes ) {
			return $this->validation_error( __( 'Apply request must include selected wilaya codes.', 'yaxii-shipping-manager' ) );
		}

		$codes = array();
		foreach ( $raw_codes as $raw_code ) {
			$code = is_scalar( $raw_code ) ? sanitize_text_field( (string) $raw_code ) : '';
			if ( 1 !== preg_match( '/^\d{2}$/', $code ) ) {
				return $this->validation_error( __( 'Selected wilaya codes must be two digits.', 'yaxii-shipping-manager' ) );
			}
			$codes[] = $code;
		}

		return array_values( array_unique( $codes ) );
	}

	/**
	 * @param mixed $raw_summary Raw accepted plan summary.
	 *
	 * @return array<string,int>|WP_Error
	 */
	private function accepted_plan_summary( $raw_summary ) {
		if ( ! is_array( $raw_summary ) || $this->is_list( $raw_summary ) ) {
			return $this->validation_error( __( 'Accepted plan summary must be an object.', 'yaxii-shipping-manager' ) );
		}

		$unknown_keys = $this->unknown_keys( $raw_summary, self::SUMMARY_KEYS );
		if ( array() !== $unknown_keys ) {
			return $this->validation_error( __( 'Accepted plan summary contains unknown fields.', 'yaxii-shipping-manager' ) );
		}

		return $this->summary_counts( $raw_summary );
	}

	/**
	 * @param array<string,mixed> $raw_summary Raw accepted plan summary.
	 *
	 * @return array<string,int>|WP_Error
	 */
	private function summary_counts( array $raw_summary ) {
		$summary = array();
		foreach ( self::SUMMARY_KEYS as $key ) {
			if ( ! array_key_exists( $key, $raw_summary ) || ! $this->is_non_negative_integerish( $raw_summary[ $key ] ) ) {
				return $this->validation_error( __( 'Accepted plan summary counts must be non-negative integers.', 'yaxii-shipping-manager' ) );
			}

			$count = (int) $raw_summary[ $key ];
			if ( $count < 0 ) {
				return $this->validation_error( __( 'Accepted plan summary counts cannot be negative.', 'yaxii-shipping-manager' ) );
			}
			$summary[ $key ] = $count;
		}

		if ( 0 !== $summary['deleteZones'] ) {
			return $this->validation_error( __( 'Apply contract does not allow planned deletes.', 'yaxii-shipping-manager' ) );
		}

		return $summary;
	}

	/**
	 * @param mixed $raw_safety_policy Raw safety policy snapshot.
	 *
	 * @return array<string,bool>|WP_Error
	 */
	private function safety_policy_snapshot( $raw_safety_policy ) {
		if ( ! is_array( $raw_safety_policy ) || $this->is_list( $raw_safety_policy ) ) {
			return $this->validation_error( __( 'Safety policy snapshot must be an object.', 'yaxii-shipping-manager' ) );
		}

		$unknown_keys = $this->unknown_keys( $raw_safety_policy, self::SAFETY_KEYS );
		if ( array() !== $unknown_keys ) {
			return $this->validation_error( __( 'Safety policy snapshot contains unknown fields.', 'yaxii-shipping-manager' ) );
		}

		return $this->locked_safety_policy( $raw_safety_policy );
	}

	/**
	 * @param array<string,mixed> $raw_safety_policy Raw safety policy snapshot.
	 *
	 * @return array<string,bool>|WP_Error
	 */
	private function locked_safety_policy( array $raw_safety_policy ) {
		$safety_policy = array();
		foreach ( self::SAFETY_KEYS as $key ) {
			if ( true !== ( $raw_safety_policy[ $key ] ?? null ) ) {
				return $this->validation_error( __( 'All locked safety policy values must be true.', 'yaxii-shipping-manager' ) );
			}
			$safety_policy[ $key ] = true;
		}

		return $safety_policy;
	}

	/**
	 * @param array<string,mixed> $payload Payload to inspect.
	 * @param array<int,string>   $allowed_keys Allowed keys.
	 *
	 * @return array<int,string>
	 */
	private function unknown_keys( array $payload, array $allowed_keys ): array {
		return array_values( array_diff( array_keys( $payload ), $allowed_keys ) );
	}

	private function validation_error( string $message ): WP_Error {
		return new WP_Error(
			'yaxii_shipping_manager_invalid_apply_request',
			$message,
			array( 'status' => 400 )
		);
	}

	/**
	 * @param mixed $value Value to inspect.
	 */
	private function is_non_negative_integerish( $value ): bool {
		if ( is_int( $value ) ) {
			return $value >= 0;
		}

		return is_string( $value ) && 1 === preg_match( '/^\d+$/', $value );
	}

	/**
	 * @param array<mixed> $payload Payload to inspect.
	 */
	private function is_list( array $payload ): bool {
		if ( array() === $payload ) {
			return true;
		}

		return array_keys( $payload ) === range( 0, count( $payload ) - 1 );
	}
}
