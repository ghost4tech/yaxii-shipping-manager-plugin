<?php
/**
 * Normalized dataset repository.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Data;

defined( 'ABSPATH' ) || exit;

final class DatasetRepository {
	private string $base_path;

	public function __construct( ?string $base_path = null ) {
		$this->base_path = rtrim( $base_path ?? YAXII_SHIPPING_MANAGER_PATH . 'data/algeria', '/\\' );
	}

	/**
	 * @return array<string,mixed>
	 */
	public function dataset_status(): array {
		return array(
			'current'  => $this->current_status(),
			'legacy58' => $this->legacy_status(),
		);
	}

	/**
	 * @return array<string,mixed>
	 *
	 * @throws DatasetReadException When the dataset mode or files are invalid.
	 */
	public function metadata( string $mode ): array {
		return $this->read_json_file( $this->dataset_file( $mode, 'metadata.json' ) );
	}

	/**
	 * @return array<int,array<string,mixed>>
	 *
	 * @throws DatasetReadException When the dataset is unavailable or invalid.
	 */
	public function wilayas( string $mode ): array {
		$this->assert_current_mode_available( $mode );

		return $this->read_json_list( $this->dataset_file( $mode, 'wilayas.json' ), 'wilayas' );
	}

	/**
	 * @return array<int,array<string,mixed>>
	 *
	 * @throws DatasetReadException When the dataset is unavailable or invalid.
	 */
	public function communes( string $mode, string $wilaya_code = '' ): array {
		$this->assert_current_mode_available( $mode );

		$communes = $this->read_json_list( $this->dataset_file( $mode, 'communes.json' ), 'communes' );

		if ( '' === $wilaya_code ) {
			return $communes;
		}

		return array_values(
			array_filter(
				$communes,
				static fn( array $commune ): bool => isset( $commune['wilaya_code'] ) && $wilaya_code === $commune['wilaya_code']
			)
		);
	}

	/**
	 * @return array<string,mixed>
	 */
	private function current_status(): array {
		try {
			$metadata = $this->metadata( DatasetMode::CURRENT );

			return array(
				'available'    => true,
				'complete'     => (bool) ( $metadata['complete'] ?? false ),
				'verified'     => (bool) ( $metadata['verified'] ?? false ),
				'wilayaCount'  => (int) ( $metadata['wilaya_count'] ?? 0 ),
				'communeCount' => (int) ( $metadata['commune_count'] ?? 0 ),
				'version'      => (string) ( $metadata['version'] ?? '' ),
			);
		} catch ( DatasetReadException $exception ) {
			return array(
				'available'    => false,
				'complete'     => false,
				'verified'     => false,
				'wilayaCount'  => 0,
				'communeCount' => 0,
				'version'      => '',
				'reason'       => $exception->getMessage(),
			);
		}
	}

	/**
	 * @return array<string,mixed>
	 */
	private function legacy_status(): array {
		try {
			$metadata = $this->metadata( DatasetMode::LEGACY_58 );

			return array(
				'available' => (bool) ( $metadata['available'] ?? false ),
				'complete'  => (bool) ( $metadata['complete'] ?? false ),
				'verified'  => (bool) ( $metadata['verified'] ?? false ),
				'reason'    => (string) ( $metadata['reason'] ?? 'Legacy mapping deferred.' ),
			);
		} catch ( DatasetReadException $exception ) {
			return array(
				'available' => false,
				'complete'  => false,
				'verified'  => false,
				'reason'    => $exception->getMessage(),
			);
		}
	}

	private function assert_current_mode_available( string $mode ): void {
		if ( DatasetMode::CURRENT === $mode ) {
			return;
		}

		throw new DatasetReadException( 'Legacy 58-compatible data is not available yet.' );
	}

	private function dataset_file( string $mode, string $file_name ): string {
		if ( ! DatasetMode::is_valid( $mode ) ) {
			throw new DatasetReadException( 'Invalid dataset mode.' );
		}

		$mode_dir = DatasetMode::LEGACY_58 === $mode ? 'legacy-58' : 'current';

		return $this->base_path . '/' . $mode_dir . '/' . $file_name;
	}

	/**
	 * @return array<string,mixed>
	 *
	 * @throws DatasetReadException When the file cannot be read as a JSON object.
	 */
	private function read_json_file( string $file_path ): array {
		if ( ! file_exists( $file_path ) ) {
			throw new DatasetReadException( 'Dataset file is missing.' );
		}

		$decoded = json_decode( (string) file_get_contents( $file_path ), true );
		if ( ! is_array( $decoded ) || $this->is_list( $decoded ) ) {
			throw new DatasetReadException( 'Dataset file must contain a JSON object.' );
		}

		return $decoded;
	}

	/**
	 * @return array<int,array<string,mixed>>
	 *
	 * @throws DatasetReadException When the file cannot be read as a JSON list.
	 */
	private function read_json_list( string $file_path, string $label ): array {
		if ( ! file_exists( $file_path ) ) {
			throw new DatasetReadException( 'Dataset ' . $label . ' file is missing.' );
		}

		$decoded = json_decode( (string) file_get_contents( $file_path ), true );
		if ( ! is_array( $decoded ) || ! $this->is_list( $decoded ) ) {
			throw new DatasetReadException( 'Dataset ' . $label . ' file must contain a JSON array.' );
		}

		return $decoded;
	}

	/**
	 * @param array<mixed> $payload Decoded JSON payload.
	 */
	private function is_list( array $payload ): bool {
		if ( array() === $payload ) {
			return true;
		}

		return array_keys( $payload ) === range( 0, count( $payload ) - 1 );
	}
}
