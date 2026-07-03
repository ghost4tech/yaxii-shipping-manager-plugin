# TASK-014H - Rebuild Release Package and Rerun Plugin Check

Date: 2026-07-03

## Goal

Rebuild the WordPress.org-ready release folder and zip from current HEAD, rerun Plugin Check on the clean package, and run final package hygiene scans without changing product/runtime behavior.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git repository: yes, root is the plugin root.
- Task branch: `task/014h-rebuild-release-package-plugin-check`
- Starting HEAD: `10f2ef7 TASK-014G: audit wporg release copy and screenshots`
- TASK-013A commit `b1e7f4c` exists locally.
- TASK-014G commit `10f2ef7` exists locally.
- Pre-existing unrelated dirty files were present before this task and were not staged.

## Docs/Audits Read

- `AGENTS.md`
- `CLAUDE.md`
- `.agents/skills/docs-guard/SKILL.md`
- `.agents/skills/docs-guard/references/review-checklist.md`
- `.agents/skills/docs-guard/references/verification.md`
- `.agents/skills/wp-plugin-directory-guidelines/SKILL.md`
- `.agents/skills/wp-plugin-directory-guidelines/references/guideline-review-checklist.md`
- `.agents/skills/wp-guard/SKILL.md`
- `.agents/skills/wp-guard/references/review-checklist.md`
- `.agents/skills/woo-guard/SKILL.md`
- `.agents/skills/woo-guard/references/review-checklist.md`
- `.agents/skills/clean-code-guard/SKILL.md`
- `.agents/skills/clean-code-guard/references/ai-failure-modes.md`
- `readme.txt`
- `.distignore`
- `docs/RELEASE-PACKAGING.md`
- `docs/WPORG-RELEASE-COPY-SCREENSHOT-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014G-wporg-release-copy-screenshot-audit.md`
- `.agents/progress/yaxii-shipping-manager/TASK-013A-plugin-check-release-hygiene.md`
- `yaxii-shipping-manager.php`
- `assets/admin/manifest.json`

## Release Metadata Result

- Plugin header version: `0.1.0`
- Readme stable tag: `0.1.0`
- Readme requires at least: `6.5`
- Readme tested up to: `7.0`
- Readme requires PHP: `7.4`
- Composer PHP requirement: `>=7.4`
- Contributor username: `yaxii`

The stable tag matches the plugin header version. Local `wp core version` returned `7.0`, so the current `Tested up to: 7.0` value matches this local checkout, but it should still be final-owner confirmed before submission. `Contributors: yaxii` also needs final owner confirmation as the actual WordPress.org username.

## Admin Asset Rebuild Result

No admin asset rebuild was run. The current manifest already points to existing built assets:

- `assets/main-BxHh_ano.js`
- `assets/main-BvJEBEQL.css`

No runtime source, built JS, or built CSS changed in this task.

## Release Folder Path

`release/yaxii-shipping-manager`

## Release Zip Path

`release/yaxii-shipping-manager.zip`

The zip extracts to a single root folder:

- `yaxii-shipping-manager/`

## Top-Level Package Contents

- `admin-app/`
- `assets/`
- `composer.json`
- `data/`
- `languages/`
- `readme.txt`
- `src/`
- `vendor/`
- `yaxii-shipping-manager.php`

`admin-app/` includes source-availability files only:

- `src/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`

`data/` includes normalized runtime datasets under `data/algeria/` only. Raw candidate source material under `data/sources/` is excluded from the final package because it is development provenance material and includes upstream claims that do not match current release copy.

## Required Current Files Verified

- `src/WooCommerce/YaxiiCodCompatibilityDetector.php`: present.
- `assets/admin/manifest.json`: present.
- Current manifest JS `assets/main-BxHh_ano.js`: present.
- Current manifest CSS `assets/main-BvJEBEQL.css`: present.
- `languages/yaxii-shipping-manager.pot`: present.
- Stale asset `main-DSUfFPfk.js`: not referenced by the release manifest.

## Exclusions Verified

Folder and extracted-zip scans found:

- no hidden files
- no Markdown files
- no source maps
- no `node_modules`
- no `.agents`
- no root `docs/`
- no `data/sources/`
- no nested `release/`
- no archive files inside the package
- no `AGENTS.md`
- no `CLAUDE.md`
- no `.gitignore`, `.gitattributes`, or `.distignore`
- no hidden Prettier config or lint-only admin config
- no stale Plugin Check report

## Package Scans Result

Manifest/hash verification passed for both `release/yaxii-shipping-manager` and the extracted zip copy.

Remote asset scan:

- Runtime PHP enqueues only plugin-local URLs built from `YAXII_SHIPPING_MANAGER_URL` and the local admin manifest.
- Built JS contains bundled library namespace/help strings such as `react.dev/errors` and W3C namespace URLs; these are not enqueued remote assets.
- Built CSS contains a Tailwind license comment URL.
- `admin-app/package-lock.json` contains registry/sponsor metadata URLs as source-availability metadata; no runtime remote calls are introduced.

Unsupported-claim scan:

- No `Coming soon`, `Premium`, `Pro`, `Generated successfully`, compatibility-fixed claim, automatic conversion claim, manual-zone adoption claim, license-key claim, or paid-lock claim was found in release source surfaces.
- `CSV` and `ysfSync` appear only as disabled `false` feature flags in bootstrap data.
- Provider, commune-level pricing, telemetry, and analytics matches are negative FAQ/readme statements.
- Built admin bundle still contains `Provider` and `Sync` tokens from compiled source/vendor text, but the active release UI/navigation does not expose unsupported provider import or YSF sync workflows.

## Plugin Check Result or Blocker

Blocked locally.

Attempted command:

```text
wp plugin check "C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager\release\yaxii-shipping-manager" --format=json
```

Result:

```text
Error: Error establishing a database connection.
```

This means the official Plugin Check pass from TASK-013A is no longer sufficient for submission evidence. Rerun Plugin Check on this rebuilt clean package once the local WordPress database is available or on another clean WordPress test site.

## Optional Install Smoke Result or Blocker

Skipped. The local WordPress checkout reports core version `7.0`, but WP-CLI database access fails with `Error establishing a database connection`, so a zip install/activate smoke could not be performed safely in this task.

## What Was Before

The existing `release/` folder and zip were stale. TASK-014G found that the release manifest pointed to `assets/main-DSUfFPfk.js`, while the current runtime manifest pointed to `assets/main-BxHh_ano.js`. The stale package also lacked `src/WooCommerce/YaxiiCodCompatibilityDetector.php`.

## What Changed

- Rebuilt `release/yaxii-shipping-manager`.
- Rebuilt `release/yaxii-shipping-manager.zip`.
- Updated `.distignore` to exclude root `docs/`, raw `data/sources/`, and lint-only admin config.
- Updated `docs/RELEASE-PACKAGING.md` to document the final package policy.
- Updated `docs/WPORG-RELEASE-COPY-SCREENSHOT-AUDIT.md` with this package rebuild note.
- Created this progress report.

## Files Changed

- `.distignore`
- `docs/RELEASE-PACKAGING.md`
- `docs/WPORG-RELEASE-COPY-SCREENSHOT-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014H-rebuild-release-package-plugin-check.md`

Generated but not committed:

- `release/yaxii-shipping-manager/`
- `release/yaxii-shipping-manager.zip`

The release artifacts are ignored by Git and were left untracked/uncommitted by policy.

## Files Created

- `.agents/progress/yaxii-shipping-manager/TASK-014H-rebuild-release-package-plugin-check.md`

## What Was Not Changed

- No runtime PHP behavior changed.
- No React source or built admin asset changed.
- No WooCommerce write behavior changed.
- No `SafeApplyEngine` behavior changed.
- No Generator behavior changed.
- No manual-zone adoption/editing/conversion was added.
- No Yaxii COD bridge or `yaxii_zone_map` write was added.
- No CSV backend, commune-level pricing, provider import, or YSF sync was added.
- No telemetry, licensing, Pro lock, remote asset, external font, or hidden call was added.
- No server deployment was performed.

## What Still Remains Mocked or Not Implemented

- CSV import/export backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Manual-zone adoption/editing/conversion.
- Yaxii COD Theme bridge or checkout compatibility fix.
- Zone-name apply.
- `yaxii_zone_map` writes.
- Pro/licensing/telemetry/remote services.

## Security Notes

- Package-only task.
- No new request handling, REST route, nonce, capability, option write, external call, telemetry, obfuscation, or remote executable asset was introduced.
- Package excludes hidden/dev/harness files and raw candidate source research material.

## WooCommerce Safety Notes

- No WooCommerce zones, methods, registry records, options, or database state changed.
- No server deployment was performed.
- The rebuilt package includes current protected-zone and Yaxii COD Theme detection code but does not alter write behavior.

## WordPress.org Compliance Notes

- Clean package includes `readme.txt`, `languages/`, GPL-compatible header/license metadata, runtime PHP, normalized data, vendor autoloader, admin assets, and source-availability admin app files.
- Clean package excludes `.agents`, root docs, hidden VCS/config files, source maps, `node_modules`, nested release artifacts, screenshots, raw source research, and old Plugin Check reports.
- `Contributors: yaxii` still needs final owner confirmation.
- `Tested up to: 7.0` matches the local WordPress core version reported by WP-CLI, but should be final-owner confirmed before submission.
- Official Plugin Check must still be rerun successfully on this rebuilt package before WordPress.org submission.

## Checks Run

- Current manifest asset existence check.
- Rebuilt release folder and zip.
- Extracted zip root/nesting check.
- Hidden file scan on release folder and extracted zip.
- Markdown file scan on release folder and extracted zip.
- Source map scan on release folder and extracted zip.
- `node_modules` scan on release folder and extracted zip.
- `.agents` scan on release folder and extracted zip.
- Root docs and raw data source folder scan.
- Nested release/archive scan.
- Required current file scan.
- Current manifest/hash verification.
- Remote asset/content scan.
- Telemetry/analytics scan.
- Unsupported claim scan.
- `composer validate --no-check-publish`
- `wp core version`
- Official Plugin Check attempt on clean package.
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Current manifest assets exist: passed.
- Release folder/zip rebuild: passed.
- Zip root check: passed; single `yaxii-shipping-manager/` root.
- Package hygiene scans: passed.
- Required current file checks: passed.
- Manifest stale hash check: passed; no `main-DSUfFPfk.js` reference.
- Remote executable asset scan: passed; no remote asset enqueue path found.
- Unsupported claim scan: passed with expected negative FAQ/disabled-flag matches only.
- Composer validation: passed.
- Local WordPress core version: `7.0`.
- Plugin Check: blocked by local DB connection failure.
- Optional install smoke: skipped because WP-CLI DB access failed.

## Known Risks

- The official Plugin Check result is still missing for the rebuilt package.
- Final WordPress.org contributor username needs owner confirmation.
- Screenshots are planned but not captured yet.
- A final manual browser smoke remains required before submission.
- Existing unrelated dirty files remain in the worktree and were not staged.

## Blockers

WordPress.org submission remains blocked until official Plugin Check passes on the rebuilt clean package and final screenshots/manual smoke are completed.

## Next Recommended Task

Restore or use a clean WordPress test environment where WP-CLI can connect to the database, rerun Plugin Check on `release/yaxii-shipping-manager`, perform a zip install/activate smoke, then capture WordPress.org screenshots.

## Commit Hash, If Committed

Final commit hash is reported in the task closeout.
