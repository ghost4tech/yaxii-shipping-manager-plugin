# TASK-014F - Protected-Zone Copy Cleanup and Deploy

Date: 2026-07-03

## Goal

Clean up release copy so aggregate labels say `Protected zones` when they include multiple protected ownership types, while keeping row-level labels precise for manual, Yaxii COD Theme, external Yaxii, and duplicate zones.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/014f-protected-zone-copy-cleanup`
- Confirmed baseline commits before work:
  - `5579656 TASK-014D: clarify manual WooCommerce zone statuses`
  - `56b0bb3 TASK-014E: audit manual zone support and adoption`
- Pre-existing unrelated dirty files were left untouched and unstaged.
- Commit: included in the final TASK-014F commit; final hash is reported in the task closeout after the deployment report amend.

## Docs/Audits Read

- `docs/MANUAL-ZONE-SUPPORT-ADOPTION-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014E-manual-zone-support-adoption-audit.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014D-prevent-duplicate-generation-external-zone-statuses.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `AGENTS.md`
- `CLAUDE.md`
- Guard instructions read: `clean-code-guard`, `docs-guard`, `woo-guard`, `wp-guard`, `wp-rest-api`, `wp-plugin-directory-guidelines`

## Copy Changes Made

- Changed the Shipping Editor protected filter from `Manual zones` to `Protected`.
- Renamed the Shipping Editor aggregate stats field from `protectedManualZones` to `protectedZones`.
- Kept row statuses precise:
  - `Manual WooCommerce zone`
  - `Created by Yaxii COD Theme`
  - `External Yaxii zone`
  - `Duplicate zone`
- Changed Shipping Editor review, repair, toolbar, and empty-setup aggregate copy to protected-zone wording.
- Changed Generator repair/review/safety aggregate copy to protected-zone wording.
- Changed the active app footer and safety-rule summary to avoid aggregate manual-only wording.
- Changed the diagnostics health label to `Manual zones protected` because that card is manual-only.
- Updated release docs and smoke expectations to match the new wording.

## Shipping Editor Wording Result

- Status card: `Protected zones`.
- Filter: `Protected`.
- Empty setup state: `Manual, theme, and external WooCommerce zones, if any, are protected and will not be edited by Yaxii.`
- Empty setup protected warning: `Protected zones are read-only.`
- Review changes dialog: `Protected zones will not be touched.`
- Repair copy: `Protected zones were not touched.`
- Row-level manual/theme/external/duplicate labels remain unchanged and precise.

## Diagnostics Wording Result

- Manual-only diagnostics health label is `Manual zones protected`.
- Advanced/source details can still show exact manual/theme/external classification.
- No diagnostics copy now uses `Manual zones` as a broad protected aggregate label.

## Generator Wording Result

- Manual-only fresh setup warning remains `Manual WooCommerce zones exist and will be protected.`
- Protected conflict state now uses `Protected zones need review`.
- Repair copy now uses `Protected zones stay read-only`.
- Preview safety copy now uses `Protected zones are read-only`.
- Row-level protected/coverage copy remains precise where available.

## Remaining `manual zones` Strings

Remaining `Manual zones` / `manual zones` strings are intentional:

- `docs/MANUAL-ZONE-SUPPORT-ADOPTION-AUDIT.md`: audit content about ordinary manual WooCommerce zones and future adoption scope.
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`: manual-only compatibility scenarios and prohibited manual-zone edits.
- `docs/RUNTIME-SMOKE.md`: manual-only removal/backend expectations such as `manualZonesProtected` and unchanged manual methods.
- `admin-app/src/data/default-settings.ts`: safety rule label `Never delete manual zones`, tied to the existing settings key.
- `admin-app/src/routes/index.tsx`: removal preview labels `Manual zones protected`, tied to the manual-only removal preview response.
- `admin-app/src/lib/diagnostics/status.ts`: diagnostics health label `Manual zones protected`, because the count is manual-only.

## Local Checks

- `npm run typecheck` in `admin-app`: passed.
- `npm run lint` in `admin-app`: passed with 8 existing Fast Refresh warnings in shared UI/main files.
- `npm run build` in `admin-app`: passed; Vite emitted the existing chunk-size warning and new JS bundle `assets/admin/assets/main-BxHh_ano.js`.
- Source maps under `assets/admin`: none found.
- Restricted phrase scan: no runtime issues; matches were policy/readme/docs references to no telemetry/no analytics.
- External asset scan: no Google Fonts, remote CSS, or remote scripts in runtime paths; matches were `admin-app/components.json` schema URL and npm registry entries in `package-lock.json`.
- WooCommerce write/delete scan: no PHP/runtime write path changed; diff is copy/docs/assets only.
- Theme file changes: none.
- `git diff --check`: passed before deployment and after the deployment report update.
- `git status --short --untracked-files=all`: showed only pre-existing unrelated dirty files after the TASK-014F commit, plus the report update before the final amend.

## Server Backup Path

`/home/u538716307/backups/yaxii-shipping-manager/task-014f-20260703-133317`

## Files Deployed

- Deployed `assets/admin/manifest.json`.
- Deployed `assets/admin/assets/main-BxHh_ano.js`.
- Deployed `assets/admin/assets/main-BvJEBEQL.css`.
- Removed obsolete remote asset `assets/admin/assets/main-CYCE8nS-.js`.
- No PHP, docs, `.agents`, source maps, `admin-app` source files, `node_modules`, reference apps, or theme files were deployed.

## Remote Read-Only Smoke Result

- Remote manifest points to `assets/main-BxHh_ano.js` and `assets/main-BvJEBEQL.css`.
- Remote `assets/admin` source-map scan returned no files.
- WP-CLI plugin check: `plugin_active=yes`.
- Read-only REST diagnostics smoke through WP-CLI:
  - `diagnostics_status=200`
  - `woocommerce_active=yes`
  - `summary_present=yes`
  - `zone_results=127`
- WooCommerce emitted `Undefined array key` warnings while reading Algeria shipping zone state keys. This was observed during read-only diagnostics and no write, generator apply, removal, or database command was run.

## What Was Not Changed

- No manual-zone adoption, editing, conversion, merge, delete, or repair workflow was added.
- No WooCommerce write behavior changed.
- No `SafeApplyEngine` behavior changed.
- No Generator apply behavior changed.
- No `yaxii_zone_map` write path was added.
- No Yaxii COD Theme files were changed.
- No provider import, YSF sync, CSV backend, commune pricing, telemetry, licensing, Pro locks, remote assets, external fonts, or hidden calls were added.
- No PHP files changed.

## QA Guard Findings

- Clean-code/docs guards: changes are narrowly scoped to copy naming and related docs.
- Woo/WP/REST guards: no WooCommerce, WordPress REST, or PHP write-path changes were made.
- WordPress.org guard: no external assets, telemetry, licensing, remote dependency, or hidden service behavior was added.

## Risks

- Browser login was not used during local QA, so visual confirmation still needs a manual admin check.
- Remote `assets/admin/assets` contains older historical built assets from previous deployments; the manifest points only to the TASK-014F built files.
- Existing Fast Refresh lint warnings remain outside this task scope.
- Existing unrelated dirty files remain in the worktree and were not staged.

## Next Recommended Task

TASK-014G: WordPress.org release copy/readme and screenshot readiness audit, including manual browser confirmation of the protected-zone wording on the deployed admin screen.
