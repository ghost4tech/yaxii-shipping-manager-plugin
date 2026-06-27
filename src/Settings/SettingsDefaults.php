<?php
/**
 * Settings defaults.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Settings;

defined( 'ABSPATH' ) || exit;

final class SettingsDefaults {
	/**
	 * @return array<string,mixed>
	 */
	public static function settings(): array {
		return array(
			'datasetMode'       => 'current',
			'regionLabelFormat' => 'fr_ar',
			'zoneNameFormat'    => 'prefix_code_name',
			'zonePrefix'        => 'Yaxii',
			'officeWordingMode' => 'office_delivery',
			'officeCustomLabel' => '',
			'methods'           => self::methods(),
			'safetyPolicy'      => self::safety_policy(),
		);
	}

	/**
	 * @return array<int,array<string,mixed>>
	 */
	public static function methods(): array {
		return array(
			array(
				'key'          => 'home_delivery',
				'enabled'      => true,
				'label'        => 'Home delivery',
				'defaultPrice' => 700,
				'type'         => 'flat_rate',
				'locked'       => true,
			),
			array(
				'key'          => 'office_delivery',
				'enabled'      => true,
				'label'        => 'Office delivery',
				'defaultPrice' => 400,
				'type'         => 'flat_rate',
				'locked'       => true,
			),
			array(
				'key'          => 'custom_1',
				'enabled'      => false,
				'label'        => 'Custom method 1',
				'defaultPrice' => null,
				'type'         => 'flat_rate',
				'locked'       => false,
			),
			array(
				'key'          => 'custom_2',
				'enabled'      => false,
				'label'        => 'Custom method 2',
				'defaultPrice' => null,
				'type'         => 'flat_rate',
				'locked'       => false,
			),
		);
	}

	/**
	 * @return array<string,bool>
	 */
	public static function safety_policy(): array {
		return array(
			'protectManualZones'        => true,
			'requirePreviewBeforeApply' => true,
			'skipConflictsByDefault'    => true,
			'neverDeleteManualZones'    => true,
		);
	}

	/**
	 * @return array<string,mixed>
	 */
	public static function options_metadata(): array {
		return array(
			'datasetModes'       => array( 'current', 'legacy_58' ),
			'availableModes'     => array( 'current' ),
			'regionLabelFormats' => array( 'fr', 'ar', 'fr_ar', 'ar_fr' ),
			'zoneNameFormats'    => array( 'prefix_code_name', 'code_name', 'name_only', 'prefix_name' ),
			'officeWordingModes' => array( 'office_delivery', 'stopdesk', 'bureau', 'custom' ),
			'methodKeys'         => array( 'home_delivery', 'office_delivery', 'custom_1', 'custom_2' ),
			'methodType'         => 'flat_rate',
			'currency'           => array(
				'editable' => false,
				'fallback' => 'DZD',
			),
		);
	}
}
