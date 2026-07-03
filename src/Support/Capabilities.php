<?php
/**
 * Capability helpers.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Support;

defined( 'ABSPATH' ) || exit;

final class Capabilities {
	public static function required_capability( bool $woocommerce_active ): string {
		return $woocommerce_active ? 'manage_woocommerce' : 'manage_options';
	}
}
