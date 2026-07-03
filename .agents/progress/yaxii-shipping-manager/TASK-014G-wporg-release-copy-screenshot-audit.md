# TASK-014G - WordPress.org Release Copy, Screenshot, and Submission Readiness Audit

Date: 2026-07-03

## Goal

Audit WordPress.org release copy, `readme.txt`, screenshot readiness, and submission readiness after the latest protected-zone and Yaxii COD Theme compatibility changes.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git repository: yes, root is the plugin root.
- Starting branch: `task/014f-protected-zone-copy-cleanup`
- Task branch: `task/014g-wporg-release-copy-screenshot-audit`
- TASK-013A commit `b1e7f4c` exists locally.
- TASK-014F commit `adc7698` exists locally.
- No nested `app/.git` repository was found.
- Pre-existing unrelated dirty files were present before this task and were not staged.

## Scope

Included:

- Read required release/progress docs first.
- Audit `readme.txt` against current implemented behavior.
- Scan admin UI source and built runtime strings for unsupported release claims.
- Inspect plugin header, `.distignore`, screenshots availability, and release package artifacts.
- Create `docs/WPORG-RELEASE-COPY-SCREENSHOT-AUDIT.md`.
- Make a small `readme.txt` copy correction needed by the audit.

Excluded:

- Product/runtime changes.
- WooCommerce write behavior changes.
- `SafeApplyEngine` changes.
- Generator apply behavior changes.
- Manual-zone adoption/editing/conversion.
- Yaxii COD bridge or `yaxii_zone_map` writes.
- CSV backend, commune-level pricing, provider imports, YSF sync, telemetry, licensing, Pro locks, remote assets, or hidden calls.
- Server deployment, because no runtime files changed.

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
- `docs/RELEASE-PACKAGING.md`
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `docs/MANUAL-ZONE-SUPPORT-ADOPTION-AUDIT.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/RUNTIME-SMOKE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-013A-plugin-check-release-hygiene.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014C-yaxii-cod-readonly-compat-diagnostics.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014D-prevent-duplicate-generation-external-zone-statuses.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014E-manual-zone-support-adoption-audit.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014F-protected-zone-copy-cleanup.md`

## Files Inspected

- `readme.txt`
- `yaxii-shipping-manager.php`
- `.distignore`
- `docs/RELEASE-PACKAGING.md`
- `admin-app/src`
- `assets/admin`
- `release/`
- `src/WooCommerce/YaxiiCodCompatibilityDetector.php`
- `src/Preview/PreviewPlanner.php`
- `src/Apply/SafeApplyEngine.php`
- `src/Tools/ManagedSetupRemovalExecutor.php`

## Files Changed

- `readme.txt`
- `docs/WPORG-RELEASE-COPY-SCREENSHOT-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014G-wporg-release-copy-screenshot-audit.md`

## Files Created

- `docs/WPORG-RELEASE-COPY-SCREENSHOT-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014G-wporg-release-copy-screenshot-audit.md`

## What Was Before

`readme.txt` was conservative, but it still described protected behavior mainly as manual-zone protection and did not explicitly document the current Yaxii COD Theme/external protected-zone detection boundary. Screenshot captions were generic and did not match the final recommended WordPress.org screenshot set.

The `release/` folder and zip existed, but their admin manifest pointed to older built assets and the folder was stale relative to TASK-014C through TASK-014F.

## What Changed

- Updated `readme.txt` to say protected zones rather than protected manual zones in broad release copy.
- Added a readme bullet for Yaxii COD Theme zone detection that avoids duplicate covered wilayas.
- Added FAQ copy saying Yaxii COD Theme zones are detected as protected/read-only and are not converted, adopted, deleted, or proof that checkout compatibility is fixed.
- Updated readme screenshot captions to five concrete MVP screenshot candidates.
- Added an audit document with readme findings, UI copy findings, screenshot plan, manual browser checklist, WordPress.org readiness findings, and next-task recommendation.

## Readme Accuracy Findings

Safe:

- No CSV backend, commune-level pricing, provider imports, YSF sync, manual-zone adoption/editing, automatic conversion/migration, zone-name apply, Pro/licensing, telemetry, analytics, or remote-service claims remain.
- `Stable tag: 0.1.0` matches plugin header `Version: 0.1.0`.
- `Requires PHP: 7.4` matches Composer requirement `php >=7.4`.
- Tags are relevant and five or fewer.

Needs verification before submission:

- Confirm `Contributors: yaxii` is the real WordPress.org username.
- Confirm `Tested up to: 7.0` against the actual tested WordPress version before submission.
- Screenshot image files still need to be captured and prepared.

## UI Copy Findings

Safe:

- No visible `Coming soon`, `Pro`, `Premium`, unsupported `Generated successfully`, or full compatibility-fixed claim was found in `admin-app/src`.
- `CSV` appears only in disabled/internal setup-path metadata with copy saying the backend is not connected yet; the current top navigation does not expose it.
- `locked` appears as internal control/protected selection state, not paid locking.
- `Manual zones protected` remains intentional in removal/diagnostics surfaces where the backend data is manual-zone specific.
- Yaxii COD Theme copy warns that checkout may not use new zones until a bridge exists.

Needs copy change:

- `readme.txt` needed the protected-zone/Yaxii COD boundary update made in this task.

Defer:

- Backend response strings that say `Manual zones were not touched` are true but narrower than the broad protected-zone vocabulary. No runtime change was made in this audit.

## Screenshot Plan

Recommended WordPress.org screenshots:

1. `screenshot-1.png` - Shipping Editor with Yaxii-managed zones, live prices, method status controls, and protected-zone labels.
2. `screenshot-2.png` - Generator setup flow for selecting Algeria coverage and previewing supported WooCommerce changes.
3. `screenshot-3.png` - Diagnostics health cards showing WooCommerce readiness, protected zones, and compatibility risks.
4. `screenshot-4.png` - Settings page with simplified preferences, always-on safety rules, and advanced managed setup tools.
5. `screenshot-5.png` - Remove Yaxii setup confirmation showing only verified Yaxii-managed removal candidates and protected manual zones.

Data setup:

- Use a real Yaxii-managed setup for Shipping Editor and Settings.
- Use safe missing/non-overlapping wilayas for Generator.
- Use Diagnostics with advanced details collapsed.
- Use the remove modal only when it has clear copy and no scary blocker state.
- Avoid unsupported CSV/provider/sync/commune pricing surfaces, technical hashes, debug details, and broken duplicate-only states.

## Manual Browser Verification Checklist

1. Open `wp-admin/admin.php?page=yaxii-shipping-manager`.
2. Confirm no `Settings normalized`, loading, or repaired notices appear on normal valid settings.
3. Confirm Shipping Editor aggregate labels use `Protected zones` or `Protected`.
4. Confirm row labels remain precise: `Manual WooCommerce zone`, `Created by Yaxii COD Theme`, `External Yaxii zone`, and `Duplicate zone`.
5. Confirm protected rows are read-only and route only to Diagnostics or WooCommerce zones.
6. Confirm Generator prevents duplicate creation over Yaxii COD Theme/external covered wilayas.
7. Confirm Diagnostics shows compatibility cards only when real compatibility findings exist.
8. Confirm Settings is simplified and safety rules are always on.
9. Confirm no unsupported CSV/provider/sync/commune pricing UI is visible in the screenshot path.
10. Confirm no browser console errors.
11. Confirm screenshots chosen match readme claims.

## WordPress.org Submission Readiness Findings

Ready:

- `readme.txt` exists and now matches current protected-zone scope.
- `languages/` exists.
- Main plugin header has GPL-compatible license headers.
- `.distignore` excludes development/harness files, archives, source maps, `node_modules`, hidden VCS files, and the stale `release/` folder.
- No telemetry, analytics, licensing, remote assets, Pro locks, or hidden calls were added.

Not ready:

- Existing `release/yaxii-shipping-manager` and `release/yaxii-shipping-manager.zip` are stale and must not be submitted.
- Current runtime manifest points to `assets/main-BxHh_ano.js`; stale release manifest points to `assets/main-DSUfFPfk.js`.
- No screenshot files are present.
- TASK-013A Plugin Check pass is useful historical proof of the package strategy, but it is stale after later runtime/readme changes.
- A fresh package rebuild and Plugin Check rerun are required before submission.

## Recommended Fixes Before Package Rebuild

- Confirm the actual WordPress.org contributor username.
- Confirm the real tested WordPress version before finalizing `Tested up to`.
- Capture screenshots after manual browser verification.
- Rebuild the release folder/zip from current HEAD, not the existing stale `release/` artifacts.
- Rerun Plugin Check on the clean extracted package.

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

- Documentation/readme/report-only task.
- No new REST routes, request handling, nonces, capabilities, option writes, external calls, telemetry, licensing, obfuscation, or remote assets were added.

## WooCommerce Safety Notes

- No WooCommerce zones, methods, settings, registry records, or `yaxii_zone_map` values were changed.
- The audit keeps current registry-owned-only apply behavior as the release policy.
- Protected manual/theme/external/duplicate rows remain read-only.

## WordPress.org Compliance Notes

- Readme avoids unsupported feature claims and no trialware/Pro positioning was introduced.
- GPL header and license URI remain present.
- Clean-package strategy remains correct, but package artifacts must be rebuilt.
- Screenshots are not ready.

## Checks Run

- `rg` copy scans across `admin-app/src`, `assets/admin`, `readme.txt`, `docs`, and release/package surfaces.
- Current vs release `assets/admin/manifest.json` comparison.
- Release folder file inspection.
- `git diff --check`
- `git diff --cached --check`
- `git status --short --untracked-files=all`
- Readme validation via Plugin Check if available.

## Check Results

- Readme/header static validation passed: `Stable tag: 0.1.0` matches plugin header `Version: 0.1.0`; readme `Requires PHP: 7.4` is compatible with Composer `php >=7.4`.
- Readme/admin source risky visible-copy scan passed with no matches for `Coming soon`, `Pro`, `Premium`, unsupported generated-success copy, unsupported CSV success copy, commune-level availability, provider availability, YSF sync availability, or compatibility-fixed wording.
- Current vs release manifest comparison confirmed the existing release artifact is stale: current runtime manifest uses `assets/main-BxHh_ano.js`; release manifest uses `assets/main-DSUfFPfk.js`.
- Release folder inspection confirmed `release/yaxii-shipping-manager/src/WooCommerce/YaxiiCodCompatibilityDetector.php` is missing, so the release package predates current compatibility detection.
- Source-map scan under `assets/admin` returned no `.map` files.
- `git diff --check`: passed. Git printed line-ending warnings for pre-existing unrelated dirty files.
- Readme validation via Plugin Check was unavailable locally: WP-CLI reported `Error establishing a database connection`, and `plugin check` was not a registered `wp plugin` subcommand in this checkout.
- Build/typecheck/lint were not run because no runtime PHP, TypeScript, CSS, or built admin assets changed.

## Known Risks

- Manual browser verification and screenshot capture remain required because prior browser automation had login/session issues.
- Existing `release/` artifacts are stale and could be accidentally submitted if not rebuilt.
- `Tested up to: 7.0` and `Contributors: yaxii` require final owner confirmation.
- Existing unrelated dirty files remain in the worktree and were not staged.

## Blockers

None for the audit. Submission is blocked until package rebuild, Plugin Check rerun, manual browser verification, and screenshot capture are complete.

## Next Recommended Task

TASK-014H: rebuild the release package from current HEAD, rerun Plugin Check on the clean package, run final package hygiene scans, then capture WordPress.org screenshots from the verified admin UI.

## Commit Hash, If Committed

Initial commit before adding this hash to the report: `086a7bf`.

Final amended commit hash is reported in the task closeout because amending this report changes the commit hash.
