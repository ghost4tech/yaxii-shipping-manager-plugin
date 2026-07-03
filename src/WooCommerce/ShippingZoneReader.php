<?php
/**
 * Read-only WooCommerce shipping zone reader.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\WooCommerce;

defined( 'ABSPATH' ) || exit;

final class ShippingZoneReader {
	private bool $woocommerce_active;

	public function __construct( bool $woocommerce_active ) {
		$this->woocommerce_active = $woocommerce_active;
	}

	/**
	 * @return array<int,array<string,mixed>>
	 */
	public function zones(): array {
		if ( ! $this->can_read_zones() ) {
			return array();
		}

		return array_values(
			array_map(
				array( $this, 'normalize_zone_record' ),
				\WC_Shipping_Zones::get_zones( 'admin' )
			)
		);
	}

	/**
	 * @return array<string,mixed>|null
	 */
	public function rest_of_world_zone(): ?array {
		if ( ! $this->can_read_zones() ) {
			return null;
		}

		$zone = \WC_Shipping_Zones::get_zone_by( 'zone_id', 0 );

		if ( ! $zone instanceof \WC_Shipping_Zone ) {
			return null;
		}

		return $this->normalize_zone_object( $zone );
	}

	private function can_read_zones(): bool {
		return $this->woocommerce_active && class_exists( 'WC_Shipping_Zones' );
	}

	/**
	 * @param array<string,mixed> $zone_record WooCommerce zone record.
	 *
	 * @return array<string,mixed>
	 */
	private function normalize_zone_record( array $zone_record ): array {
		return array(
			'zoneId'       => (int) ( $zone_record['zone_id'] ?? 0 ),
			'name'         => (string) ( $zone_record['zone_name'] ?? '' ),
			'locations'    => $this->normalize_locations( $zone_record['zone_locations'] ?? array() ),
			'methods'      => $this->normalize_methods( $zone_record['shipping_methods'] ?? array() ),
			'restOfWorld'  => false,
		);
	}

	/**
	 * @return array<string,mixed>
	 */
	private function normalize_zone_object( \WC_Shipping_Zone $zone ): array {
		return array(
			'zoneId'       => (int) $zone->get_id(),
			'name'         => (string) $zone->get_zone_name(),
			'locations'    => $this->normalize_locations( $zone->get_zone_locations() ),
			'methods'      => $this->normalize_methods( $zone->get_shipping_methods( false, 'admin' ) ),
			'restOfWorld'  => true,
		);
	}

	/**
	 * @param mixed $locations WooCommerce zone locations.
	 *
	 * @return array<int,array<string,string>>
	 */
	private function normalize_locations( $locations ): array {
		if ( ! is_array( $locations ) ) {
			return array();
		}

		return array_values(
			array_map(
				static function ( $location ): array {
					return array(
						'type' => is_object( $location ) ? (string) ( $location->type ?? '' ) : '',
						'code' => is_object( $location ) ? (string) ( $location->code ?? '' ) : '',
					);
				},
				$locations
			)
		);
	}

	/**
	 * @param mixed $methods WooCommerce shipping methods.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function normalize_methods( $methods ): array {
		if ( ! is_array( $methods ) ) {
			return array();
		}

		return array_values(
			array_map(
				array( $this, 'normalize_method' ),
				$methods
			)
		);
	}

	/**
	 * @param mixed $method WooCommerce shipping method.
	 *
	 * @return array<string,mixed>
	 */
	private function normalize_method( $method ): array {
		$method_id = is_object( $method ) ? (string) ( $method->id ?? '' ) : '';

		return array(
			'instanceId'  => is_object( $method ) && method_exists( $method, 'get_instance_id' ) ? (int) $method->get_instance_id() : 0,
			'methodId'    => $method_id,
			'title'       => is_object( $method ) && method_exists( $method, 'get_title' ) ? (string) $method->get_title() : '',
			'methodTitle' => is_object( $method ) && method_exists( $method, 'get_method_title' ) ? (string) $method->get_method_title() : '',
			'enabled'     => is_object( $method ) && method_exists( $method, 'is_enabled' ) ? (bool) $method->is_enabled() : false,
			'cost'        => $this->method_cost( $method_id, $method ),
		);
	}

	/**
	 * @param mixed $method WooCommerce shipping method.
	 */
	private function method_cost( string $method_id, $method ): ?string {
		if ( 'flat_rate' !== $method_id || ! is_object( $method ) || ! method_exists( $method, 'get_instance_option' ) ) {
			return null;
		}

		$cost = $method->get_instance_option( 'cost', '' );

		return is_scalar( $cost ) ? (string) $cost : null;
	}
}
