<?php
/**
 * Settings sanitizer.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Settings;

use WP_Error;

defined( 'ABSPATH' ) || exit;

final class SettingsSanitizer {
	private const TOP_LEVEL_KEYS = array(
		'datasetMode',
		'regionLabelFormat',
		'zoneNameFormat',
		'zonePrefix',
		'officeWordingMode',
		'officeCustomLabel',
		'methods',
		'safetyPolicy',
	);

	private const METHOD_KEYS = array( 'home_delivery', 'office_delivery', 'custom_1', 'custom_2' );
	private const METHOD_FIELDS = array( 'key', 'enabled', 'label', 'defaultPrice', 'type', 'locked' );
	private const SAFETY_KEYS = array(
		'protectManualZones',
		'requirePreviewBeforeApply',
		'skipConflictsByDefault',
		'neverDeleteManualZones',
	);

	/**
	 * @param mixed $raw_settings Request body payload.
	 *
	 * @return array{settings:array<string,mixed>,warnings:array<int,string>}|WP_Error
	 */
	public function sanitize_for_save( $raw_settings ) {
		if ( ! is_array( $raw_settings ) || $this->is_list( $raw_settings ) ) {
			return $this->validation_error( __( 'Settings payload must be a JSON object.', 'yaxii-shipping-manager' ) );
		}

		$unknown_keys = $this->unknown_keys( $raw_settings, self::TOP_LEVEL_KEYS );
		if ( array() !== $unknown_keys ) {
			return $this->validation_error(
				sprintf(
					/* translators: %s: comma-separated settings keys. */
					__( 'Unknown settings keys: %s.', 'yaxii-shipping-manager' ),
					implode( ', ', $unknown_keys )
				)
			);
		}

		return $this->sanitize_settings( $raw_settings, true );
	}

	/**
	 * @param mixed $stored_settings Option payload.
	 *
	 * @return array{settings:array<string,mixed>,warnings:array<int,string>}
	 */
	public function sanitize_stored( $stored_settings ): array {
		if ( ! is_array( $stored_settings ) || $this->is_list( $stored_settings ) ) {
			return array(
				'settings' => SettingsDefaults::settings(),
				'warnings' => array( __( 'Stored settings were invalid and defaults were used.', 'yaxii-shipping-manager' ) ),
			);
		}

		$sanitized = $this->sanitize_settings( $stored_settings, false );

		if ( is_wp_error( $sanitized ) ) {
			return array(
				'settings' => SettingsDefaults::settings(),
				'warnings' => array( $sanitized->get_error_message() ),
			);
		}

		return $sanitized;
	}

	/**
	 * @param array<string,mixed> $raw_settings Raw settings.
	 *
	 * @return array{settings:array<string,mixed>,warnings:array<int,string>}|WP_Error
	 */
	private function sanitize_settings( array $raw_settings, bool $strict ) {
		$defaults = SettingsDefaults::settings();
		$warnings = array();

		$dataset_mode = $this->string_choice( $raw_settings, 'datasetMode', array( 'current', 'legacy_58' ), $defaults['datasetMode'], $strict );
		if ( is_wp_error( $dataset_mode ) ) {
			return $dataset_mode;
		}

		$settings = $defaults;
		$settings['datasetMode']       = $dataset_mode;
		$settings['regionLabelFormat'] = $this->string_choice( $raw_settings, 'regionLabelFormat', array( 'fr', 'ar', 'fr_ar', 'ar_fr' ), $defaults['regionLabelFormat'], $strict );
		$settings['zoneNameFormat']    = $this->string_choice( $raw_settings, 'zoneNameFormat', array( 'prefix_code_name', 'code_name', 'name_only', 'prefix_name' ), $defaults['zoneNameFormat'], $strict );
		$settings['officeWordingMode'] = $this->string_choice( $raw_settings, 'officeWordingMode', array( 'office_delivery', 'stopdesk', 'bureau', 'custom' ), $defaults['officeWordingMode'], $strict );

		foreach ( array( 'regionLabelFormat', 'zoneNameFormat', 'officeWordingMode' ) as $field ) {
			if ( is_wp_error( $settings[ $field ] ) ) {
				return $settings[ $field ];
			}
		}

		$settings['zonePrefix']        = $this->text_value( $raw_settings, 'zonePrefix', $defaults['zonePrefix'] );
		$settings['officeCustomLabel'] = $this->text_value( $raw_settings, 'officeCustomLabel', $defaults['officeCustomLabel'] );

		$methods = $this->sanitize_methods( $raw_settings['methods'] ?? $defaults['methods'], $strict );
		if ( is_wp_error( $methods ) ) {
			return $methods;
		}

		$safety_policy = $this->sanitize_safety_policy( $raw_settings['safetyPolicy'] ?? $defaults['safetyPolicy'], $strict );
		if ( is_wp_error( $safety_policy ) ) {
			return $safety_policy;
		}

		$settings['methods']      = $methods['methods'];
		$settings['safetyPolicy'] = $safety_policy['policy'];
		$warnings                 = array_merge( $warnings, $methods['warnings'], $safety_policy['warnings'] );

		return array(
			'settings' => $settings,
			'warnings' => $warnings,
		);
	}

	/**
	 * @param mixed $raw_methods Method list.
	 *
	 * @return array{methods:array<int,array<string,mixed>>,warnings:array<int,string>}|WP_Error
	 */
	private function sanitize_methods( $raw_methods, bool $strict ) {
		if ( ! is_array( $raw_methods ) || ! $this->is_list( $raw_methods ) ) {
			return $strict ? $this->validation_error( __( 'Methods must be a JSON array.', 'yaxii-shipping-manager' ) ) : array(
				'methods'  => SettingsDefaults::methods(),
				'warnings' => array( __( 'Stored methods were invalid and defaults were used.', 'yaxii-shipping-manager' ) ),
			);
		}

		$raw_methods_by_key = array();
		foreach ( $raw_methods as $raw_method ) {
			if ( ! is_array( $raw_method ) || $this->is_list( $raw_method ) || ! isset( $raw_method['key'] ) || ! is_string( $raw_method['key'] ) ) {
				return $this->validation_error( __( 'Each method must be an object with a method key.', 'yaxii-shipping-manager' ) );
			}

			$unknown_fields = $this->unknown_keys( $raw_method, self::METHOD_FIELDS );
			if ( array() !== $unknown_fields ) {
				return $this->validation_error(
					sprintf(
						/* translators: %s: comma-separated method field names. */
						__( 'Unknown method fields: %s.', 'yaxii-shipping-manager' ),
						implode( ', ', $unknown_fields )
					)
				);
			}

			$method_key = sanitize_key( $raw_method['key'] );
			if ( ! in_array( $method_key, self::METHOD_KEYS, true ) ) {
				return $this->validation_error(
					sprintf(
						/* translators: %s: method key. */
						__( 'Invalid method key: %s.', 'yaxii-shipping-manager' ),
						$method_key
					)
				);
			}

			if ( isset( $raw_methods_by_key[ $method_key ] ) ) {
				return $this->validation_error(
					sprintf(
						/* translators: %s: method key. */
						__( 'Duplicate method key: %s.', 'yaxii-shipping-manager' ),
						$method_key
					)
				);
			}

			$raw_methods_by_key[ $method_key ] = $raw_method;
		}

		return $this->method_defaults_with_overrides( $raw_methods_by_key );
	}

	/**
	 * @param array<string,array<string,mixed>> $raw_methods_by_key Method payloads indexed by key.
	 *
	 * @return array{methods:array<int,array<string,mixed>>,warnings:array<int,string>}|WP_Error
	 */
	private function method_defaults_with_overrides( array $raw_methods_by_key ) {
		$methods  = array();
		$warnings = array();

		foreach ( SettingsDefaults::methods() as $default_method ) {
			$method_key = (string) $default_method['key'];
			$raw_method = $raw_methods_by_key[ $method_key ] ?? array();

			if ( isset( $raw_method['type'] ) && 'flat_rate' !== $raw_method['type'] ) {
				return $this->validation_error( __( 'Only flat_rate method templates are supported.', 'yaxii-shipping-manager' ) );
			}

			$method = $default_method;
			$label  = $this->text_value( $raw_method, 'label', (string) $default_method['label'] );

			if ( '' !== $label ) {
				$method['label'] = $label;
			}

			$price = $this->price_value( $raw_method['defaultPrice'] ?? $default_method['defaultPrice'] );
			if ( is_wp_error( $price ) ) {
				return $price;
			}

			$method['defaultPrice'] = $price;

			if ( ! (bool) $default_method['locked'] ) {
				$method['enabled'] = isset( $raw_method['enabled'] ) ? (bool) $raw_method['enabled'] : (bool) $default_method['enabled'];
			}

			if (
				isset( $raw_method['enabled'] )
				&& (bool) $default_method['locked']
				&& false === (bool) $raw_method['enabled']
			) {
				$warnings[] = sprintf(
					/* translators: %s: method key. */
					__( '%s is required and was forced enabled.', 'yaxii-shipping-manager' ),
					$method_key
				);
			}

			$method['type']   = 'flat_rate';
			$method['locked'] = (bool) $default_method['locked'];
			$methods[]        = $method;
		}

		return array(
			'methods'  => $methods,
			'warnings' => $warnings,
		);
	}

	/**
	 * @param mixed $raw_policy Safety policy payload.
	 *
	 * @return array{policy:array<string,bool>,warnings:array<int,string>}|WP_Error
	 */
	private function sanitize_safety_policy( $raw_policy, bool $strict ) {
		if ( ! is_array( $raw_policy ) || $this->is_list( $raw_policy ) ) {
			return $strict ? $this->validation_error( __( 'Safety policy must be a JSON object.', 'yaxii-shipping-manager' ) ) : array(
				'policy'   => SettingsDefaults::safety_policy(),
				'warnings' => array( __( 'Stored safety policy was invalid and defaults were used.', 'yaxii-shipping-manager' ) ),
			);
		}

		$unknown_keys = $this->unknown_keys( $raw_policy, self::SAFETY_KEYS );
		if ( array() !== $unknown_keys ) {
			return $this->validation_error(
				sprintf(
					/* translators: %s: comma-separated safety policy keys. */
					__( 'Unknown safety policy keys: %s.', 'yaxii-shipping-manager' ),
					implode( ', ', $unknown_keys )
				)
			);
		}

		$warnings = array();
		foreach ( self::SAFETY_KEYS as $safety_key ) {
			if ( isset( $raw_policy[ $safety_key ] ) && true !== (bool) $raw_policy[ $safety_key ] ) {
				$warnings[] = sprintf(
					/* translators: %s: safety policy key. */
					__( '%s is locked on and was forced to true.', 'yaxii-shipping-manager' ),
					$safety_key
				);
			}
		}

		return array(
			'policy'   => SettingsDefaults::safety_policy(),
			'warnings' => $warnings,
		);
	}

	/**
	 * @param array<string,mixed> $settings Raw settings.
	 * @param array<int,string>  $allowed Allowed values.
	 *
	 * @return string|WP_Error
	 */
	private function string_choice( array $settings, string $field, array $allowed, string $default, bool $strict ) {
		if ( ! array_key_exists( $field, $settings ) ) {
			return $default;
		}

		$value = is_string( $settings[ $field ] ) ? sanitize_key( $settings[ $field ] ) : '';
		if ( in_array( $value, $allowed, true ) ) {
			return $value;
		}

		return $strict ? $this->validation_error(
			sprintf(
				/* translators: %s: settings field name. */
				__( 'Invalid value for %s.', 'yaxii-shipping-manager' ),
				$field
			)
		) : $default;
	}

	/**
	 * @param array<string,mixed> $settings Raw settings.
	 */
	private function text_value( array $settings, string $field, string $default ): string {
		if ( ! array_key_exists( $field, $settings ) || ! is_scalar( $settings[ $field ] ) ) {
			return $default;
		}

		return sanitize_text_field( (string) $settings[ $field ] );
	}

	/**
	 * @param mixed $price Raw price value.
	 *
	 * @return int|float|null|WP_Error
	 */
	private function price_value( $price ) {
		if ( null === $price || '' === $price ) {
			return null;
		}

		if ( ! is_int( $price ) && ! is_float( $price ) && ! ( is_string( $price ) && is_numeric( $price ) ) ) {
			return $this->validation_error( __( 'Default prices must be non-negative numbers or null.', 'yaxii-shipping-manager' ) );
		}

		$numeric_price = $price + 0;
		if ( $numeric_price < 0 ) {
			return $this->validation_error( __( 'Default prices cannot be negative.', 'yaxii-shipping-manager' ) );
		}

		return $numeric_price;
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
			'yaxii_shipping_manager_invalid_settings',
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
