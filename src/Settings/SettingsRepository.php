<?php
/**
 * Settings repository.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Settings;

use WP_Error;

defined( 'ABSPATH' ) || exit;

final class SettingsRepository {
	public const OPTION_NAME = 'yaxii_shipping_manager_settings';

	private SettingsSanitizer $sanitizer;

	public function __construct( ?SettingsSanitizer $sanitizer = null ) {
		$this->sanitizer = $sanitizer ?? new SettingsSanitizer();
	}

	/**
	 * @return array{settings:array<string,mixed>,defaults:array<string,mixed>,options:array<string,mixed>,warnings:array<int,string>}
	 */
	public function read(): array {
		$missing_option  = new \stdClass();
		$stored_settings = get_option( self::OPTION_NAME, $missing_option );

		if ( $missing_option === $stored_settings ) {
			return $this->response_payload(
				array(
					'settings' => SettingsDefaults::settings(),
					'warnings' => array(),
				)
			);
		}

		$sanitized       = $this->sanitizer->sanitize_stored( $stored_settings );

		return $this->response_payload( $sanitized );
	}

	/**
	 * @param mixed $raw_settings Request body payload.
	 *
	 * @return array{settings:array<string,mixed>,defaults:array<string,mixed>,options:array<string,mixed>,warnings:array<int,string>}|WP_Error
	 */
	public function save( $raw_settings ) {
		$sanitized = $this->sanitizer->sanitize_for_save( $raw_settings );
		if ( is_wp_error( $sanitized ) ) {
			return $sanitized;
		}

		$this->persist_settings( $sanitized['settings'] );

		return $this->response_payload( $sanitized );
	}

	/**
	 * @return array<string,mixed>
	 */
	public function defaults(): array {
		return SettingsDefaults::settings();
	}

	/**
	 * @param array<string,mixed> $settings Sanitized settings.
	 */
	private function persist_settings( array $settings ): void {
		$existing_settings = get_option( self::OPTION_NAME, null );

		if ( null === $existing_settings ) {
			add_option( self::OPTION_NAME, $settings, '', false );
			return;
		}

		update_option( self::OPTION_NAME, $settings, false );
	}

	/**
	 * @param array{settings:array<string,mixed>,warnings:array<int,string>} $sanitized Sanitized settings.
	 *
	 * @return array{settings:array<string,mixed>,defaults:array<string,mixed>,options:array<string,mixed>,warnings:array<int,string>}
	 */
	private function response_payload( array $sanitized ): array {
		return array(
			'settings' => $sanitized['settings'],
			'defaults' => SettingsDefaults::settings(),
			'options'  => array_merge(
				array( 'optionName' => self::OPTION_NAME ),
				SettingsDefaults::options_metadata()
			),
			'warnings' => $sanitized['warnings'],
		);
	}
}
