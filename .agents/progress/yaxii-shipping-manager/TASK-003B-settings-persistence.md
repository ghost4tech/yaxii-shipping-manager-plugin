# TASK-003B - Settings Persistence

Date: 2026-06-27

## Goal

Persist the MVP settings and generator draft contract safely in WordPress options, expose read/write REST settings endpoints, and wire the admin app settings/wizard draft to load and save those settings.

## Scope

- Added backend settings defaults, sanitizer, repository, and REST controller.
- Added read/write REST endpoint for plugin settings.
- Wired the admin app to fetch settings, save settings, reset settings to defaults, and initialize generator draft state from persisted settings.
- Updated settings documentation.
- Rebuilt admin assets after frontend source changes.

No WooCommerce shipping zones are read, created, updated, or deleted.

## Files Changed

- `admin-app/src/data/default-settings.ts`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/types/generator.ts`
- `admin-app/src/types/settings.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-B90TssnQ.js`
- `assets/admin/assets/main-vpSZjxiq.js`
- `docs/SETTINGS-CONTRACT.md`
- `src/Plugin.php`
- `src/Rest/Routes.php`

## Files Created

- `admin-app/src/api/settings-api.ts`
- `src/Rest/SettingsController.php`
- `src/Settings/SettingsDefaults.php`
- `src/Settings/SettingsRepository.php`
- `src/Settings/SettingsSanitizer.php`
- `.agents/progress/yaxii-shipping-manager/TASK-003B-settings-persistence.md`

## What Was Before

- TASK-003A defined the settings and wizard contract in TypeScript/UI only.
- Settings were local draft state.
- The wizard did not initialize from persisted WordPress settings.
- No `/settings` REST endpoint existed.
- No WordPress option existed for the MVP settings contract.

## What Changed

- Added persisted settings defaults and sanitizer under `src/Settings/`.
- Added `yaxii_shipping_manager_settings` option storage with autoload disabled.
- Added `GET /wp-json/yaxii-shipping-manager/v1/settings`.
- Added `PUT /wp-json/yaxii-shipping-manager/v1/settings`.
- Registered the settings controller through the plugin route wiring.
- Added admin app settings API client.
- Settings screen now loads persisted settings, shows loading/error states, saves via REST, and resets plugin settings to defaults.
- Generator wizard now initializes from persisted settings.
- Safety rules remain locked on.
- Admin build assets were regenerated.

## Option Name

```text
yaxii_shipping_manager_settings
```

## Settings Schema

Persisted fields:

- `datasetMode`: `current`
- `regionLabelFormat`: `fr`, `ar`, `fr_ar`, `ar_fr`
- `zoneNameFormat`: `prefix_code_name`, `code_name`, `name_only`, `prefix_name`
- `zonePrefix`: string
- `officeWordingMode`: `office_delivery`, `stopdesk`, `bureau`, `custom`
- `officeCustomLabel`: string
- `methods`: fixed method templates for `home_delivery`, `office_delivery`, `custom_1`, `custom_2`
- `safetyPolicy`: locked safety rules

Currency is not persisted. The UI continues to display WooCommerce currency as future behavior with fallback `DZD`.

## Sanitization And Validation Behavior

- Unknown top-level settings keys are rejected on save.
- Invalid enum values are rejected.
- `datasetMode: legacy_58` is rejected on save because legacy mapping is unavailable.
- If an older stored value contains `legacy_58`, it is normalized back to `current` with a warning.
- Unknown method fields are rejected.
- Duplicate or unsupported method keys are rejected.
- Method type is forced to `flat_rate`; unsupported submitted types are rejected.
- Home and office methods remain locked and enabled.
- Default prices must be non-negative numbers or `null`.
- Safety policy keys are always forced to `true`.
- REST-facing validation messages are translation-ready.

## REST Endpoints Added

- `GET /wp-json/yaxii-shipping-manager/v1/settings`
- `PUT /wp-json/yaxii-shipping-manager/v1/settings`

Access rules:

- WooCommerce active: `manage_woocommerce`
- WooCommerce inactive: `manage_options`
- `PUT` also requires `X-WP-Nonce` for the WordPress REST nonce

Response shape:

- `settings`
- `defaults`
- `options`
- `warnings`

## Frontend Wiring

- `admin-app/src/api/settings-api.ts` fetches and saves settings with the REST nonce.
- Admin runtime loads dataset and settings after bootstrap succeeds.
- Settings screen uses persisted settings and shows loading/error/save states.
- Save Settings performs `PUT /settings`.
- Reset to Defaults saves the plugin defaults only.
- Generator wizard initializes from persisted settings.
- Wilaya rows and method defaults are rebuilt from real dataset rows plus persisted method templates.

## Safety Rules Behavior

The following settings are locked on by backend sanitizer and UI:

- `protectManualZones`
- `requirePreviewBeforeApply`
- `skipConflictsByDefault`
- `neverDeleteManualZones`

They are persisted as `true` and cannot be disabled in the MVP.

## What Remains Draft Or Local

- Wizard state after launch.
- Wilaya enabled/disabled selections.
- Per-wilaya local draft prices.
- Bulk row edits.
- CSV import/export interactions.
- Preview/apply workflow state.

## What Was Not Implemented

- WooCommerce zone reads.
- WooCommerce zone writes.
- WooCommerce diagnostics backend.
- Preview planner.
- Safe apply engine.
- CSV backend.
- YSF sync.
- Provider imports.
- Checkout field modifications.
- Commune-level pricing.
- Unlimited custom shipping methods.
- Country expansion UI.
- Telemetry, licensing, Pro locks, or remote calls.

## Security Notes

- REST endpoints use real permission callbacks.
- `PUT /settings` requires both capability and REST nonce.
- Request body is sanitized and validated server-side.
- The option stores no secrets, raw source data, dataset rows, WooCommerce IDs, or remote tokens.
- Unknown submitted settings keys are rejected instead of silently accepted.

## WooCommerce Safety Notes

- No WooCommerce shipping-zone APIs were introduced.
- No `WC_Shipping_Zone` usage was introduced.
- No `add_shipping_method` usage was introduced.
- No delete/update WooCommerce-zone behavior was introduced.
- The only settings write is `update_option()`/`add_option()` for `yaxii_shipping_manager_settings`.

## WordPress.org Compliance Notes

- Settings persistence is local-first.
- No telemetry, analytics, licensing, remote calls, or CDN assets were added.
- User-facing PHP REST messages were made translation-ready.
- Documentation avoids claims about diagnostics, preview, apply, CSV backend, or official dataset verification beyond current implementation.

## QA Guard Findings

- `clean-code-guard`: Settings code is split into defaults, sanitizer, repository, and controller. No fake success path or hidden remote dependency found.
- `wp-plugin-development`: Uses one small option with autoload disabled; no large dataset rows in options.
- `wp-guard`: REST endpoints use permission callbacks, capability checks, nonce check on write, and server-side sanitization.
- `wp-rest-api`: Route registration uses the existing namespace and separates readable/editable settings callbacks.
- `wp-plugin-directory-guidelines`: No licensing, tracking, CDN, obfuscation, or remote-service dependency added.
- `woo-guard`: No WooCommerce writes or shipping zone APIs introduced.
- `docs-guard`: `docs/SETTINGS-CONTRACT.md` updated to match actual persisted behavior and current non-implemented boundaries.
- `test-guard`: Not used; no tests or scripts were added.

Fixes made during guard pass:

- REST-facing validation/warning messages in `SettingsSanitizer` were updated to use translation functions.
- Broad bundled-asset `delete` scan was narrowed to source-level WooCommerce/write APIs because bundled React contains internal JavaScript `delete` operations unrelated to WooCommerce writes.

## Checks Run

- `composer dump-autoload`
- `php -l src\Plugin.php`
- `php -l src\Rest\Routes.php`
- `php -l src\Rest\SettingsController.php`
- `php -l src\Settings\SettingsDefaults.php`
- `php -l src\Settings\SettingsRepository.php`
- `php -l src\Settings\SettingsSanitizer.php`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- forbidden string scan over `src`, `admin-app/src`, and `assets/admin`
- raw dataset bundling scan over `assets/admin/*.js`
- WooCommerce write scan over `src` and `admin-app/src`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Composer autoload: passed.
- PHP lint: passed for all changed PHP files.
- TypeScript typecheck: passed.
- Admin lint: passed with 8 pre-existing Fast Refresh warnings and 0 errors.
- Admin build: passed; generated `assets/admin/assets/main-vpSZjxiq.js`.
- Source maps: none found under `assets/admin`.
- Forbidden string scan: passed for source/build scope.
- Raw dataset bundling scan: passed; raw S450R1 identifiers are not present in built JS.
- WooCommerce write scan: only `update_option()` in `SettingsRepository.php` for plugin settings.
- `git diff --check`: passed.
- `git status --short --untracked-files=all`: task-scoped changes only before commit.

## Known Risks

- There is no automated REST integration test yet for settings payload validation.
- Settings save is strict and rejects unavailable `legacy_58`; this is intentional until a legacy mapping exists.
- Changing persisted method templates reinitializes the current local wilaya draft rows in the admin app.
- Lint still reports existing Fast Refresh warnings in shared UI component files.

## Blockers

None.

## Next Recommended Task

TASK-003C: add focused settings REST integration tests or TASK-004A: read-only WooCommerce diagnostics, depending on whether the next priority is validation coverage or product flow.

## Commit Hash

Final commit hash reported in task closeout.
