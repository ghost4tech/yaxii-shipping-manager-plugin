<?php
/**
 * WooCommerce Algeria states registration.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\WooCommerce;

use Yaxii\ShippingManager\Data\DatasetMode;
use Yaxii\ShippingManager\Data\DatasetReadException;
use Yaxii\ShippingManager\Data\DatasetRepository;
use Yaxii\ShippingManager\Settings\SettingsRepository;

defined( 'ABSPATH' ) || exit;

final class AlgeriaStatesRegistrar {
	private const COUNTRY_CODE = 'DZ';

	private bool $woocommerce_active;
	private DatasetRepository $datasets;
	private SettingsRepository $settings;

	/**
	 * @var array<string,string>|null
	 */
	private ?array $algeria_states = null;

	public function __construct(
		bool $woocommerce_active,
		DatasetRepository $datasets,
		SettingsRepository $settings
	) {
		$this->woocommerce_active = $woocommerce_active;
		$this->datasets           = $datasets;
		$this->settings           = $settings;
	}

	public function register(): void {
		if ( ! $this->woocommerce_active ) {
			return;
		}

		add_filter( 'woocommerce_states', array( $this, 'register_algeria_states' ) );
	}

	/**
	 * @param array<string,array<string,string>> $states WooCommerce states list.
	 *
	 * @return array<string,array<string,string>>
	 */
	public function register_algeria_states( array $states ): array {
		$algeria_states = $this->algeria_states();

		if ( array() === $algeria_states ) {
			return $states;
		}

		$states[ self::COUNTRY_CODE ] = $algeria_states;

		return $states;
	}

	/**
	 * @return array<string,mixed>
	 */
	public function status(): array {
		$dataset_mode     = $this->dataset_mode();
		$registered_count = count( $this->algeria_states() );

		return array(
			'woocommerceActive' => $this->woocommerce_active,
			'active'            => $this->woocommerce_active && $registered_count > 0,
			'datasetMode'       => $dataset_mode,
			'wilayaCount'       => $registered_count,
			'legacyAvailable'   => (bool) ( $this->datasets->dataset_status()['legacy58']['available'] ?? false ),
		);
	}

	/**
	 * @return array<string,string>
	 */
	private function algeria_states(): array {
		if ( null !== $this->algeria_states ) {
			return $this->algeria_states;
		}

		$this->algeria_states = $this->read_wilayas_as_states();

		return $this->algeria_states;
	}

	/**
	 * @return array<string,string>
	 */
	private function read_wilayas_as_states(): array {
		try {
			$wilayas = $this->datasets->wilayas( $this->dataset_mode() );
		} catch ( DatasetReadException $exception ) {
			return array();
		}

		$label_format = $this->region_label_format();
		$states       = array();

		foreach ( $wilayas as $wilaya ) {
			if ( ! isset( $wilaya['code'], $wilaya['name_fr'], $wilaya['name_ar'] ) ) {
				continue;
			}

			$states[ (string) $wilaya['code'] ] = $this->format_wilaya_label(
				(string) $wilaya['name_fr'],
				(string) $wilaya['name_ar'],
				$label_format
			);
		}

		return $states;
	}

	private function region_label_format(): string {
		$response = $this->settings->read();

		if ( array() !== $response['warnings'] ) {
			return 'fr';
		}

		$format   = $response['settings']['regionLabelFormat'] ?? 'fr';

		if ( in_array( $format, array( 'fr', 'ar', 'fr_ar', 'ar_fr' ), true ) ) {
			return (string) $format;
		}

		return 'fr';
	}

	private function dataset_mode(): string {
		$response = $this->settings->read();
		$mode     = (string) ( $response['settings']['datasetMode'] ?? DatasetMode::CURRENT );

		return DatasetMode::is_valid( $mode ) ? $mode : DatasetMode::CURRENT;
	}

	private function format_wilaya_label( string $name_fr, string $name_ar, string $format ): string {
		if ( 'ar' === $format ) {
			return $name_ar;
		}

		if ( 'fr_ar' === $format ) {
			return $name_fr . ' - ' . $name_ar;
		}

		if ( 'ar_fr' === $format ) {
			return $name_ar . ' - ' . $name_fr;
		}

		return $name_fr;
	}
}
