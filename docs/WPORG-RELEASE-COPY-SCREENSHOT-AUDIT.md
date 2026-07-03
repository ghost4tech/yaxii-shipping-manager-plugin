# WordPress.org Release Copy, Screenshot, and Submission Readiness Audit

Date: 2026-07-03

Status: Audit and readme copy update only. No product code, runtime assets, WooCommerce data, server files, or Yaxii COD Theme files were changed.

## Goal

Audit WordPress.org release copy, `readme.txt`, screenshot readiness, and submission readiness after the latest protected-zone and Yaxii COD Theme compatibility changes.

## Scope

Included:

- `readme.txt` accuracy audit and small copy update.
- Admin UI source and built runtime string scan.
- Screenshot plan for WordPress.org assets.
- Manual browser verification checklist.
- Clean package and submission readiness review.

Excluded:

- Product/runtime changes.
- WooCommerce write behavior changes.
- `SafeApplyEngine` changes.
- Generator apply behavior changes.
- Manual-zone adoption/editing/conversion.
- Yaxii COD bridge or `yaxii_zone_map` writes.
- CSV backend, commune-level pricing, provider imports, YSF sync, telemetry, licensing, Pro locks, remote assets, or hidden calls.
- Server deployment, because no runtime files changed.

## Docs and Audits Read

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

## Readme Accuracy Findings

Verdict: publish after the copy update in this task, then rerun package validation and Plugin Check on a rebuilt release package.

Safe:

- The readme does not claim CSV import/export backend support.
- It does not claim commune-level pricing.
- It does not claim provider imports are active.
- It does not claim YSF sync.
- It does not claim manual-zone adoption, editing, conversion, or automatic migration.
- It does not claim zone-name updates are applied.
- It does not introduce Pro, licensing, paid locks, telemetry, analytics, or remote-service dependency claims.
- `Stable tag: 1.0.0` matches the plugin header `Version: 1.0.0`.
- `Requires PHP: 7.4` matches `composer.json` `php >=7.4`.
- Tags are five or fewer and relevant: WooCommerce, shipping, Algeria, COD, shipping zones.
- The FAQ now explicitly says Yaxii COD Theme zones are detected only as protected/read-only and are not converted or proof that checkout compatibility is fixed.

Needs verification before submission:

- `Contributors: yaxii` must be confirmed against the actual WordPress.org username.
- `Tested up to: 7.0` is a future/high value relative to the current release context and should be confirmed against the actual tested WordPress version before submission.
- Screenshots are listed in the readme, but image files do not exist yet.

Changed in this task:

- Replaced narrow "protected manual zones" wording with protected-zone wording.
- Added Yaxii COD Theme read-only detection/conversion boundary.
- Updated screenshot captions to match the recommended MVP screenshot plan.
- Updated the changelog line to include read-only protected-zone detection.

## UI Copy Findings

Safe:

- No visible `Coming soon`, `Pro`, or `Premium` release-facing claim was found in `admin-app/src`.
- No unsupported `Generated successfully` claim was found.
- `CSV` appears only in disabled/internal setup-path metadata: `Import CSV` with `Backend import is not connected yet.` The current top navigation does not expose Import/Export.
- `provider` and `sync` matches are mostly type/function names or docs, not active admin navigation claims.
- `locked` appears as internal control state for generator method definitions and protected coverage, not paid locking.
- `Manual zones protected` remains intentional in the removal tool and diagnostics where the backend data is manual-zone specific.
- `Checkout compatibility warning` and `Yaxii COD Theme checkout may not use these new zones until a compatibility bridge exists` are safe because they warn instead of claiming compatibility is fixed.
- Existing zone-name copy says zone names are protected or not changed in this release.

Needs copy change:

- `readme.txt` needed the protected-zone/Yaxii COD boundary update made in this task.

Defer:

- The admin source still contains disabled setup-path metadata for CSV import. It is not visible in the current release navigation, and the description says the backend is not connected. Leave runtime untouched in this audit; revisit only if screenshot or manual UI review surfaces it.
- Some backend response strings still say `Manual zones were not touched` for managed method update results. That is true for manual zones but narrower than the broad protected-zone vocabulary. It is not a release blocker because it does not claim unsafe behavior. Consider a future tiny copy cleanup if browser screenshots expose it in a broad protected-zone context.

## Screenshot Plan

WordPress.org screenshots should show real MVP workflows only. Do not use broken duplicate states, debug details, source-map/dev UI, unsupported CSV/provider/sync surfaces, or scary warnings as the first impression.

Recommended screenshots:

1. `screenshot-1.png`
   - Caption: Shipping Editor with Yaxii-managed zones, live prices, method status controls, and protected-zone labels.
   - Page/state: Shipping Editor with active managed rows and at least one protected row if the label is visually clean.
   - Data setup: managed Algeria setup present; optional protected manual/theme/external row visible but not expanded into technical details.

2. `screenshot-2.png`
   - Caption: Generator setup flow for selecting Algeria coverage and previewing supported WooCommerce changes.
   - Page/state: Generator Coverage or Preview step.
   - Data setup: use safe missing/non-overlapping wilayas; avoid states that show only blocked work.

3. `screenshot-3.png`
   - Caption: Diagnostics health cards showing WooCommerce readiness, protected zones, and compatibility risks.
   - Page/state: Diagnostics main health cards, advanced details collapsed.
   - Data setup: WooCommerce active; if using Yaxii COD Theme compatibility warnings, keep the warning clear and non-alarming.

4. `screenshot-4.png`
   - Caption: Settings page with simplified preferences, always-on safety rules, and advanced managed setup tools.
   - Page/state: Settings with General, Safety rules are always on, and Advanced tools visible.
   - Data setup: valid settings; no `Settings normalized`, loading, or repaired notices visible.

5. `screenshot-5.png`
   - Caption: Remove Yaxii setup confirmation showing only verified Yaxii-managed removal candidates and protected manual zones.
   - Page/state: Remove Yaxii setup modal.
   - Data setup: Yaxii-managed setup exists; modal has no blockers and copy clearly says manual zones are protected.

Avoid:

- Duplicate conflict screens unless intentionally documenting compatibility risk.
- Unsupported CSV/provider/sync screens.
- Commune-specific pricing views.
- Internal IDs/hashes except inside deliberately collapsed support details, which should not be the screenshot focus.
- Browser console, debug UI, or source-map/dev overlays.
- First-run warning states that imply a broken install.

## Manual Browser Verification Checklist

Use an authenticated administrator session.

1. Open `wp-admin/admin.php?page=yaxii-wc-shipping-manager`.
2. Confirm no `Settings normalized`, loading, or repaired notices appear on normal valid settings.
3. Open Shipping Editor and confirm aggregate labels use `Protected zones` or `Protected`.
4. Confirm row labels remain precise when applicable:
   - `Manual WooCommerce zone`
   - `Created by Yaxii COD Theme`
   - `External Yaxii zone`
   - `Duplicate zone`
5. Confirm protected rows are read-only and route only to Diagnostics or WooCommerce zones.
6. Open Generator and confirm duplicate creation is prevented over Yaxii COD Theme/external covered wilayas.
7. Confirm Diagnostics shows compatibility cards only when real compatibility findings exist.
8. Confirm Settings is simplified and shows safety rules as always on.
9. Confirm no unsupported CSV/provider/sync/commune pricing UI is visible in the normal screenshot path.
10. Confirm the browser console has no page errors.
11. Capture only screenshots whose visible copy matches the readme claims.

## WordPress.org Submission Readiness Findings

Ready:

- `readme.txt` exists and now matches current protected-zone scope.
- `languages/` exists.
- Main plugin header has GPL-compatible license headers.
- No hidden telemetry, analytics, licensing, Pro locks, remote scripts, remote styles, external fonts, or hidden Yaxii API claims were introduced.
- `.distignore` excludes `.agents`, hidden VCS files, root harness docs, `node_modules`, source maps, local logs, archives, and the `release/` folder.
- `docs/RELEASE-PACKAGING.md` still describes the clean package strategy and warns to run Plugin Check against the extracted clean package, not the development folder.

Not ready:

- Existing `release/yaxii-shipping-manager` and `release/yaxii-shipping-manager.zip` are stale. The release manifest points to `assets/main-DSUfFPfk.js`, while current runtime manifest points to `assets/main-BxHh_ano.js`.
- The release folder inspected in this task does not include the latest runtime compatibility additions from TASK-014C through TASK-014F, so it must not be submitted.
- No screenshots folder/images are present.
- TASK-013A Plugin Check pass proves the clean-package strategy, but it is stale after TASK-014C, TASK-014D, TASK-014F, and this readme update. A fresh clean package and Plugin Check rerun are required.
- Admin source inclusion policy remains a final release decision: the current docs keep `admin-app/` source package-eligible for built asset source availability while excluding hidden config and `node_modules`.

Recommended next sequence:

1. Rebuild the clean release folder/zip from current HEAD and `.distignore`.
2. Rerun official Plugin Check on the extracted clean package.
3. Run package scans for hidden files, source maps, `node_modules`, unwanted archives, and remote assets.
4. Perform the manual browser checklist above.
5. Capture final screenshots and place them in the WordPress.org SVN assets workflow.
6. Prepare SVN submission only after readme, screenshots, package, and Plugin Check all agree.

## Guard Findings

- `docs-guard`: readme claims were checked against implementation/docs; unsupported features are explicitly not claimed.
- `wp-plugin-directory-guidelines`: no trialware, telemetry, remote executable assets, forced links, or readme spam were introduced. Confirm contributor username and final tested-up-to value before submission.
- `wp-guard`: no PHP/runtime code changed. Existing plugin header remains GPL-compatible and version-aligned.
- `woo-guard`: no WooCommerce write behavior changed. Readme describes managed-registry-only writes and protected foreign/manual zones.
- `clean-code-guard`: no product code was generated; the documentation change is narrow and avoids invented behavior.

## What Was Not Changed

- No runtime PHP, TypeScript, CSS, or built admin asset was changed.
- No WooCommerce zone, method, option, or database state was changed.
- No server deployment was performed.
- No Yaxii COD Theme file was modified.
- No packaging archive was rebuilt in this audit.

## Risks

- Browser/session issues in prior tasks mean final screenshot verification should be manual unless a reliable authenticated browser session is available.
- Current release package artifacts are stale and could mislead submission if reused.
- `Tested up to: 7.0` must be confirmed before submission.
- The actual WordPress.org contributor username must be confirmed.

## Next Recommended Task

TASK-014H: rebuild the release package from current HEAD, rerun Plugin Check on the clean package, and run final package hygiene scans. After that, capture WordPress.org screenshots from the verified admin UI.

## TASK-014H Package Rebuild Note

TASK-014H rebuilt `release/yaxii-shipping-manager` and `release/yaxii-shipping-manager.zip` from current HEAD. The rebuilt package uses the current admin manifest (`assets/main-BxHh_ano.js` and `assets/main-BvJEBEQL.css`), includes `src/WooCommerce/YaxiiCodCompatibilityDetector.php`, excludes root `docs/`, `.agents`, raw `data/sources/`, source maps, `node_modules`, nested release artifacts, and hidden/dev config, and extracts with a single `yaxii-shipping-manager/` zip root.

Plugin Check was attempted against the clean package, but local WP-CLI could not connect to the WordPress database. Run official Plugin Check again once the local WordPress database is available or on a known-good clean test site before WordPress.org submission.

## TASK-014I Final Prep Note

TASK-014I changed only the WordPress admin page/menu slug from `yaxii-shipping-manager` to `yaxii-wc-shipping-manager` after local Yaxii Smart Form source confirmed its Shipping Manager uses `admin.php?page=yaxii-shipping-manager`. The WordPress.org plugin slug, text domain, REST namespace, option names, database keys, and asset handles were not changed. Use `wp-admin/admin.php?page=yaxii-wc-shipping-manager` for final screenshots and manual Plugin Check browser smoke.
