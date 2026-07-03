# Yaxii Shipping Manager

Yaxii Shipping Manager is a free WordPress/WooCommerce plugin for configuring Algeria wilaya shipping zones from the WordPress admin.

## Features

- Generate Algeria WooCommerce shipping zones from a reviewed preview.
- Add and update Yaxii-managed flat rate shipping methods for home and office delivery.
- Manage prices, labels, and enabled status for Yaxii-managed methods.
- Keep manual WooCommerce zones and unknown external zones protected by default.
- Show read-only diagnostics for WooCommerce readiness, protected zones, and compatibility risks.
- Detect existing Yaxii COD Theme shipping zones so the generator can avoid duplicate covered wilayas.
- Remove only verified Yaxii-managed setup after explicit confirmation.

## Requirements

- WordPress 6.5 or newer.
- PHP 7.4 or newer.
- WooCommerce for shipping-zone diagnostics and setup actions.

## Installation

1. Upload the plugin files to `wp-content/plugins/yaxii-shipping-manager`.
2. Activate the plugin from the WordPress Plugins screen.
3. Open Yaxii Shipping Manager from the WordPress admin menu.
4. Review diagnostics before generating or updating WooCommerce shipping zones.

## Scope

This release manages shipping at the wilaya level. It does not provide commune-level pricing, provider shipping-table imports, telemetry, analytics, licensing, or remote asset loading.

## License

GPL-2.0-or-later. See the plugin header and `readme.txt` for release metadata.
