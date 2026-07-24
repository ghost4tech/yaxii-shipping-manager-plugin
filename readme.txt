=== Yaxii Shipping Manager ===
Contributors: yaxii, ghost4tech
Tags: woocommerce, shipping, algeria, wilaya, shipping-zones
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Set up and manage Algeria WooCommerce shipping zones by wilaya, with safe previews, diagnostics, and protection for your existing manual zones.

== Description ==

Yaxii Shipping Manager is a WooCommerce shipping setup tool built specifically for Algerian merchants. It replaces the slow, error-prone process of building wilaya-by-wilaya shipping zones by hand in WooCommerce with a guided admin screen that generates, previews, and manages them for you.

Every change is reviewed before it is applied. Nothing is written to your store's WooCommerce configuration until you confirm a generated preview, and zones the plugin did not create are left alone by default.

**Built for Algerian WooCommerce stores**

* Generate WooCommerce shipping zones for Algeria's wilayas from a reviewed, editable preview — nothing is applied automatically.
* Add and update Yaxii-managed flat rate shipping methods for home delivery and office/stopdesk delivery.
* Manage prices, labels, and enabled status for Yaxii-managed methods from one screen.
* Detect existing Yaxii COD Theme shipping zones so the generator can avoid creating duplicate coverage for the same wilaya.

**Protects what you already have**

* Manual WooCommerce zones, Yaxii COD Theme zones, external Yaxii-looking zones, and duplicate zones are kept protected and read-only unless they are verified as Yaxii-managed.
* Read-only diagnostics show WooCommerce readiness, protected zones, and compatibility risks before any change is applied.
* The setup removal tool removes only verified Yaxii-managed zones and methods, and only after an explicit confirmation step.

**Local-first, no tracking**

The plugin does not send store data to remote services, does not phone home, and does not load remote scripts, styles, or fonts. Everything runs on your own WordPress site.

= Current scope =

This release manages shipping at the wilaya level. Commune-level pricing and third-party provider (Yalidine, ZR Express, Maystro, etc.) table imports are not part of this release.

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

= 1.0.0 =
* Initial WordPress.org preparation release.
* Adds Algeria WooCommerce shipping setup, diagnostics, preview, safe apply, managed method editing, read-only protected-zone detection, and verified managed setup removal.

== Upgrade Notice ==

= 1.0.0 =
Initial release.
