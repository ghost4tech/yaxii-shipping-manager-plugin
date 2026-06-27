<?php
/**
 * Preview request sanitizer.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Preview;

use WP_Error;

defined( 'ABSPATH' ) || exit;

final class PreviewRequestSanitizer {
	private const TOP_LEVEL_KEYS = array(
		'selectedWilayaCodes',
		'pricingRows',
		'methods',
		'zoneNameFormat',
		'zonePrefix',
		'regionLabelFormat',
	);

	private const METHOD_KEYS = array( 'home_delivery', 'office_delivery', 'custom_1', 'custom_2' );
	private const METHOD_FIELDS = array( 'key', 'enabled', 'label', 'defaultPrice', 'type', 'locked' );
	private const PRICING_FIELDS = array( 'wilayaCode', 'enabled', 'methods' );
	private const REGION_LABEL_FORMATS = array( 'fr', 'ar', 'fr_ar', 'ar_fr' );
	private const ZONE_NAME_FORMATS = array( 'prefix_code_name', 'code_name', 'name_only', 'prefix_name' );

	/**
	 * @param mixed $payload Request JSON payload.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	public function sanitize( $payload ) {
		if ( null === $payload ) {
			return array();
		}

		if ( ! is_array( $payload ) || $this->is_list( $payload ) ) {
			return $this->validation_error( __( 'Preview payload must be a JSON object.', 'yaxii-shipping-manager' ) );
		}

		$unknown_keys = $this->unknown_keys( $payload, self::TOP_LEVEL_KEYS );
		if ( array() !== $unknown_keys ) {
			return $this->validation_error(
				sprintf(
					/* translators: %s: comma-separated preview keys. */
					__( 'Unknown preview keys: %s.', 'yaxii-shipping-manager' ),
					implode( ', ', $unknown_keys )
				)
			);
		}

		$sanitized = array();
		$error     = $this->sanitize_top_level_fields( $payload, $sanitized );

		return is_wp_error( $error ) ? $error : $sanitized;
	}

	/**
	 * @param array<string,mixed> $payload Request payload.
	 * @param array<string,mixed> $sanitized Sanitized output.
	 *
	 * @return true|WP_Error
	 */
	private function sanitize_top_level_fields( array $payload, array &$sanitized ) {
		if ( array_key_exists( 'selectedWilayaCodes', $payload ) ) {
			$codes = $this->wilaya_codes( $payload['selectedWilayaCodes'], 'selectedWilayaCodes' );
			if ( is_wp_error( $codes ) ) {
				return $codes;
			}
			$sanitized['selectedWilayaCodes'] = $codes;
		}

		$choices = array(
			'zoneNameFormat'    => self::ZONE_NAME_FORMATS,
			'regionLabelFormat' => self::REGION_LABEL_FORMATS,
		);
		foreach ( $choices as $field => $allowed_values ) {
			if ( ! array_key_exists( $field, $payload ) ) {
				continue;
			}

			$choice = $this->choice( $payload[ $field ], $allowed_values, $field );
			if ( is_wp_error( $choice ) ) {
				return $choice;
			}
			$sanitized[ $field ] = $choice;
		}

		if ( array_key_exists( 'zonePrefix', $payload ) ) {
			$sanitized['zonePrefix'] = sanitize_text_field( (string) $payload['zonePrefix'] );
		}

		return $this->sanitize_list_fields( $payload, $sanitized );
	}

	/**
	 * @param array<string,mixed> $payload Request payload.
	 * @param array<string,mixed> $sanitized Sanitized output.
	 *
	 * @return true|WP_Error
	 */
	private function sanitize_list_fields( array $payload, array &$sanitized ) {
		if ( array_key_exists( 'methods', $payload ) ) {
			$methods = $this->methods( $payload['methods'] );
			if ( is_wp_error( $methods ) ) {
				return $methods;
			}
			$sanitized['methods'] = $methods;
		}

		if ( array_key_exists( 'pricingRows', $payload ) ) {
			$pricing_rows = $this->pricing_rows( $payload['pricingRows'] );
			if ( is_wp_error( $pricing_rows ) ) {
				return $pricing_rows;
			}
			$sanitized['pricingRows'] = $pricing_rows;
		}

		return true;
	}

	/**
	 * @param mixed  $raw_codes Raw code list.
	 * @param string $field Field name.
	 *
	 * @return array<int,string>|WP_Error
	 */
	private function wilaya_codes( $raw_codes, string $field ) {
		if ( ! is_array( $raw_codes ) || ! $this->is_list( $raw_codes ) ) {
			return $this->validation_error(
				sprintf(
					/* translators: %s: field name. */
					__( '%s must be an array of wilaya codes.', 'yaxii-shipping-manager' ),
					$field
				)
			);
		}

		$codes = array();
		foreach ( $raw_codes as $raw_code ) {
			$code = is_scalar( $raw_code ) ? sanitize_text_field( (string) $raw_code ) : '';
			if ( 1 !== preg_match( '/^\d{2}$/', $code ) ) {
				return $this->validation_error( __( 'Wilaya codes must be two digits.', 'yaxii-shipping-manager' ) );
			}
			$codes[] = $code;
		}

		return array_values( array_unique( $codes ) );
	}

	/**
	 * @param mixed $raw_methods Raw methods.
	 *
	 * @return array<int,array<string,mixed>>|WP_Error
	 */
	private function methods( $raw_methods ) {
		if ( ! is_array( $raw_methods ) || ! $this->is_list( $raw_methods ) ) {
			return $this->validation_error( __( 'Preview methods must be an array.', 'yaxii-shipping-manager' ) );
		}

		$methods      = array();
		$seen_methods = array();
		foreach ( $raw_methods as $raw_method ) {
			$method = $this->method( $raw_method );
			if ( is_wp_error( $method ) ) {
				return $method;
			}
			if ( isset( $seen_methods[ $method['key'] ] ) ) {
				return $this->validation_error( __( 'Preview method keys must be unique.', 'yaxii-shipping-manager' ) );
			}
			$seen_methods[ $method['key'] ] = true;
			$methods[] = $method;
		}

		return $methods;
	}

	/**
	 * @param mixed $raw_method Raw method.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private function method( $raw_method ) {
		if ( ! is_array( $raw_method ) || $this->is_list( $raw_method ) ) {
			return $this->validation_error( __( 'Each preview method must be an object.', 'yaxii-shipping-manager' ) );
		}

		$unknown_fields = $this->unknown_keys( $raw_method, self::METHOD_FIELDS );
		if ( array() !== $unknown_fields ) {
			return $this->validation_error( __( 'Preview method contains unknown fields.', 'yaxii-shipping-manager' ) );
		}

		$method_key = sanitize_key( (string) ( $raw_method['key'] ?? '' ) );
		if ( ! in_array( $method_key, self::METHOD_KEYS, true ) ) {
			return $this->validation_error( __( 'Preview method key is invalid.', 'yaxii-shipping-manager' ) );
		}

		if ( isset( $raw_method['type'] ) && 'flat_rate' !== $raw_method['type'] ) {
			return $this->validation_error( __( 'Preview methods must use flat_rate type.', 'yaxii-shipping-manager' ) );
		}

		$price = $this->price( $raw_method['defaultPrice'] ?? null );
		if ( is_wp_error( $price ) ) {
			return $price;
		}

		return array(
			'key'          => $method_key,
			'enabled'      => isset( $raw_method['enabled'] ) ? (bool) $raw_method['enabled'] : false,
			'label'        => sanitize_text_field( (string) ( $raw_method['label'] ?? '' ) ),
			'defaultPrice' => $price,
			'type'         => 'flat_rate',
			'locked'       => isset( $raw_method['locked'] ) ? (bool) $raw_method['locked'] : false,
		);
	}

	/**
	 * @param mixed $raw_rows Raw pricing rows.
	 *
	 * @return array<int,array<string,mixed>>|WP_Error
	 */
	private function pricing_rows( $raw_rows ) {
		if ( ! is_array( $raw_rows ) || ! $this->is_list( $raw_rows ) ) {
			return $this->validation_error( __( 'Pricing rows must be an array.', 'yaxii-shipping-manager' ) );
		}

		$rows = array();
		foreach ( $raw_rows as $raw_row ) {
			$row = $this->pricing_row( $raw_row );
			if ( is_wp_error( $row ) ) {
				return $row;
			}
			$rows[] = $row;
		}

		return $rows;
	}

	/**
	 * @param mixed $raw_row Raw pricing row.
	 *
	 * @return array<string,mixed>|WP_Error
	 */
	private function pricing_row( $raw_row ) {
		if ( ! is_array( $raw_row ) || $this->is_list( $raw_row ) ) {
			return $this->validation_error( __( 'Each pricing row must be an object.', 'yaxii-shipping-manager' ) );
		}

		$unknown_fields = $this->unknown_keys( $raw_row, self::PRICING_FIELDS );
		if ( array() !== $unknown_fields ) {
			return $this->validation_error( __( 'Pricing row contains unknown fields.', 'yaxii-shipping-manager' ) );
		}

		$code = sanitize_text_field( (string) ( $raw_row['wilayaCode'] ?? '' ) );
		if ( 1 !== preg_match( '/^\d{2}$/', $code ) ) {
			return $this->validation_error( __( 'Pricing row wilayaCode must be two digits.', 'yaxii-shipping-manager' ) );
		}

		$methods = $this->pricing_methods( $raw_row['methods'] ?? array() );
		if ( is_wp_error( $methods ) ) {
			return $methods;
		}

		return array(
			'wilayaCode' => $code,
			'enabled'    => array_key_exists( 'enabled', $raw_row ) ? (bool) $raw_row['enabled'] : true,
			'methods'    => $methods,
		);
	}

	/**
	 * @param mixed $raw_methods Raw pricing method map.
	 *
	 * @return array<string,int|float|null>|WP_Error
	 */
	private function pricing_methods( $raw_methods ) {
		if ( ! is_array( $raw_methods ) || $this->is_list( $raw_methods ) ) {
			return $this->validation_error( __( 'Pricing row methods must be an object.', 'yaxii-shipping-manager' ) );
		}

		$methods = array();
		foreach ( $raw_methods as $method_key => $raw_price ) {
			$method_key = sanitize_key( (string) $method_key );
			if ( ! in_array( $method_key, self::METHOD_KEYS, true ) ) {
				return $this->validation_error( __( 'Pricing row method key is invalid.', 'yaxii-shipping-manager' ) );
			}
			$price = $this->price( $raw_price );
			if ( is_wp_error( $price ) ) {
				return $price;
			}
			$methods[ $method_key ] = $price;
		}

		return $methods;
	}

	/**
	 * @param mixed $price Raw price.
	 *
	 * @return int|float|null|WP_Error
	 */
	private function price( $price ) {
		if ( null === $price || '' === $price ) {
			return null;
		}

		if ( ! is_int( $price ) && ! is_float( $price ) && ! ( is_string( $price ) && is_numeric( $price ) ) ) {
			return $this->validation_error( __( 'Preview prices must be non-negative numbers or null.', 'yaxii-shipping-manager' ) );
		}

		$numeric_price = $price + 0;
		if ( $numeric_price < 0 ) {
			return $this->validation_error( __( 'Preview prices cannot be negative.', 'yaxii-shipping-manager' ) );
		}

		return $numeric_price;
	}

	/**
	 * @param mixed             $raw_value Raw choice.
	 * @param array<int,string> $allowed_values Allowed values.
	 *
	 * @return string|WP_Error
	 */
	private function choice( $raw_value, array $allowed_values, string $field ) {
		$choice = is_scalar( $raw_value ) ? sanitize_key( (string) $raw_value ) : '';
		if ( in_array( $choice, $allowed_values, true ) ) {
			return $choice;
		}

		return $this->validation_error(
			sprintf(
				/* translators: %s: preview field name. */
				__( 'Invalid preview value for %s.', 'yaxii-shipping-manager' ),
				$field
			)
		);
	}

	/**
	 * @param array<string,mixed> $payload Payload to inspect.
	 * @param array<int,string>  $allowed_keys Allowed keys.
	 *
	 * @return array<int,string>
	 */
	private function unknown_keys( array $payload, array $allowed_keys ): array {
		return array_values( array_diff( array_keys( $payload ), $allowed_keys ) );
	}

	private function validation_error( string $message ): WP_Error {
		return new WP_Error(
			'yaxii_shipping_manager_invalid_preview',
			$message,
			array( 'status' => 400 )
		);
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
