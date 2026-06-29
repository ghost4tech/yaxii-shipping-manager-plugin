# TASK-011C - Generator Preview Reference UI

Date: 2026-06-29

## Goal

Replace the Generator preview/final-step presentation with the older prototype preview-plan UI shape while preserving the real `fetchPreview` and `fetchApply` backend behavior.

## Scope

- Frontend presentation and component extraction for the Generator final preview step.
- No new REST routes.
- No SafeApplyEngine behavior changes.
- No direct WooCommerce write path.
- No reference app runtime files staged.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/011c-generator-preview-reference-ui`
- TASK-011B local checkpoint confirmed before implementation: `bc2b609`
- Pre-existing dirty files were present before this task and left unstaged: `AGENTS.md`, `CLAUDE.md`, and older `.agents/progress/yaxii-shipping-manager/*.md` reports.

## Reference Files Used

- `.agents/references/yaxii-shipping-hub-03/src/routes/index.tsx`
- Prototype sections inspected: `WStepPreview`, `PreviewGroup`, `ReadinessBadge`, disabled `WStepApply`

## Files Changed

- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/components/generator/PreviewPlanPanel.tsx`
- `admin-app/src/components/generator/types.ts`
- `admin-app/src/lib/shipping-zones/preview-request.ts`
- `docs/GENERATOR-PREVIEW-REFERENCE-INTEGRATION-PLAN.md`
- `docs/RUNTIME-SMOKE.md`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-9fq96lar.css`
- `assets/admin/assets/main-BQA6mz3A.js`

## Files Created

- `admin-app/src/components/generator/GeneratorFinalStep.tsx`
- `admin-app/src/components/generator/GeneratorPreviewSummary.tsx`
- `admin-app/src/components/generator/GeneratorPreviewGroups.tsx`
- `admin-app/src/components/generator/GeneratorPreviewSample.tsx`
- `admin-app/src/components/generator/GeneratorApplyActionCard.tsx`
- `admin-app/src/components/generator/GeneratorApplyResult.tsx`
- `admin-app/src/components/generator/GeneratorAdvancedDetails.tsx`
- `admin-app/src/lib/generator/preview-summary.ts`
- `admin-app/src/lib/generator/apply-summary.ts`
- `admin-app/src/lib/generator/preview-plan-item.ts`
- `.agents/progress/yaxii-shipping-manager/TASK-011C-generator-preview-reference-ui.md`

## What Was Before

`PreviewPlanPanel.tsx` was a 903-line component that mixed summary rendering, preview groups, affected rows, apply behavior, apply result rendering, advanced details, and helper logic. The main final step was accurate but too technical and did not match the audited prototype preview-plan presentation.

## What Changed

- Replaced the old panel with `GeneratorFinalStep` plus focused child components.
- Kept `PreviewPlanPanel.tsx` as a two-line compatibility export.
- Added prototype-style `Preview plan` header, readiness badge, top stat tiles, preview group cards, sample cards, safety copy, review checkbox, and collapsed advanced details.
- Added a real apply action card instead of copying the prototype's disabled apply card.
- Added compact real `ApplyResponse` result rendering.
- Added `methodStatuses` to wizard preview requests so the frontend matches the backend preview contract.
- Added `regionFormatLabel` to preview context for final-step summary display.

## Real Data Mapping

- Readiness badge: `response.applyReadiness.severity`, title, and message.
- Selected wilayas: `response.summary.selectedWilayas`.
- Enabled methods: generator context enabled method labels.
- Region format: generator context `regionFormatLabel`.
- Coverage: generator context commune coverage summary.
- Preview groups: `response.summary` and `response.plan`.
- Preview samples: first create/add/update/status/skip/conflict items from real plan groups.
- Apply gating: `response.canApplyLater`, supported work count, conflict count, and readiness severity.
- Advanced details: preview hash, contract version, generated timestamp, raw group counts, warnings, support rows, zone IDs, method keys, and ownership hints.

## Apply Behavior

- Apply still calls `fetchApply`.
- Apply still sends preview hash, preview generated timestamp, selected wilayas, accepted plan summary, confirmation phrase, safety policy snapshot, contract version, and original preview request.
- The backend still revalidates before writing.
- Manual zones remain protected.
- Conflicts still block apply.
- Preview-only mode hides apply controls in the active wizard.
- No apply action was triggered during TASK-011C smoke.

## Advanced Details Behavior

- Collapsed by default.
- Main UI hides preview hash, contract version, generated timestamp, zone IDs, method keys, ownership-source codes, and raw plan arrays.
- Keyboard activation opened advanced details during browser smoke and exposed support-only data.

## Browser Smoke Result

Passed.

- Authenticated into `wp-admin` with a temporary administrator user and deleted that user after smoke.
- Opened Generator and reached the final preview step through the real wizard.
- Confirmed the reference-style `Preview plan` UI rendered from real preview data.
- Confirmed top stat tiles and preview group cards rendered.
- Confirmed advanced details were collapsed by default and opened for support data.
- Confirmed preview-only mode showed the preview-plan UI and hid active apply controls.
- Confirmed browser page errors were empty; console only showed normal WordPress jQuery Migrate logs.
- No WooCommerce write action was triggered.

## Runtime Smoke Result

Passed.

In-process REST smoke called `POST /wp-json/yaxii-shipping-manager/v1/preview` with an administrator nonce and returned:

```json
{"status":200,"userId":1,"selectedWilayas":69,"createZones":0,"addMethods":0,"updateMethods":0,"updateMethodStatuses":0,"conflicts":0,"readiness":"ready","hashValid":true,"contract":"apply-contract-v1"}
```

## What Still Remains Mocked

- CSV backend remains unimplemented.
- Commune-specific pricing remains unimplemented.
- Provider imports remain unimplemented.
- YSF sync remains disabled/out of scope.
- Zone-name updates remain preview-only/later-step work.
- No reset/wipe tooling was added.

## Security Notes

- No new network calls.
- No external assets.
- No hidden tracking.
- No new REST endpoint.
- No nonce or capability policy changes.
- Technical preview/apply contract fields are visible only in collapsed advanced details.

## WooCommerce Safety Notes

- No PHP WooCommerce write code was changed.
- Apply remains behind preview/apply and SafeApplyEngine.
- No delete behavior was added.
- No manual-zone adoption was added.
- No direct frontend WooCommerce write path was added.

## WordPress.org Compliance Notes

- No external fonts, scripts, styles, or remote runtime dependencies were added.
- No reference app runtime, `.lovable`, nested `.git`, mock data, or prototype shell files were staged.
- No paid locks, licensing, provider dispatch, or hidden calls were added.

## QA Guard Findings

- `clean-code-guard`: component extraction reduced the old 903-line panel into focused files; new files stay near or below the 300-line rule.
- `docs-guard`: docs updated to describe implemented behavior only.
- `woo-guard`: no new WooCommerce write paths; existing writes remain in SafeApplyEngine.
- `wp-guard`: no PHP/REST permission changes.
- `wp-rest-api`: no new routes; existing preview/apply clients preserved.
- `wp-plugin-directory-guidelines`: no remote dependency, tracking, or misleading paid feature added.

## Checks Run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Browser admin smoke with `agent-browser`
- In-process REST preview smoke with `wp eval-file -`
- Source-map scan under `assets/admin`
- Restricted phrase scan
- Raw dataset bundling scan over built JS
- External asset scan
- WooCommerce write scan
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- `npm run typecheck`: passed.
- `npm run lint`: passed with 8 existing fast-refresh warnings in shared UI/main files.
- `npm run build`: passed; emitted `assets/admin/assets/main-9fq96lar.css` and `assets/admin/assets/main-CLJ1_iTy.js`.
- Browser admin smoke: passed.
- Runtime REST preview smoke: passed.
- Source-map scan under `assets/admin`: no `.map` files found.
- Restricted phrase scan over admin source, built assets, updated docs, and TASK-011C report: no matches.
- Raw dataset bundling scan over built JS: no matches.
- External asset scan over admin source, built assets, and PHP source: no matches.
- WooCommerce write scan: no new WooCommerce write code in changed frontend files; existing PHP write locations remain limited to the established SafeApplyEngine/settings registry paths.
- Unsupported prototype wording scan over changed generator UI/build paths: no `69 wilayas` or `58 or 69` matches.
- `git diff --check`: passed.
- `git status --short --untracked-files=all`: showed task-scoped changes plus pre-existing dirty `AGENTS.md`, `CLAUDE.md`, and older progress reports; only task-scoped files will be staged.

## Maintainability Notes

- `PreviewPlanPanel.tsx`: reduced from 903 lines to a thin export.
- New component/helper sizes after split:
  - `GeneratorAdvancedDetails.tsx`: 110 lines
  - `GeneratorApplyActionCard.tsx`: 133 lines
  - `GeneratorApplyResult.tsx`: 121 lines
  - `GeneratorFinalStep.tsx`: 110 lines
  - `GeneratorPreviewGroups.tsx`: 87 lines
  - `GeneratorPreviewSample.tsx`: 78 lines
  - `GeneratorPreviewSummary.tsx`: 117 lines
  - `preview-summary.ts`: 281 lines
- Existing large-file risks remain:
  - `GeneratorWizard.tsx`: 1751 lines
  - `admin-app/src/routes/index.tsx`: 993 lines

## Risks

- The wider generator wizard remains a large component and should not continue growing.
- Browser body text includes both underlying generator page text and the active wizard/modal text, so future smoke should prefer active wizard headings and controls when verifying preview-only behavior.
- The local store currently had a no-create/no-add preview path; apply was not run in this task because no write was needed for UI replacement verification.

## Blockers

None.

## Next Recommended Task

TASK-011D: audit and reduce remaining GeneratorWizard route/orchestration size, especially duplicated background/modal rendering and mode-step flow clarity.

## Commit Hash

Pending.
