# TASK-013A - Plugin Check Release Hygiene

## Date

2026-07-02

## Goal

Fix WordPress.org Plugin Check release-readiness issues without adding product features, and define a clean package strategy that excludes development-only files from the production plugin package.

## Scope

- Read the Plugin Check report generated at `2026-07-02 19:50:20`.
- Add a WordPress.org `readme.txt`.
- Make the declared `Domain Path: /languages` valid without adding fake translations.
- Fix the `DatasetRepository` exception escaping findings.
- Normalize the PHP files flagged for mixed line endings to LF.
- Remove the discouraged `load_plugin_textdomain()` call for WordPress.org-hosted behavior.
- Review the direct WooCommerce zone-method status DB update and document the narrow PHPCS ignore.
- Add package hygiene documentation and `.distignore`.
- Move the local Plugin Check report into `.agents/progress/yaxii-shipping-manager/plugin-check/`.

No generator, Shipping Editor, CSV, provider import, YSF sync, commune pricing, telemetry, licensing, or WooCommerce behavior change was added.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git root: `C:/Users/Aymen/Local Sites/yaxii-ysz/app/public/wp-content/plugins/yaxii-shipping-manager`
- Branch: `task/013a-plugin-check-release-hygiene`
- Latest TASK-012N commit present before branching: `c99d66c TASK-012N: simplify settings UI`
- Pre-existing unrelated dirty files were present before this task, including older `.agents/progress/...` reports, `AGENTS.md`, `CLAUDE.md`, and current dataset JSON files. They were not staged for this task.

## Plugin Check Findings Addressed

- Hidden development files: addressed by package strategy and `.distignore`; local dev files were not deleted.
- Root markdown warnings for `AGENTS.md` and `CLAUDE.md`: addressed by package exclusion.
- Missing `readme.txt`: fixed by adding a WordPress.org readme.
- Missing `languages/` for `Domain Path`: fixed by adding `languages/yaxii-shipping-manager.pot`.
- `DatasetRepository` exception escaping errors: fixed with inline `esc_html( $label )` at the exception message construction sites.
- Mixed PHP line endings: normalized the Plugin Check-listed PHP files to LF and updated `.gitattributes` for PHP/text release files.
- Discouraged `load_plugin_textdomain()`: removed the manual hook/method so WordPress.org translations can autoload.
- Direct DB query warnings in `SafeApplyEngine`: reviewed against WooCommerce's own admin/REST status-toggle implementation and added a narrow PHPCS ignore for the existing verified `is_enabled` update only.

## Plugin Check Findings Deferred or Justified

- The direct DB update remains because WooCommerce exposes method status toggling through the same table update pattern in its admin and REST controllers. The target row is still constrained by validated `zone_id`, `instance_id`, and `method_id = flat_rate`; no user input is interpolated into SQL.
- `wp dist-archive` is not installed in WP-CLI on this machine. A temporary clean package folder was created manually with the `.distignore` exclusions for smoke and Plugin Check.

## Readme Result

Added `readme.txt` with plugin metadata, description, installation, FAQ, screenshots, changelog, and upgrade notice. Claims are limited to implemented behavior:

- generate Algeria WooCommerce shipping zones from preview
- manage Yaxii-managed method prices, labels, and enabled status
- protect manual zones
- diagnostics
- verified managed setup removal

The contributor value is `yaxii`; replace it with the actual WordPress.org username before submission if different.

## Domain Path Result

Kept `Domain Path: /languages` and added `languages/yaxii-shipping-manager.pot`. No fake translations were added.

## Escaping Fix Result

`src/Data/DatasetRepository.php` now wraps the internal dataset list label with `esc_html()` inline in the two exception messages flagged by Plugin Check.

## Line Ending Normalization Result

Normalized these PHP files to LF:

- `src/Data/DatasetRepository.php`
- `src/Apply/ManagedZoneRegistry.php`
- `src/Plugin.php`
- `src/Preview/PreviewPlanner.php`
- `src/Preview/PreviewRequestSanitizer.php`
- `src/Rest/DatasetController.php`
- `src/Rest/Routes.php`
- `src/Settings/SettingsDefaults.php`
- `src/Settings/SettingsSanitizer.php`
- `src/WooCommerce/AlgeriaStatesRegistrar.php`
- `src/WooCommerce/ShippingDiagnosticsService.php`

`src/Apply/SafeApplyEngine.php` was also confirmed LF-only after the PHPCS ignore edit.

## load_plugin_textdomain Result

Removed `Plugin::load_textdomain()` and the `init` hook that called `load_plugin_textdomain()`. This follows WordPress.org-hosted plugin behavior where translations under the plugin slug are loaded automatically.

## Direct DB Query Review Result

`SafeApplyEngine::save_zone_method_status()` still uses `$wpdb->update()` for WooCommerce's `woocommerce_shipping_zone_methods.is_enabled` flag. Behavior was not changed. A precise PHPCS ignore was added for:

- `WordPress.DB.DirectDatabaseQuery.DirectQuery`
- `WordPress.DB.DirectDatabaseQuery.NoCaching`

Reason: WooCommerce core uses the same direct table update pattern for shipping-zone method enabled status, and this plugin only reaches the update after managed registry, zone location, method ID, and instance ID checks pass.

## Packaging Strategy

Added `.distignore` and `docs/RELEASE-PACKAGING.md`.

The clean package excludes:

- `.agents/`
- `.git/`
- `.github/`
- `.codex/`
- `.tmp/`
- `.gitignore`
- `.gitattributes`
- `AGENTS.md`
- `CLAUDE.md`
- Plugin Check report markdown
- `.agents/references/`
- `node_modules/`
- `tools/`
- screenshots, logs, temp files, archives, coverage, and source maps
- hidden Prettier and Git ignore files under `admin-app/`
- `prototype-app-history.bundle`
- `skills-lock.json`

The temporary package root contained only:

- `admin-app`
- `assets`
- `composer.json`
- `data`
- `docs`
- `languages`
- `readme.txt`
- `src`
- `vendor`
- `yaxii-shipping-manager.php`

`admin-app` source remains package-eligible for source availability, while hidden config and `node_modules` are excluded.

## Clean Package Contents and Exclusions

Temporary package path:

`C:\Users\Aymen\AppData\Local\Temp\ysm-task-013a-package-smoke\yaxii-shipping-manager`

Static package scan found no:

- `.agents`
- `.git*`
- `.github`
- `.codex`
- `.tmp`
- `AGENTS.md`
- `CLAUDE.md`
- Plugin Check report markdown
- reference app files
- `node_modules`
- hidden Prettier files
- source maps

`readme.txt` and `languages/` were present.

## Plugin Check Rerun Result

Ran official Plugin Check via WP-CLI against the clean package folder:

```text
wp plugin check "C:\Users\Aymen\AppData\Local\Temp\ysm-task-013a-package-smoke\yaxii-shipping-manager" --format=json
Success: Checks complete. No errors found.
```

## Files Changed

- `.distignore`
- `.gitattributes`
- `docs/RELEASE-PACKAGING.md`
- `docs/RUNTIME-SMOKE.md`
- `languages/yaxii-shipping-manager.pot`
- `readme.txt`
- `src/Apply/SafeApplyEngine.php`
- `src/Data/DatasetRepository.php`
- `src/Plugin.php`
- PHP line-ending normalization files listed above
- `.agents/progress/yaxii-shipping-manager/plugin-check/yaxii-shipping-manager-yaxii-shipping-manager-php-20260702-195020.md`
- `.agents/progress/yaxii-shipping-manager/TASK-013A-plugin-check-release-hygiene.md`

## Files Created

- `.distignore`
- `docs/RELEASE-PACKAGING.md`
- `languages/yaxii-shipping-manager.pot`
- `readme.txt`
- `.agents/progress/yaxii-shipping-manager/plugin-check/yaxii-shipping-manager-yaxii-shipping-manager-php-20260702-195020.md`
- `.agents/progress/yaxii-shipping-manager/TASK-013A-plugin-check-release-hygiene.md`

## What Was Before

Plugin Check was run against the development folder, so it saw agent harness files, hidden dev config, reference material, root agent markdown, no WordPress.org readme, a missing `languages/` path, two exception escaping findings, mixed line endings, a discouraged textdomain loader, and a direct DB query warning.

## What Changed

The plugin now has a clean-package strategy and Plugin Check passes against the clean package. Real code/readme issues were fixed without adding product scope.

## What Still Remains Mocked

- CSV import/export backend remains not implemented.
- Commune-level pricing remains not implemented.
- Provider imports remain not implemented.
- YSF sync remains not implemented.
- Zone-name updates remain previewed but not applied.

## Security Notes

- No new REST routes or permissions were added.
- No new request handling was added.
- No external calls, telemetry, licensing, or remote assets were added.
- The direct DB update remains constrained to an existing verified managed method row.

## WooCommerce Safety Notes

- No new WooCommerce write path was added.
- Safe apply remains the setup/repair writer.
- Managed setup removal remains isolated in the existing removal executor.
- Manual zones are still protected by the existing ownership checks.
- The status toggle behavior in `SafeApplyEngine` was not changed.

## WordPress.org Compliance Notes

- `readme.txt` now exists and matches plugin version `0.1.0`.
- GPL header remains `GPL-2.0-or-later`.
- `Domain Path: /languages` now points to an existing package folder.
- Clean package excludes hidden/dev files that Plugin Check flagged in the development root.
- Official Plugin Check passes on the clean package folder.

## QA Guard Findings

- `clean-code-guard`: no new abstraction, no swallowed errors, no mock success paths, behavior kept narrow.
- `docs-guard`: readme and release docs were checked against current code/docs; unsupported features are stated as not implemented.
- `woo-guard`: no new WooCommerce write/delete path; the existing direct status update is justified and constrained.
- `wp-guard`: exception escaping, i18n folder, textdomain behavior, and package hygiene were addressed; REST/security behavior unchanged.
- `wp-rest-api`: no route changes; existing permission-callback structure in `Routes` was preserved.
- `wp-plugin-directory-guidelines`: package excludes dev/harness files, avoids trialware/telemetry/remote assets, keeps GPL-compatible headers.

## Checks Run

- `php -l` on changed PHP files
- `composer validate --no-check-publish`
- Official Plugin Check on clean package folder
- Hidden/dev file scan on clean package folder
- Source map scan under `assets/admin`
- Restricted phrase scan
- Targeted remote font/script/style scan
- WooCommerce write/delete scan
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- PHP lint passed for `src/Apply/SafeApplyEngine.php`, `src/Data/DatasetRepository.php`, and `src/Plugin.php`.
- Composer validation passed.
- Official Plugin Check on the clean package: `Success: Checks complete. No errors found.`
- Clean package hidden/dev scan returned no unwanted files.
- No source maps found under `assets/admin`.
- No `__lovable`, `captureException`, `CSV imported successfully`, or `commune-level pricing is available` matches found.
- `telemetry` and `analytics` matches are limited to readme text saying the plugin does not send them.
- No Google Fonts or remote `.js`/`.css` asset matches found in source enqueue surfaces.
- WooCommerce write/delete scan found only existing safe apply, registry/settings option writes, and the existing managed setup removal executor.
- `git diff --check` completed without whitespace errors; it printed line-ending conversion warnings for unrelated pre-existing dirty files.

## Known Risks

- `wp dist-archive` is not installed, so the package smoke used a manual temporary copy that mirrors `.distignore`; release automation should use a package tool that honors `.distignore`.
- Confirm the real WordPress.org contributor username before submission.
- Admin source is kept package-eligible for source availability; the final release owner should confirm whether to include it in SVN or link source from the readme/repository policy.

## Blockers

None.

## Next Recommended Task

TASK-013B: create the final release archive with a repeatable packaging command, rerun Plugin Check on that archive, and review final WordPress.org readme/source distribution policy before SVN submission.

## Commit Hash

See the commit containing this report. Final commit hash is reported in the task closeout.
