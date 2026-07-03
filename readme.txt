=== Yaxii Shipping Manager ===
Contributors: yaxii
Tags: woocommerce, shipping, algeria, cod, shipping-zones
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Configure and manage Algeria shipping zones for WooCommerce with previews, diagnostics, and protected zones.

== Description ==

Yaxii Shipping Manager helps WooCommerce merchants configure Algeria wilaya shipping zones from a WordPress admin screen.

The plugin focuses on reviewed, local WooCommerce shipping setup:

* Generate Algeria WooCommerce shipping zones from a reviewed preview.
* Add and update Yaxii-managed flat rate shipping methods for home and office delivery.
* Manage prices, labels, and enabled status for Yaxii-managed methods.
* Keep manual WooCommerce zones, Yaxii COD Theme zones, external Yaxii-looking zones, and duplicate zones protected and read-only unless they are verified Yaxii-managed.
* Show read-only diagnostics for WooCommerce readiness, protected zones, and compatibility risks before changes are applied.
* Detect existing Yaxii COD Theme shipping zones so the generator can avoid duplicate covered wilayas.
* Remove only verified Yaxii-managed setup when explicitly confirmed.

The plugin does not send store data to remote services and does not load remote scripts, styles, or fonts.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/yaxii-shipping-manager` directory, or install the plugin through the WordPress Plugins screen.
2. Activate the plugin through the Plugins screen in WordPress.
3. Open Yaxii Shipping Manager from the WordPress admin menu.
4. Review diagnostics before generating or updating WooCommerce shipping zones.

WooCommerce must be active before the plugin can read or update WooCommerce shipping zones.

== Frequently Asked Questions ==

= Does this plugin edit my existing manual WooCommerce zones? =

No. Manual or unknown WooCommerce zones are protected by default. Yaxii Shipping Manager writes only to zones and methods it can verify as Yaxii-managed.

= Does this plugin convert Yaxii COD Theme zones or fix Yaxii COD Theme checkout? =

No. Existing Yaxii COD Theme zones can be detected and shown as protected/read-only. They are not converted, adopted, deleted, or used as proof that Yaxii COD Theme checkout is compatible.

= Does the plugin delete shipping zones? =

The setup removal tool removes only verified Yaxii-managed zones after an explicit confirmation. It does not delete manual WooCommerce zones.

= Does the plugin support commune-level pricing? =

No. The current release manages shipping at the wilaya level.

= Does the plugin import provider shipping tables? =

No. Provider imports are not active in this release.

= Does the plugin send telemetry or analytics? =

No. The plugin is local-first and does not send telemetry or analytics data.

== Screenshots ==

1. Shipping Editor with Yaxii-managed zones, live prices, method status controls, and protected-zone labels.
2. Generator setup flow for selecting Algeria coverage and previewing supported WooCommerce changes.
3. Diagnostics health cards showing WooCommerce readiness, protected zones, and compatibility risks.
4. Settings page with simplified preferences, always-on safety rules, and advanced managed setup tools.
5. Remove Yaxii setup confirmation showing only verified Yaxii-managed removal candidates and protected manual zones.

== Changelog ==

= 0.1.0 =
* Initial WordPress.org preparation release.
* Adds Algeria WooCommerce shipping setup, diagnostics, preview, safe apply, managed method editing, read-only protected-zone detection, and verified managed setup removal.

== Upgrade Notice ==

= 0.1.0 =
Initial release.
