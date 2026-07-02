# TASK-014B: Release UX Notice, Switch, and Server Deploy

Date: 2026-07-02

## Goal

Fix the low-risk release UX blockers from TASK-014A:

- suppress first-run global `Settings normalized` warnings;
- keep true settings repair warnings scoped and dismissible;
- fix switch thumb overflow;
- rebuild and deploy changed runtime files to the demo server after local checks.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Starting branch: `task/014a-release-compatibility-audit-yaxii-cod`
- Working branch: `task/014b-release-ux-notice-switch-deploy`
- TASK-014A commit `a86d0ea` exists locally.
- Pre-existing unrelated dirty files were present before this task and were not staged intentionally.
- Nested `app/.git`: not present.

## Audit docs read

- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014A-release-compatibility-audit-yaxii-cod.md`
- `docs/SETTINGS-CONTRACT.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/RELEASE-PACKAGING.md`

## Scope

Included:

- settings option first-run warning classification;
- settings warning rendering location and session dismissal;
- shared switch component geometry;
- rebuilt admin runtime assets;
- runtime smoke documentation;
- remote runtime deployment to the detected demo plugin path.

Excluded:

- Yaxii COD Theme edits;
- Yaxii COD Theme zone detection;
- `DZ:DZ-01` normalization;
- duplicate 69/58 diagnostics;
- checkout compatibility warnings;
- generator blocking or prevention;
- conversion/adoption tools;
- WooCommerce zone deletion or settings changes;
- `yaxii_zone_map` read/write behavior.

## Files changed

- `src/Settings/SettingsRepository.php`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/components/ui/switch.tsx`
- `assets/admin/manifest.json`
- `assets/admin/assets/main-Bek0twC3.css`
- `assets/admin/assets/main-CEtUW-6T.js`
- `docs/RUNTIME-SMOKE.md`
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014B-release-ux-notice-switch-deploy.md`

Generated build assets removed locally by the Vite build:

- `assets/admin/assets/main-BfE6TFFu.css`
- `assets/admin/assets/main-DSUfFPfk.js`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-014B-release-ux-notice-switch-deploy.md`
- `assets/admin/assets/main-Bek0twC3.css`
- `assets/admin/assets/main-CEtUW-6T.js`

Temporary local smoke scripts were created under `.agents/tmp/` and deleted before final diff.

## What was before

- A missing `yaxii_shipping_manager_settings` option was passed to `SettingsSanitizer::sanitize_stored()` as `null`.
- The sanitizer treated the missing option like malformed stored data and returned `Stored settings were invalid and defaults were used.`
- The React app rendered any settings warning globally as `Settings normalized`.
- The shared switch used `h-6 w-11 p-0.5`, a `h-5 w-5` thumb, and `translate-x-5`, leaving no tolerance for rounding or wp-admin/RTL context.

## First-run notice root cause

The settings repository did not distinguish an expected missing option from a malformed stored option. On first install, `get_option()` returned the fallback value and the sanitizer classified it as invalid stored settings.

## What changed

- `SettingsRepository::read()` now uses an object sentinel to detect a truly missing option.
- Missing settings return defaults with an empty `warnings` array.
- Malformed stored values still go through `SettingsSanitizer::sanitize_stored()` and can produce repair warnings.
- `RuntimeNotices` no longer renders settings repair warnings globally.
- `SettingsForm` renders true settings repair warnings inside Settings as `Settings were repaired`.
- The Settings repair warning is dismissible for the current admin session using `sessionStorage`.
- The shared switch root sets `dir="ltr"`.
- The checked thumb translation changed from `translate-x-5` to `translate-x-[1.125rem]`.

## Notice fix result

- First-run missing option: no warning.
- Current valid local settings: no warning.
- Malformed stored option: repair warning still returned.
- Global `Settings normalized` notice removed from the current source and rebuilt runtime bundle.

## Settings repair warning behavior

True repair warnings are scoped to Settings, non-blocking, and dismissible for the current browser session. The message uses:

- `Settings were repaired`
- `Some saved settings were invalid and safe defaults were used.`

## Switch overflow fix result

Local browser smoke measured the first Shipping Editor switch:

- checked: root `1088-1132`, thumb `1109-1129`, inside `true`;
- unchecked after keyboard activation: root `1054-1098`, thumb `1057-1077`, inside `true`.

The switch was toggled back to checked before ending the browser smoke.

## Security notes

- No telemetry, tracking, remote Yaxii calls, external CDN assets, or obfuscation were added.
- The new session dismissal stores only a local warning key in browser `sessionStorage`.
- No new request handlers or permissions were added.
- No raw request data handling was added.

## WooCommerce safety notes

- No WooCommerce write path was added.
- No WooCommerce zones or methods were created, updated, deleted, or adopted.
- No `yaxii_zone_map` read or write was added.
- Existing safe apply and managed removal paths were not changed.

## WordPress.org compliance notes

- The plugin remains local-first.
- Admin assets remain bundled locally under `assets/admin`.
- No Google Fonts, remote CSS, remote scripts, telemetry, analytics, Lovable capture, licensing, or upsell behavior was added.
- Documentation describes implemented behavior only.

## Local checks

- `composer dump-autoload`
- `php -l src/Settings/SettingsRepository.php`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- restricted phrase scan for `CSV imported successfully`, `commune-level pricing is available`, `__lovable`, `captureException`, `telemetry`, and `analytics`
- external asset scan for Google Fonts, remote CSS, remote scripts, and remote enqueue calls
- WooCommerce write/delete diff scan
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- `composer dump-autoload`: passed.
- `php -l src/Settings/SettingsRepository.php`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with pre-existing fast-refresh warnings in unrelated UI files; no lint errors after formatting.
- `npm run build`: passed; Vite emitted the existing large chunk warning.
- Source maps: none under `assets/admin`.
- Restricted runtime phrase scan: no matches in `src`, `admin-app/src`, `assets/admin`, or the plugin bootstrap. A broader readme scan contains the intended FAQ that says no telemetry or analytics are sent.
- External asset scan: no Google Fonts, no remote CSS/script tags, and no remote `wp_enqueue_script` or `wp_enqueue_style` calls. URL strings found are plugin/license metadata, Tailwind license comment, and React production error documentation strings.
- WooCommerce write/delete diff scan: no new source write/delete path, no `yaxii_zone_map` write.
- `git diff --check`: passed with line-ending normalization warnings only.
- `git status --short --untracked-files=all`: showed TASK-014B changes plus pre-existing unrelated dirty files.

## Local smoke result

WP-CLI `eval-file` smoke used in-memory filters only and did not alter the database option:

- missing settings option simulation: `missing_warnings=0`;
- current local settings: `current_warnings=0`;
- malformed stored settings simulation: `malformed_warnings=1`, `Stored settings were invalid and defaults were used.`

Browser smoke:

- Opened `http://yaxii-ysz.local/wp-admin/admin.php?page=yaxii-shipping-manager`.
- Used temporary local admin `ysm_task014b_smoke`.
- Confirmed the admin snapshot did not show the global `Settings normalized` notice.
- Confirmed checked and unchecked switch thumb geometry stayed inside the track.
- Deleted temporary user `15` after smoke.

## Server path detected

`/home/u538716307/domains/demo.yaxii.dev/public_html/wp-content/plugins/yaxii-shipping-manager`

Discovery found exactly one `wp-content/plugins/yaxii-shipping-manager/yaxii-shipping-manager.php` under `/home/u538716307/domains`.

## Server backup path

`/home/u538716307/backups/yaxii-shipping-manager/task-014b-20260702-220752`

## Files deployed

- `src/Settings/SettingsRepository.php`
- `assets/admin/manifest.json`
- `assets/admin/assets/main-Bek0twC3.css`
- `assets/admin/assets/main-CEtUW-6T.js`

The remote old hashed assets were not deleted. The deployed manifest points to the new hashed files.

## Remote smoke result

- Remote plugin folder backup created before copying files.
- Remote changed files copied successfully over SSH/SCP.
- Remote `assets/admin` source-map check returned `source_maps=none`.
- Remote `assets/admin/manifest.json` points to `assets/main-CEtUW-6T.js` and `assets/main-Bek0twC3.css`.
- Remote WP-CLI reports `yaxii-shipping-manager` active.
- Remote file listing confirms the changed PHP, manifest, CSS, and JS files are present.

Manual remote browser verification is still required because this task did not use or create remote wp-admin credentials.

Remote plain `php -l src/Settings/SettingsRepository.php` could not be completed because `/usr/bin/php` segfaulted on the server. Local PHP lint passed before deploy, and remote WP-CLI loaded WordPress with the plugin active.

## What still remains mocked

- CSV import/export backend remains not implemented.
- YSF Sync remains future/disabled informational scope.
- Provider dispatch remains not implemented.
- Commune-level pricing remains not implemented.
- Yaxii COD Theme compatibility detection remains future scope.

## What was not changed

- No Yaxii COD Theme files.
- No WooCommerce zones, methods, or store settings.
- No `yaxii_zone_map`.
- No SafeApplyEngine behavior.
- No generator compatibility blocking.
- No checkout compatibility detection.
- No REST contract fields were added or removed.

## QA guard findings

- `clean-code-guard`: no new abstraction, no catch-all swallowing, no mock success path, and the missing-option sentinel avoids string collision.
- `wp-guard`: no new request input handling, no new output in PHP, no state-changing endpoint changes, and user-facing PHP strings remain translated through the existing sanitizer path.
- `woo-guard`: no WooCommerce API writes or money logic changed.
- `wp-rest-api`: settings response contract remains the same; warnings remain an array.
- `wp-plugin-directory-guidelines`: no remote dependencies, tracking, licensing, obfuscation, or external assets added.
- `docs-guard`: updated docs refer only to verified local/remote behavior from this task.

## Known risks

- Remote wp-admin UI was not browser-smoked due lack of remote credentials in this task.
- Remote `/usr/bin/php` CLI segfault prevented a server-side `php -l` syntax check.
- The remote folder may retain old hashed admin assets because deployment avoided deletion; current manifest points only to the new files.
- Local browser switch click needed keyboard activation in agent-browser, matching previous local smoke behavior with keyboard activation.

## Blockers

No blocker for local implementation, build, or deployment.

Remote manual UI verification remains required:

- open `/wp-admin/admin.php?page=yaxii-shipping-manager`;
- confirm no global `Settings normalized` notice;
- toggle a row switch and confirm the thumb stays inside the track;
- check browser console/admin fatal errors.

## Next recommended task

TASK-014C: add read-only Yaxii COD Theme compatibility detection for existing theme zones and mixed 58/69 setups without changing WooCommerce write paths.

## Commit hash, if committed

The final commit hash is reported in the task closeout because the report is part of the commit content.
