# TASK-004A - Read-only WooCommerce Shipping Diagnostics

Date: 2026-06-27

## Goal

Add read-only WooCommerce diagnostics that inspect existing shipping zones and methods, compare them with the Yaxii current Algeria dataset/settings, and expose useful checkout safety information without writing WooCommerce configuration.

## Scope

- Added a read-only WooCommerce shipping zone reader.
- Added a diagnostics service that compares zones against the normalized current wilaya dataset.
- Added `GET /wp-json/yaxii-shipping-manager/v1/diagnostics`.
- Wired the admin Diagnostics screen to the REST endpoint.
- Added diagnostics documentation.
- Rebuilt admin assets because frontend source changed.

## Files Changed

- `src/Plugin.php`
- `src/Rest/Routes.php`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-BzWKzekI.js`
- `assets/admin/assets/main-DC0_2Kkp.css`
- Removed previous built asset hashes:
  - `assets/admin/assets/main-BcXx2o6c.js`
  - `assets/admin/assets/main-C2kPp4Pr.css`

## Files Created

- `src/WooCommerce/ShippingZoneReader.php`
- `src/WooCommerce/ShippingDiagnosticsService.php`
- `src/Rest/DiagnosticsController.php`
- `admin-app/src/api/diagnostics-api.ts`
- `admin-app/src/types/diagnostics.ts`
- `docs/DIAGNOSTICS.md`
- `.agents/progress/yaxii-shipping-manager/TASK-004A-readonly-woocommerce-diagnostics.md`

## What Was Before

The Diagnostics screen still used local draft checks and explicitly said the diagnostics backend was not connected yet. No REST diagnostics endpoint existed.

## What Changed

The plugin now reads WooCommerce shipping zones through WooCommerce APIs, compares direct `DZ:NN` state locations with the normalized current Algeria wilaya dataset, and returns read-only diagnostics to the admin app.

## WooCommerce APIs Used

- `WC_Shipping_Zones::get_zones( 'admin' )`
- `WC_Shipping_Zones::get_zone_by( 'zone_id', 0 )`
- `WC_Shipping_Zone::get_zone_locations()`
- `WC_Shipping_Zone::get_shipping_methods( false, 'admin' )`
- Shipping method read APIs:
  - `get_instance_id()`
  - `get_title()`
  - `get_method_title()`
  - `is_enabled()`
  - `get_instance_option( 'cost', '' )` for flat-rate cost strings only

No WooCommerce save, delete, create, update, or shipping-method add calls were added.

## Diagnostics Detected

- WooCommerce active/inactive state.
- Total current dataset wilayas.
- Directly configured wilayas based on `DZ:NN` zone locations.
- Missing wilayas.
- Duplicate/conflicting direct wilaya zones.
- Algeria-overlapping zones, including country-level `DZ` zones.
- Weak Yaxii-looking zone hints based on configured prefix/name.
- Zones with no enabled methods.
- Disabled method counts.
- Home-like and office-like method title hints.
- Rest-of-world fallback method visibility.
- Checkout fallback risk: `low`, `medium`, or `high`.
- Recommended next action.

## REST Endpoint Added

- `GET /wp-json/yaxii-shipping-manager/v1/diagnostics`

Security:

- Uses the same capability policy as existing protected endpoints.
- WooCommerce active: `manage_woocommerce`.
- WooCommerce inactive: `manage_options`.
- Has a real permission callback.
- Read-only endpoint only.
- Returns inactive status without fatal errors when WooCommerce is unavailable.

## Frontend Changes

- Added `admin-app/src/api/diagnostics-api.ts`.
- Added `admin-app/src/types/diagnostics.ts`.
- Diagnostics screen now loads `/diagnostics` after dataset and settings are ready.
- Displays loading, error, WooCommerce inactive, summary, wilaya coverage, zone hints, warnings, and recommended next action.
- Keeps the existing local draft method simulator read-only.
- Uses disabled copy: `Preview planner comes next.`

## What Still Remains Mocked

- The local draft method simulator remains UI-only.
- Shipping zone generation remains unimplemented.
- Preview planner remains unimplemented.
- Safe apply remains unimplemented.

## What Was Not Implemented

- No WooCommerce shipping zones were created, updated, or deleted.
- No shipping methods were added or edited.
- No method prices were changed.
- No checkout fields were modified.
- No preview planner was implemented.
- No safe apply engine was implemented.
- No CSV backend, YSF sync, provider imports, commune-level pricing, remote calls, licensing, or paid gates were added.

## Security Notes

- Diagnostics endpoint is not public.
- Permission checks reuse the existing capability policy.
- The endpoint accepts no state-changing input.
- Frontend requests use the configured REST nonce header.

## WooCommerce Safety Notes

- WooCommerce integration is guarded by the active-plugin check.
- WooCommerce classes are checked before use.
- The reader uses WooCommerce APIs only.
- No raw SQL is used.
- No writes are performed.
- Manual/unknown zones are not treated as bad by default.

## WordPress.org Compliance Notes

- No external assets or hidden remote calls were added.
- No obfuscated code was added.
- No provider sending APIs were added.
- Documentation describes implemented behavior and labels preview/apply as future work.

## QA Guard Findings

- `woo-guard`: Pass. WooCommerce usage is read-only; no zone/method write APIs were added.
- `wp-guard`: Pass. REST route has a permission callback and does not expose public data.
- `wp-rest-api`: Pass. Route is registered under the existing namespace and returns a controlled shape.
- `clean-code-guard`: Pass. Reader, service, controller, API client, and types are split by responsibility.
- `docs-guard`: Pass. `docs/DIAGNOSTICS.md` documents only current read-only behavior.

## Checks Run

- `composer dump-autoload`
- `php -l` on changed PHP files
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Source map scan under `assets/admin`
- Forbidden string scan over `src`, `admin-app/src`, and `assets/admin`
- Raw dataset bundling scan over built JS
- WooCommerce write scan over diagnostics-related source
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Composer autoload: passed.
- PHP lint: passed.
- Typecheck: passed.
- Lint: passed with 8 existing Fast Refresh warnings in pre-existing UI/shared component files.
- Build: passed.
- Source maps: none found under `assets/admin`.
- Forbidden runtime strings: no matches in `src`, `admin-app/src`, or `assets/admin`.
- Raw dataset bundling scan: no matches in built JS.
- WooCommerce write scan: no write calls found in diagnostics-related code.
- `git diff --check`: passed.
- Final git status: pending at report creation.

## Known Risks

- WooCommerce zone naming and method-title detection are weak hints and must not be treated as proof of ownership.
- A country-level `DZ` zone is reported as overlapping Algeria but does not count as direct wilaya configuration.
- Checkout safety cannot be proven until the preview planner and safe apply flow exist.
- Live WooCommerce runtime smoke testing was not performed in this task.

## Blockers

None.

## Next Recommended Task

TASK-004B: implement a read-only preview planner that proposes creates, updates, skips, and conflicts without applying WooCommerce changes.

## Commit Hash

Final commit hash is reported in the task closeout response. Embedding the final hash inside this committed report would change the hash during amend.
