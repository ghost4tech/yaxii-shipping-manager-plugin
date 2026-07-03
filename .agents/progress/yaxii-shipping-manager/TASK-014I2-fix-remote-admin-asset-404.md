# TASK-014I2 - Fix Remote Admin Asset 404

Date: 2026-07-03

## Goal

Fix the blank React admin app on `wp-admin/admin.php?page=yaxii-wc-shipping-manager` by resolving the remote 404 responses for the TASK-014I built admin assets.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git repository: yes.
- Starting branch: `task/014i-final-release-prep-slug-css-package`
- Task branch: `task/014i2-fix-remote-admin-asset-404`
- TASK-014I commit `cac1c28` exists locally.
- Pre-existing unrelated dirty files were present before this task and were not staged.

## Scope

Included:

- Verify local manifest and built assets.
- Verify remote manifest, files, permissions, and direct asset URLs.
- Make a timestamped remote backup.
- Fix only the remote admin asset directory/file permissions required for the web server to serve the files.
- Verify remote JS/CSS URL status.
- Write this report.

Excluded:

- Product behavior changes.
- WooCommerce zone, method, option, or database changes.
- Generator apply.
- Remove Yaxii setup.
- Yaxii COD Theme changes.
- New features.
- Local build, because local assets were present and unchanged.

## Local Manifest and Assets Result

Local `assets/admin/manifest.json` references:

- `assets/main-BoOGZ-gx.js`
- `assets/main-Rog5wkY2.css`

Local files exist and are non-zero:

- `assets/admin/assets/main-BoOGZ-gx.js`: 538329 bytes
- `assets/admin/assets/main-Rog5wkY2.css`: 233631 bytes
- `assets/admin/manifest.json`: 186 bytes

## Remote Manifest and Assets Result Before Fix

Remote `assets/admin/manifest.json` matched the local manifest and referenced:

- `assets/main-BoOGZ-gx.js`
- `assets/main-Rog5wkY2.css`

The exact remote files existed and were non-zero:

- `/home/u538716307/domains/demo.yaxii.dev/public_html/wp-content/plugins/yaxii-shipping-manager/assets/admin/assets/main-BoOGZ-gx.js`
- `/home/u538716307/domains/demo.yaxii.dev/public_html/wp-content/plugins/yaxii-shipping-manager/assets/admin/assets/main-Rog5wkY2.css`

Before fix, remote permissions were:

- `assets/admin`: `drwx------`
- `assets/admin/assets`: `drwx------`
- JS/CSS files: `rw-r--r--`

Before fix, direct URL checks returned `HTTP/2 404` for both files.

## Root Cause

The TASK-014I files were present on the remote server, but the parent directories `assets/admin` and `assets/admin/assets` had `700` permissions. The web server could not traverse those directories, so static files returned 404 even though WordPress was enqueueing the correct manifest filenames.

## Backup Path

`/home/u538716307/backups/yaxii-shipping-manager/task-014i2-20260703-161010`

## Files Deployed

No file copy was required. The remote manifest and exact hashed JS/CSS files already existed and matched the local build.

Remote permissions were corrected:

- `chmod 755 assets/admin`
- `chmod 755 assets/admin/assets`
- `chmod 644 assets/admin/manifest.json`
- `chmod 644 assets/admin/assets/main-BoOGZ-gx.js`
- `chmod 644 assets/admin/assets/main-Rog5wkY2.css`

## Remote URL Curl Results

After the permission fix:

- `https://demo.yaxii.dev/wp-content/plugins/yaxii-shipping-manager/assets/admin/assets/main-BoOGZ-gx.js`: `HTTP/2 200`
- `https://demo.yaxii.dev/wp-content/plugins/yaxii-shipping-manager/assets/admin/assets/main-Rog5wkY2.css`: `HTTP/2 200`

## New Admin URL Status

`https://demo.yaxii.dev/wp-admin/admin.php?page=yaxii-wc-shipping-manager` returns `HTTP/2 302` to the WordPress login page for unauthenticated requests. That confirms the route is handled by WordPress and not returning a static 404. Authenticated browser verification remains manual.

## Remote Verification Result

- Remote manifest points to files that exist.
- `ls` confirms the JS/CSS files exist and are non-zero.
- JS URL returns `200`.
- CSS URL returns `200`.
- No source maps were found under remote `assets/admin`.
- `wp plugin is-active yaxii-shipping-manager`: active.
- Admin URL redirects to login for unauthenticated requests.

## What Was Not Changed

- No local product code changed.
- No local build output changed.
- No WooCommerce zones, methods, options, registry records, or database rows were changed.
- No Generator apply action was run.
- No Remove Yaxii setup action was run.
- No Yaxii COD Theme files were modified.
- No obsolete assets were removed, because the current remote assets directory only needed permission correction for the referenced files.

## Security Notes

- The fix grants normal web-readable traversal on public plugin asset directories only.
- Files remain `644`; directories are now `755`.
- No executable PHP permissions or writable web permissions were added.

## WooCommerce Safety Notes

- No WooCommerce APIs or write paths were touched.
- No store shipping configuration was read or modified.

## WordPress.org Compliance Notes

- The fix keeps all assets local under the plugin directory.
- No external JS, CSS, fonts, telemetry, licensing, or remote calls were added.

## Checks Run

- Repo preflight: cwd, branch, status, recent graph, TASK-014I commit existence.
- Local skill inspection under `.agents/skills`.
- Read `AGENTS.md`, `CLAUDE.md`, `wp-guard`, `docs-guard`, and the TASK-014I report.
- Local manifest/assets existence and byte-size check.
- Remote `ls` and `cat` for manifest/assets before fix.
- Remote `namei -l` permission inspection.
- Remote `curl -I` for JS/CSS before fix.
- Remote backup.
- Remote permission fix.
- Remote `curl -I` for JS/CSS after fix.
- Remote source-map scan.
- Remote plugin active check with WP-CLI.
- Remote unauthenticated admin URL header check.
- `git diff --check`.
- `git status --short --untracked-files=all`.

## Check Results

- Local manifest/assets check passed.
- Remote file existence check passed before fix.
- Remote permissions check found the root cause.
- Remote JS/CSS URL checks failed before fix with `HTTP/2 404`.
- Remote JS/CSS URL checks passed after fix with `HTTP/2 200`.
- Source-map scan passed.
- Plugin active check passed.
- Admin URL check returned a WordPress login redirect, not a 404.

## Known Risks

- Browser verification behind the WordPress login remains manual.
- If future deploy tooling creates directories with `700` permissions again, the same static asset issue can recur.
- Existing unrelated dirty files remain in the local worktree and were not staged.

## Blockers

None for the asset 404 fix.

## Remaining Manual Checks

- Reload `wp-admin/admin.php?page=yaxii-wc-shipping-manager` while authenticated.
- Confirm the React app mounts.
- Confirm the browser console no longer shows 404 for `main-BoOGZ-gx.js` or `main-Rog5wkY2.css`.

## Next Recommended Task

Update the deployment procedure to preserve web-readable directory permissions for `assets/admin` after future asset deploys, then continue final browser smoke and Plugin Check on the working site.

## Commit Hash, If Committed

Pending at report write time.
