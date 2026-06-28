<?php
/**
 * Registry for Yaxii-managed WooCommerce zones.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Apply;

defined( 'ABSPATH' ) || exit;

final class ManagedZoneRegistry {
	public const OPTION_NAME = 'yaxii_shipping_manager_managed_zones';
	public const SCHEMA_VERSION = 1;

	/**
	 * @var array<int,array<string,mixed>>|null
	 */
	private ?array $records = null;

	/**
	 * @return array<int,array<string,mixed>>
	 */
	public function records(): array {
		if ( null !== $this->records ) {
			return $this->records;
		}

		$stored = get_option( self::OPTION_NAME, array() );
		if ( ! is_array( $stored ) ) {
			$this->records = array();
			return $this->records;
		}

		$raw_records = $this->raw_records( $stored );
		$records     = array();

		foreach ( $raw_records as $record ) {
			$sanitized = is_array( $record ) ? $this->sanitize_record( $record ) : null;
			if ( null !== $sanitized ) {
				$records[] = $sanitized;
			}
		}

		$this->records = $records;

		return $this->records;
	}

	public function managed_zone_count(): int {
		return count( $this->records() );
	}

	/**
	 * @param array<string,mixed> $record Registry record.
	 */
	public function record_created_zone( array $record ): bool {
		$sanitized = $this->sanitize_record( $record );
		if ( null === $sanitized ) {
			return false;
		}

		$records = $this->records_without_created_zone( $sanitized );
		$records[] = $sanitized;
		$payload = array(
			'schemaVersion' => self::SCHEMA_VERSION,
			'records'       => $records,
		);

		$saved = update_option( self::OPTION_NAME, $payload, false );
		if ( $saved || $payload === get_option( self::OPTION_NAME, array() ) ) {
			$this->records = $records;
			return true;
		}

		return false;
	}

	/**
	 * @return array<string,mixed>|null
	 */
	public function record_for_zone_id( int $zone_id ): ?array {
		if ( $zone_id <= 0 ) {
			return null;
		}

		foreach ( $this->records() as $record ) {
			if ( $zone_id === (int) $record['zoneId'] ) {
				return $record;
			}
		}

		return null;
	}

	/**
	 * @param array<string,mixed> $created_record Created zone record.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function records_without_created_zone( array $created_record ): array {
		return array_values(
			array_filter(
				$this->records(),
				static function ( array $stored_record ) use ( $created_record ): bool {
					return (int) $stored_record['zoneId'] !== (int) $created_record['zoneId']
						&& (string) $stored_record['wilayaCode'] !== (string) $created_record['wilayaCode'];
				}
			)
		);
	}

	/**
	 * @param array<string,mixed> $stored Stored option payload.
	 *
	 * @return array<int,mixed>
	 */
	private function raw_records( array $stored ): array {
		if ( isset( $stored['records'] ) && is_array( $stored['records'] ) ) {
			return array_values( $stored['records'] );
		}

		return array_values( $stored );
	}

	/**
	 * @param array<string,mixed> $record Stored registry record.
	 *
	 * @return array<string,mixed>|null
	 */
	private function sanitize_record( array $record ): ?array {
		$wilaya_code = (string) ( $record['wilayaCode'] ?? '' );
		$zone_id     = (int) ( $record['zoneId'] ?? 0 );

		if ( 1 !== preg_match( '/^\d{2}$/', $wilaya_code ) || $zone_id <= 0 ) {
			return null;
		}

		return array(
			'wilayaCode'      => $wilaya_code,
			'zoneId'          => $zone_id,
			'zoneName'        => $this->sanitize_string( $record['zoneName'] ?? '' ),
			'methodInstances' => $this->sanitize_method_instances( $record['methodInstances'] ?? array() ),
			'createdBy'       => $this->sanitize_string( $record['createdBy'] ?? 'yaxii_shipping_manager' ),
			'createdAt'       => $this->sanitize_string( $record['createdAt'] ?? '' ),
			'updatedAt'       => $this->sanitize_string( $record['updatedAt'] ?? '' ),
			'source'          => $this->sanitize_string( $record['source'] ?? 'managed_registry' ),
			'schemaVersion'   => (int) ( $record['schemaVersion'] ?? self::SCHEMA_VERSION ),
		);
	}

	/**
	 * @param mixed $method_instances Stored method instances.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private function sanitize_method_instances( $method_instances ): array {
		if ( ! is_array( $method_instances ) ) {
			return array();
		}

		$instances = array();

		foreach ( $method_instances as $method_instance ) {
			if ( ! is_array( $method_instance ) ) {
				continue;
			}

			$instance_id = (int) ( $method_instance['instanceId'] ?? 0 );
			if ( $instance_id <= 0 ) {
				continue;
			}

			$instances[] = array(
				'methodKey'     => $this->sanitize_string( $method_instance['methodKey'] ?? '' ),
				'instanceId'    => $instance_id,
				'methodId'      => $this->sanitize_string( $method_instance['methodId'] ?? '' ),
				'title'         => $this->sanitize_string( $method_instance['title'] ?? '' ),
				'lastKnownCost' => isset( $method_instance['lastKnownCost'] ) ? $this->sanitize_string( $method_instance['lastKnownCost'] ) : null,
			);
		}

		return $instances;
	}

	private function sanitize_string( $value ): string {
		return trim( sanitize_text_field( (string) $value ) );
	}
}
