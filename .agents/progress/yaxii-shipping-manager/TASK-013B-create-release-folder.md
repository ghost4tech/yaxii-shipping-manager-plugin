# TASK-013B - Create Release Folder

## Date

2026-07-02

## Goal

Create a clean WordPress.org-ready plugin folder inside the repository root so it can be copied to another WordPress site for testing before submission.

## Scope

- Create `release/yaxii-shipping-manager`.
- Create `release/yaxii-shipping-manager.zip` with a top-level `yaxii-shipping-manager/` folder.
- Copy only release-eligible files.
- Validate required runtime files and excluded development files.
- Run Plugin Check on a temp copy of the release folder and on the extracted zip.
- Leave generated release artifacts uncommitted.

No product code or behavior was changed.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/013b-create-release-folder`
- TASK-013A commit present: `b1e7f4c TASK-013A: fix plugin check release hygiene`
- Pre-existing unrelated dirty files remain unstaged.

## Release Folder Path

`C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager\release\yaxii-shipping-manager`

## Zip Path

`C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager\release\yaxii-shipping-manager.zip`

SHA256:

`AFF77F3D088AEAD65A7A03DF008C02CEF607D2E0E36CE12BB00F2C73AFAD13B9`

Size:

`541189` bytes

## Included Top-Level Files and Folders

- `admin-app`
- `assets`
- `composer.json`
- `data`
- `languages`
- `readme.txt`
- `src`
- `vendor`
- `yaxii-shipping-manager.php`

The package root contains plugin files directly under `yaxii-shipping-manager/`; it is not nested incorrectly.

## Excluded Dev Files

The release folder excludes:

- `.git`
- `.gitignore`
- `.gitattributes`
- `.agents`
- `.github`
- `.codex`
- hidden files
- `AGENTS.md`
- `CLAUDE.md`
- markdown docs
- Plugin Check reports
- reference apps
- `node_modules`
- local smoke files
- logs
- screenshots
- source maps
- temporary files
- old archives
- development-only hidden config files

`admin-app/` source is included for WordPress.org source availability, excluding hidden config and `node_modules`.

## Hidden File Scan Result

Passed. No files or folders whose names start with `.` were found in `release/yaxii-shipping-manager`.

## Markdown Scan Result

Passed. No `.md` files were found in `release/yaxii-shipping-manager`.

## Source Map Scan Result

Passed. No `.map` files were found in `release/yaxii-shipping-manager`.

## Remote Asset Scan Result

Passed for runtime remote assets. No Google Fonts, remote `.js`, or remote `.css` references were found in runtime/source enqueue surfaces.

Expected source metadata URLs remain only in source/package metadata such as `admin-app/components.json`, `admin-app/package-lock.json`, plugin header/license URI, readme, and POT metadata. These are not runtime asset loads.

## Plugin Check Result

Direct Plugin Check against the nested in-repo path `release/yaxii-shipping-manager` was rejected by Plugin Check with:

```text
Error: Invalid plugin: The plugin set does not match the original request parameter.
```

This appears specific to checking a release package nested inside the currently installed source plugin folder.

To validate the actual package contents, the release folder was copied to:

`C:\Users\Aymen\AppData\Local\Temp\ysm-task-013b-plugin-check-folder\yaxii-shipping-manager`

Plugin Check result:

```text
wp plugin check "C:\Users\Aymen\AppData\Local\Temp\ysm-task-013b-plugin-check-folder\yaxii-shipping-manager" --format=json
Success: Checks complete. No errors found.
```

The zip was also extracted to:

`C:\Users\Aymen\AppData\Local\Temp\ysm-task-013b-zip-check\yaxii-shipping-manager`

Plugin Check result:

```text
wp plugin check "C:\Users\Aymen\AppData\Local\Temp\ysm-task-013b-zip-check\yaxii-shipping-manager" --format=json
Success: Checks complete. No errors found.
```

A stale Plugin Check `wp-content/object-cache.php` drop-in was left behind by the failed direct path checks. It contained the Plugin Check marker and was removed.

## How To Test On Another WordPress Site

1. Copy `release/yaxii-shipping-manager.zip` to the target WordPress site.
2. In WordPress admin, open Plugins > Add New > Upload Plugin.
3. Upload and install the zip.
4. Activate Yaxii Shipping Manager.
5. Confirm WooCommerce is active.
6. Open Yaxii Shipping Manager from wp-admin.
7. Run Diagnostics before using Generator or Shipping Editor.
8. Do not test apply/remove actions on a production store unless the store owner has approved changes to WooCommerce shipping configuration.

## Files Changed

- `.gitignore`
- `.agents/progress/yaxii-shipping-manager/TASK-013B-create-release-folder.md`

Generated but not committed:

- `release/yaxii-shipping-manager/`
- `release/yaxii-shipping-manager.zip`

## Checks Run

- Required file existence scan
- Top-level release folder listing
- Hidden/dev file scan
- Markdown file scan
- Source map scan
- Remote asset scan
- Zip root-folder inspection
- Plugin Check on temp copy of release folder
- Plugin Check on extracted zip
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Required files and folders exist.
- No forbidden hidden/dev files found.
- No `.md` files found.
- No `.map` files found.
- Zip root is `yaxii-shipping-manager/`.
- Plugin Check passed on temp release-folder copy.
- Plugin Check passed on extracted zip.

## What Was Before

TASK-013A had a clean package strategy and Plugin Check proof from a temp folder, but there was no persistent release folder or zip inside this repo.

## What Changed

Created a real release folder and zip under `release/` and added `release/` to `.gitignore` so artifacts remain local.

## What Still Remains Mocked

- CSV import/export backend remains not implemented.
- Commune-level pricing remains not implemented.
- Provider imports remain not implemented.
- YSF sync remains not implemented.
- Zone-name updates remain previewed but not applied.

## Security Notes

No product code changed. No new remote calls, telemetry, licensing, or external runtime assets were added.

## WooCommerce Safety Notes

No WooCommerce code changed. No new WooCommerce write/delete paths were added.

## WordPress.org Compliance Notes

The release folder excludes development artifacts and passes Plugin Check when checked outside the active source plugin tree and after zip extraction.

## Risks

- Plugin Check cannot reliably check the in-repo nested `release/yaxii-shipping-manager` path because the active source plugin has the same slug. Use the zip or a copy/extraction outside the active plugin tree for official verification.
- The real WordPress.org contributor username still needs confirmation before submission if `yaxii` is not correct.

## Blockers

None.

## Next Recommended Task

TASK-013C: install `release/yaxii-shipping-manager.zip` on a separate WordPress site, activate it with WooCommerce active, and run a browser/runtime smoke without applying shipping changes on production data.

## Commit Hash

See the commit containing this report. Final commit hash is reported in the task closeout.
