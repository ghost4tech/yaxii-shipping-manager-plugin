<?php
/**
 * Admin asset loading.
 *
 * @package YaxiiShippingManager
 */

namespace Yaxii\ShippingManager\Admin;

use Yaxii\ShippingManager\Rest\BootstrapController;

defined( 'ABSPATH' ) || exit;

final class AssetRegistrar {
	private const SCRIPT_HANDLE = 'yaxii-shipping-manager-admin';
	private const STYLE_HANDLE  = 'yaxii-shipping-manager-admin';
	private const ENTRY_FILE    = 'src/wp-admin-main.tsx';

	private BootstrapController $bootstrap;

	public function __construct( BootstrapController $bootstrap ) {
		$this->bootstrap = $bootstrap;
	}

	/**
	 * Register asset hooks.
	 */
	public function register(): void {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_filter( 'script_loader_tag', array( $this, 'add_module_type' ), 10, 3 );
	}

	/**
	 * Enqueue assets only on the plugin admin page.
	 */
	public function enqueue_admin_assets( string $hook_suffix ): void {
		if ( ! $this->is_plugin_page_hook( $hook_suffix ) ) {
			return;
		}

		$entry = $this->manifest_entry();

		if ( null === $entry ) {
			return;
		}

		if ( ! empty( $entry['css'] ) && is_array( $entry['css'] ) ) {
			foreach ( $entry['css'] as $stylesheet_index => $stylesheet_file ) {
				if ( ! is_string( $stylesheet_file ) ) {
					continue;
				}

				wp_enqueue_style(
					self::STYLE_HANDLE . '-' . (int) $stylesheet_index,
					$this->asset_url( $stylesheet_file ),
					array(),
					YAXII_SHIPPING_MANAGER_VERSION
				);
			}
		}

		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			$this->asset_url( $entry['file'] ),
			array(),
			YAXII_SHIPPING_MANAGER_VERSION,
			true
		);

		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			'window.yaxiiShippingManagerAdmin = ' . wp_json_encode( $this->bootstrap->bootstrap_data() ) . ';',
			'before'
		);
	}

	/**
	 * Add type="module" to the Vite entry script.
	 */
	public function add_module_type( string $tag, string $handle, string $src ): string {
		if ( self::SCRIPT_HANDLE !== $handle || '' === $src ) {
			return $tag;
		}

		return '<script type="module" src="' . esc_url( $src ) . '" id="' . esc_attr( $handle ) . '-js"></script>' . "\n";
	}

	private function is_plugin_page_hook( string $hook_suffix ): bool {
		return false !== strpos( $hook_suffix, '_page_' . AdminPage::MENU_SLUG );
	}

	/**
	 * @return array{file:string, css?:array<int,string>}|null
	 */
	private function manifest_entry(): ?array {
		$manifest_path = YAXII_SHIPPING_MANAGER_PATH . 'assets/admin/.vite/manifest.json';

		if ( ! file_exists( $manifest_path ) ) {
			return null;
		}

		$manifest_contents = file_get_contents( $manifest_path );

		if ( false === $manifest_contents ) {
			return null;
		}

		$manifest = json_decode( $manifest_contents, true );

		if ( ! is_array( $manifest ) || empty( $manifest[ self::ENTRY_FILE ] ) || ! is_array( $manifest[ self::ENTRY_FILE ] ) ) {
			return null;
		}

		$entry = $manifest[ self::ENTRY_FILE ];

		if ( empty( $entry['file'] ) || ! is_string( $entry['file'] ) ) {
			return null;
		}

		return $entry;
	}

	private function asset_url( string $asset_file ): string {
		return YAXII_SHIPPING_MANAGER_URL . 'assets/admin/' . ltrim( $asset_file, '/' );
	}
}
