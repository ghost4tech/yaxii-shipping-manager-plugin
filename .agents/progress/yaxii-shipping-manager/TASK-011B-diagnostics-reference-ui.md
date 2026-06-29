# TASK-011B - Diagnostics Reference UI

Date: 2026-06-29

## Goal

Replace the noisy Diagnostics page with the prototype health-check style while keeping real diagnostics data and read-only behavior.

## Scope

- Frontend Diagnostics UI extraction and replacement.
- Production admin bundle rebuild.
- Diagnostics integration docs and runtime smoke notes.
- No backend write behavior, new REST route, WooCommerce apply logic, CSV backend, commune pricing, provider import, YSF sync, tracking, licensing, or remote asset work.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/011b-diagnostics-reference-ui`
- TASK-011A commit present locally before work: `d88f2d6`
- Pre-existing dirty files were present before this task, including `AGENTS.md`, `CLAUDE.md`, and older `.agents/progress/yaxii-shipping-manager/*.md` reports. They were not staged for this task.

## Reference Files Used

- `.agents/references/yaxii-shipping-hub-03/src/routes/index.tsx`
- Prototype elements inspected: `DiagnosticsScreen`, `SummaryStat`, `HealthCard`, `CheckoutSim`

## Components Created

- `admin-app/src/components/diagnostics/DiagnosticsPage.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsHealthSummary.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsHealthCard.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsRecommendationCard.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsAdvancedDetails.tsx`
- `admin-app/src/lib/diagnostics/status.ts`

## Files Changed

- `admin-app/src/routes/index.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsPage.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsHealthSummary.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsHealthCard.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsRecommendationCard.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsAdvancedDetails.tsx`
- `admin-app/src/lib/diagnostics/status.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-DBtlEgVn.js`
- `assets/admin/assets/main-CMq5ucQA.css`
- Removed old built assets replaced by Vite: `assets/admin/assets/main-dk2OJ1Ak.js`, `assets/admin/assets/main-C0qe7dLj.css`
- `docs/DIAGNOSTICS-REFERENCE-INTEGRATION-PLAN.md`
- `docs/RUNTIME-SMOKE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-011B-diagnostics-reference-ui.md`

## What Was Before

Diagnostics rendering lived inside `admin-app/src/routes/index.tsx`. The page showed useful backend diagnostics, but the main merchant view exposed repeated wilaya rows, zone internals, raw support data, and a prototype-style checkout simulator.

## What Changed

`routes/index.tsx` now delegates Diagnostics to focused components and only passes diagnostics load state, refresh, and navigation callbacks. The new page uses the prototype health-check shape: overall status, passed/warnings/failures counts, compact health cards, recommended action, and a collapsed support details section.

## Diagnostics Mapping

- WooCommerce status: `woocommerceActive`
- Algeria setup coverage: `summary.configuredWilayas` / `summary.totalWilayas`
- Missing setup: `summary.missingWilayas`
- Conflicts: `summary.duplicateConflictCount`
- Manual/protected zones: `zoneResults` with `ownershipHint === "manual_unknown"` and Algeria matches/overlaps
- Method issues: `zoneResults` method count, disabled methods, and home/office-like method signals
- Checkout fallback risk: `summary.checkoutFallbackRisk`
- Rest-of-world shipping: `summary.restOfWorldHasMethods`
- Recommended action: derived from real diagnostics state in `admin-app/src/lib/diagnostics/status.ts`

## Main UI Behavior

- Shows read-only health-check framing.
- Shows health cards for WooCommerce, setup coverage, missing setup, conflicts, manual/protected zones, method issues, checkout fallback risk, and rest-of-world shipping.
- Does not show full wilaya coverage or raw zone data by default.
- Provides actions for Shipping Zones, Generator, WooCommerce zones, and Refresh.
- Uses soft checkout wording: diagnostics are read-only and do not replace a real checkout test.

## Advanced Details Behavior

Collapsed by default. When opened, it shows generated timestamp, raw warnings, full wilaya coverage, WooCommerce zone list, zone IDs, ownership hints, method counts, disabled method counts, and home/office-like method signals.

## Browser Smoke Result

Authenticated browser smoke passed with temporary administrator users that were deleted after testing.

- Diagnostics opened in `wp-admin`.
- Health-check UI rendered from the rebuilt admin bundle.
- Main view showed real counts: `7` passed, `1` warning, `0` failures.
- Full wilaya table was not visible by default.
- Refresh completed without leaving the health-check view.
- Advanced details opened and showed support data.
- `Open Shipping Zones` navigated to Shipping Zones.
- `Open Generator` navigated to Generator via keyboard activation in agent-browser.
- `Open WooCommerce zones` opened WooCommerce shipping settings in a new tab.
- No WooCommerce write action was performed.

## Runtime Smoke Result

WP-CLI in-process REST smoke for `GET /wp-json/yaxii-shipping-manager/v1/diagnostics` returned:

- `woocommerceActive=true`
- `configuredWilayas=69`
- `missingWilayas=0`
- `duplicateConflictCount=0`
- `zonesWithoutMethods=0`
- `checkoutFallbackRisk=low`

## What Still Remains Mocked

- CSV import/export backend remains not implemented.
- Commune-specific pricing remains not implemented.
- Provider imports remain not implemented.
- YSF sync remains informational/disabled.
- Generator final-step reference replacement remains for the next task.

## Security Notes

- No new REST routes.
- No new state-changing endpoint calls.
- No remote assets, external fonts, tracking, Lovable runtime, or hidden calls were added.
- The WooCommerce zones action opens the existing WooCommerce settings page in a new tab.

## WooCommerce Safety Notes

- Diagnostics remains read-only.
- No WooCommerce write code was added.
- Existing write paths remain limited to the safe preview/apply backend.
- Manual/protected zone data is presented as read-only status.

## WordPress.org Compliance Notes

- No licensing, Pro locks, remote dependencies, tracking, or obfuscated code were added.
- Prototype mock runtime and reference files were not copied into production.
- The UI avoids unsupported checkout-proof claims.

## QA Guard Findings

- `clean-code-guard`: Diagnostics was split out of the large route file; new files are focused and under 300 lines.
- `docs-guard`: Docs were updated to describe implemented behavior only.
- `woo-guard`: No WooCommerce write behavior was introduced.
- `wp-guard`: No new WordPress write path, nonce path, or output surface was added.
- `wp-rest-api`: Existing diagnostics REST contract was reused.
- `wp-plugin-directory-guidelines`: No remote asset, tracking, licensing, or misleading paid screen behavior was introduced.

## Files Over 300 Lines / Maintainability Risks

- `admin-app/src/routes/index.tsx`: reduced by extracting Diagnostics but still around 993 lines. Continue extracting route sections before adding more UI there.
- New diagnostics files are under 300 lines:
  - `status.ts`: 223 staged added lines
  - `DiagnosticsAdvancedDetails.tsx`: 175 staged added lines
  - `DiagnosticsPage.tsx`: 138 staged added lines
  - `DiagnosticsHealthSummary.tsx`: 91 staged added lines
  - `DiagnosticsRecommendationCard.tsx`: 54 staged added lines
  - `DiagnosticsHealthCard.tsx`: 32 staged added lines

## Checks Run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Authenticated browser smoke with `agent-browser`
- WP-CLI in-process REST diagnostics smoke
- Restricted phrase scan
- Raw dataset bundling scan over built JS
- External asset scan
- Source map scan
- WooCommerce write scan
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Typecheck: passed.
- Lint: passed with existing fast-refresh warnings in shared UI files and `main.tsx`.
- Build: passed; Vite emitted `main-DBtlEgVn.js` and `main-CMq5ucQA.css`.
- Browser smoke: passed.
- REST smoke: passed.
- Restricted phrase scan: passed with no matches in production source/assets or changed docs/report.
- No source maps found under `assets/admin`.
- No raw city dataset strings found in built JS.
- No Google Fonts, remote CSS, or remote scripts found in production source/assets.
- Narrowed write-path scan found no apply/preview API calls or WooCommerce write API references in changed Diagnostics files.
- Broad WooCommerce write scan showed only existing backend apply/settings/update modules.

## Known Risks

- Agent-browser pointer clicks did not consistently activate one action button; keyboard activation worked.
- The route file remains large even after Diagnostics extraction.
- The backend still returns an older `recommendedNextAction` string in diagnostics; the frontend now derives merchant-facing recommendation text from real diagnostics state.

## Blockers

None.

## Next Recommended Task

TASK-011C: replace the Generator preview/final step with the audited prototype flow while preserving the real preview/apply backend contract.

## Commit Hash

Pending until the task commit is created.
