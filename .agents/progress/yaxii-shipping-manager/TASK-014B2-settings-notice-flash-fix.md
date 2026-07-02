# TASK-014B2: Settings Notice Flash Fix

Date: 2026-07-02

## Goal

Fix the transient blue notices that briefly appeared on Settings refresh after TASK-014B.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Starting branch: `task/014b-release-ux-notice-switch-deploy`
- Working branch: `task/014b2-settings-notice-flash-fix`
- TASK-014A commit `a86d0ea` exists locally.
- TASK-014B commit `37d1964` exists locally.
- Pre-existing unrelated dirty files were present before this task and were not staged intentionally.
- Nested `app/.git`: not present.

## Scope

Included:

- Settings refresh notice flash root-cause inspection.
- Minimal frontend gating for global runtime notices.
- Rebuilt admin runtime JS bundle and manifest.
- Local checks and local browser smoke.
- Demo server backup and runtime asset deployment.
- Runtime smoke documentation and progress report.

Excluded:

- TASK-014C compatibility detection.
- Yaxii COD Theme zone detection.
- `DZ:DZ-01` normalization.
- WooCommerce zone or method changes.
- `yaxii_zone_map` writes.
- `SafeApplyEngine` changes.
- Generator behavior changes.
- Yaxii COD Theme edits.
- Telemetry, licensing, external assets, remote fonts, or hidden calls.

## Docs read

- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014A-release-compatibility-audit-yaxii-cod.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014B-release-ux-notice-switch-deploy.md`
- `docs/SETTINGS-CONTRACT.md`
- `docs/RUNTIME-SMOKE.md`
- `AGENTS.md`
- `CLAUDE.md`

## Files changed

- `admin-app/src/routes/index.tsx`
- `assets/admin/manifest.json`
- `assets/admin/assets/main-DmGTUSNe.js`
- `docs/RUNTIME-SMOKE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014B2-settings-notice-flash-fix.md`

Generated build asset removed locally by Vite:

- `assets/admin/assets/main-CEtUW-6T.js`

## Files created

- `assets/admin/assets/main-DmGTUSNe.js`
- `.agents/progress/yaxii-shipping-manager/TASK-014B2-settings-notice-flash-fix.md`

Temporary local smoke script:

- `.agents/tmp/task-014b2-settings-warning-smoke.php` was created, run, and deleted before final diff.

## What was before

After bootstrap loaded, `AdminApp` initialized both `settingsState` and `datasetState` as `loading`.

`RuntimeNotices` rendered both pending states as global blue alerts:

- `Loading saved settings`
- `Loading normalized dataset`

On Settings refresh, those alerts appeared before the settings request and dataset request completed, then disappeared as the states changed to `ready`.

## Notice flash root cause

The flash was not a real settings repair warning. It was caused by global runtime loading notices being rendered for normal pending requests during hydration:

- one notice came from `settingsState.status === "loading"`;
- one notice came from `datasetState.status === "loading"`;
- both rendered before the final loaded settings/bootstrap-derived data was available;
- React Strict Mode was not the primary cause. It could re-run effects in development, but the production bundle had enough pending-state UI to flash without duplicate warning state.

The loaded-response repair warning path was already scoped to `SettingsForm` and initialized from `response.warnings` only after `settingsState.status === "ready"`.

## Fix implemented

- `RuntimeNotices` now returns `null` when there is no real runtime notice.
- Global runtime notices remain only for:
  - WooCommerce inactive;
  - dataset load error;
  - settings load error.
- The pending `Loading normalized dataset` and `Loading saved settings` global alerts were removed.
- The Settings loading card remains inside the Settings screen while settings load.
- The Settings repair warning still renders only inside `SettingsForm` from the loaded response warnings.

## Real repair warning behavior

- Missing settings option: quiet, no warning.
- Current valid settings: quiet, no warning.
- Malformed stored settings: backend still returns one repair warning.
- Settings repair warning remains scoped to Settings, non-blocking, and dismissible through `sessionStorage`.
- The rebuilt bundle still contains `Settings were repaired`.
- The rebuilt bundle no longer contains `Settings normalized`, `Loading saved settings`, or `Loading normalized dataset`.

## Local QA result

- `npm run typecheck`: passed.
- `npm run lint`: passed with the existing fast-refresh warnings in unrelated UI files.
- `npm run build`: passed; Vite emitted the existing large chunk warning.
- Source maps under `assets/admin`: none.
- Restricted phrase scan:
  - `CSV imported successfully`: no runtime/source matches.
  - `commune-level pricing is available`: no runtime/source matches.
  - `__lovable`: no matches.
  - `captureException`: no matches.
  - `telemetry`: only the intended `readme.txt` FAQ saying telemetry is not sent.
  - `analytics`: only the intended `readme.txt` FAQ saying analytics data is not sent.
- External asset scan: no Google Fonts, no remote CSS/script tags, and no remote `wp_enqueue_script` or `wp_enqueue_style` calls. Bundled React contains generic URL strings and SVG namespace strings, not external asset loads.
- WooCommerce write/delete scan: no new WooCommerce write path, no new delete path, and no `yaxii_zone_map` write.
- `git diff --check`: passed with line-ending normalization warnings only.

No PHP files changed, so `composer dump-autoload` and `php -l` were not required for this task.

## Local browser smoke result

- Created temporary local administrator `ysm_task014b2_smoke`, used for browser smoke, then deleted user ID `16`.
- Opened `http://yaxii-ysz.local/wp-admin/admin.php?page=yaxii-shipping-manager#/settings`.
- Hard-refreshed Settings.
- After hard refresh, the Settings DOM had no `role="alert"` elements.
- The Settings DOM did not contain:
  - `Settings normalized`
  - `Loading saved settings`
  - `Loading normalized dataset`
  - `Settings were repaired`
- Navigated from Settings to Diagnostics and back to Settings.
- The Settings DOM still had no notices for valid settings.
- Created a second temporary local administrator for optional warning UI simulation, but agent-browser could not reopen the local login page and returned connection timeout errors. The user was deleted as user ID `17`.

Non-mutating WP-CLI settings warning smoke:

- `missing_warnings=0`
- `current_warnings=0`
- `malformed_warnings=1`
- `malformed_first_warning=Stored settings were invalid and defaults were used.`

## Server backup path

`/home/u538716307/backups/yaxii-shipping-manager/task-014b2-20260702-224504`

## Files deployed

Remote plugin path:

`/home/u538716307/domains/demo.yaxii.dev/public_html/wp-content/plugins/yaxii-shipping-manager`

Deployed files:

- `assets/admin/manifest.json`
- `assets/admin/assets/main-DmGTUSNe.js`

No PHP files were deployed because no PHP files changed.

Deployment correction:

- The first `scp` command accidentally copied `main-DmGTUSNe.js` to `assets/admin/main-DmGTUSNe.js`.
- The file was then copied to the correct `assets/admin/assets/main-DmGTUSNe.js` path.
- The accidental duplicate was removed from exactly `/home/u538716307/domains/demo.yaxii.dev/public_html/wp-content/plugins/yaxii-shipping-manager/assets/admin/main-DmGTUSNe.js`.

## Remote verification status

- Remote manifest points to `assets/main-DmGTUSNe.js` and `assets/main-Bek0twC3.css`.
- Remote `assets/admin/assets/main-DmGTUSNe.js` exists.
- Accidental remote `assets/admin/main-DmGTUSNe.js` is absent.
- Remote `assets/admin` source-map count: `0`.
- Remote WP-CLI reports `yaxii-shipping-manager` active.
- Remote bundle check:
  - `Loading saved settings`: absent.
  - `Loading normalized dataset`: absent.
  - `Settings normalized`: absent.
  - `Settings were repaired`: present.

Remote manual browser verification:

- Created temporary remote administrator `ysm_task014b2_remote` as user ID `2`.
- Browser reached the remote WordPress login page.
- Login looped back to `wp-login.php` after form submission.
- Reset the temporary password through WP-CLI and retried.
- Login still looped back to `wp-login.php`.
- Deleted temporary remote user ID `2`.
- Remote browser UI verification is blocked by remote authentication/session behavior, not by the plugin asset deployment. File-level remote runtime verification passed.

## What was not changed

- No Yaxii COD Theme files.
- No WooCommerce zones, methods, or store shipping settings.
- No `yaxii_zone_map`.
- No `SafeApplyEngine`.
- No Generator behavior.
- No Yaxii COD compatibility detection.
- No REST endpoint contract changes.
- No PHP behavior.
- No source maps.
- No external assets, telemetry, licensing, or hidden calls.

## What still remains mocked

- CSV import/export backend remains not implemented.
- YSF Sync remains future/disabled informational scope.
- Provider dispatch remains not implemented.
- Commune-level pricing remains not implemented.
- Yaxii COD Theme compatibility detection remains future TASK-014C scope.

## Security notes

- No new remote calls, telemetry, tracking, licensing, obfuscation, or external assets were added.
- No new request handling was added.
- No PHP output path changed.
- Session dismissal behavior from TASK-014B was preserved and still stores only a local warning key in browser `sessionStorage`.
- Temporary local and remote admin users were deleted after smoke attempts.

## WooCommerce safety notes

- No WooCommerce write path was added.
- No WooCommerce zone or method was created, updated, deleted, adopted, or normalized.
- No `yaxii_zone_map` read or write was added.
- Existing SafeApplyEngine behavior was not touched.

## WordPress.org compliance notes

- The plugin remains local-first.
- Admin assets remain bundled locally under `assets/admin`.
- No Google Fonts, remote CSS, remote scripts, telemetry, analytics, Lovable capture, licensing, or upsell behavior was added.
- Documentation describes verified behavior and explicitly marks the remote browser-auth blocker.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- restricted phrase scan
- external asset scan
- WooCommerce write/delete scan
- local browser Settings hard-refresh smoke
- local browser Settings away/back smoke
- non-mutating WP-CLI settings warning smoke
- remote backup
- remote manifest/file/source-map verification
- remote WP-CLI active plugin check
- remote deployed-bundle string verification
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

Passed except:

- `npm run lint` passed with existing fast-refresh warnings in unrelated UI files.
- Vite build passed with the existing large chunk warning.
- Remote manual browser UI verification is blocked by the remote login loop for the temporary admin user.
- `git diff --check` printed line-ending normalization warnings for pre-existing dirty files and generated assets, but reported no whitespace errors.

## Known risks

- Remote browser verification of the actual wp-admin Settings screen could not be completed because the temporary remote admin could not establish a browser session.
- The remote folder may retain old hashed admin assets from previous builds. The current manifest points to the new JS and existing CSS files.
- `RuntimeNotices` no longer displays global loading notices for dataset/settings requests. Page-level loading states remain in place where needed.

## Blockers

Remote manual browser smoke blocker:

- Blocker: temporary remote admin login loops back to `wp-login.php`.
- Evidence: agent-browser submitted the remote login form twice, including after a WP-CLI password reset, and remained at `https://demo.yaxii.dev/wp-login.php?...`.
- Why it matters: manual visual confirmation of no Settings notice flash on the remote wp-admin page requires an authenticated browser session.
- Safe options: use an existing authenticated browser session, provide remote wp-admin credentials, or investigate remote login/session/security behavior separately.
- Recommended option: verify the remote Settings page manually in an existing authenticated session; file-level deployment checks already prove the deployed bundle cannot render the removed loading notices.

## Next recommended task

TASK-014C: add read-only Yaxii COD Theme compatibility detection for existing theme zones and mixed 58/69 setups without changing WooCommerce write paths.

## Commit hash, if committed

The final commit hash is reported in the task closeout because the report is part of the commit content.
