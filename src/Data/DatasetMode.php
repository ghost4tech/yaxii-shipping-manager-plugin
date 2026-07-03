<?php
/**
 * Dataset mode constants.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Data;

defined( 'ABSPATH' ) || exit;

final class DatasetMode {
	public const CURRENT   = 'current';
	public const LEGACY_58 = 'legacy_58';

	/**
	 * @return array<int,string>
	 */
	public static function all(): array {
		return array( self::CURRENT, self::LEGACY_58 );
	}

	public static function is_valid( string $mode ): bool {
		return in_array( $mode, self::all(), true );
	}
}
