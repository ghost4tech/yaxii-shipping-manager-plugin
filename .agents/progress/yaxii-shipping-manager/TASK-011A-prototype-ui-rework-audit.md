# TASK-011A - Prototype UI Rework Audit

Date: 2026-06-29

## Goal

Audit the latest old prototype reference and plan how to replace the current Diagnostics page and Generator preview/final step with better reference UI patterns without implementing the replacement yet.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git root: `C:/Users/Aymen/Local Sites/yaxii-ysz/app/public/wp-content/plugins/yaxii-shipping-manager`
- Starting branch: `task/010i-polish-shipping-zone-controls`
- Working branch: `task/011a-prototype-ui-rework-audit`
- Starting status: clean
- Recent branch graph showed `TASK-010I` at `37dc39e`, with `TASK-010H` and `TASK-010G` immediately behind it.
- Latest approved work present locally: yes. TASK-010I, TASK-010H, TASK-010G, and earlier TASK-010 reports are present under `.agents/progress/yaxii-shipping-manager/`.
- Nested `app/.git`: not present.
- `.agents/skills/`: missing.
- `.agents/skills/`: present and used for the requested guards.

## Reference path inspected

```text
.agents/references/yaxii-shipping-hub-03
```

This was the newest folder under `.agents/references/` and contains the relevant Diagnostics and Generator preview/final-step UI in:

```text
.agents/references/yaxii-shipping-hub-03/src/routes/index.tsx
```

## Scope

Audit and planning only.

No product UI, backend write behavior, WooCommerce write logic, REST route, CSV backend, commune pricing, provider import, YSF sync, reset/wipe tooling, build artifact, or reference app folder was changed.

## Files changed

- `docs/PROTOTYPE-UI-REWORK-AUDIT.md`
- `docs/DIAGNOSTICS-REFERENCE-INTEGRATION-PLAN.md`
- `docs/GENERATOR-PREVIEW-REFERENCE-INTEGRATION-PLAN.md`
- `.agents/progress/yaxii-shipping-manager/TASK-011A-prototype-ui-rework-audit.md`

## Files created

- `docs/PROTOTYPE-UI-REWORK-AUDIT.md`
- `docs/DIAGNOSTICS-REFERENCE-INTEGRATION-PLAN.md`
- `docs/GENERATOR-PREVIEW-REFERENCE-INTEGRATION-PLAN.md`
- `.agents/progress/yaxii-shipping-manager/TASK-011A-prototype-ui-rework-audit.md`

## Current Diagnostics audit

Current Diagnostics is embedded in `admin-app/src/routes/index.tsx`.

It currently shows:

- Checkout Protection header.
- Refresh diagnostics action.
- WooCommerce state registration card.
- Loading/error/WooCommerce inactive states.
- Six summary stats.
- Recommended next action.
- Full wilaya coverage table.
- Full WooCommerce zone panel.
- Local draft method simulator.

Useful:

- Read-only.
- Uses real `fetchDiagnostics`.
- Surfaces missing, conflicts, method gaps, fallback risk, and recommended next action.

Problems:

- Too noisy for merchants.
- Repeats wilaya coverage in a full table.
- Makes dataset count and zone lists dominate the page.
- Shows zone IDs, ownership hints, matched/overlap counts, and method counts too early.
- The local draft simulator is not real checkout proof.

## Prototype Diagnostics audit

The prototype Diagnostics section is in:

```text
.agents/references/yaxii-shipping-hub-03/src/routes/index.tsx
```

It does better:

- Health-check flow with idle, running, and done states.
- Passed/warnings/failures summary.
- Small health cards.
- No full wilaya table in the main result.
- Clearer merchant-facing result hierarchy.

It must not be copied as logic:

- Uses seed data and `setTimeout`.
- Invents WooCommerce status details.
- Computes issues from mock wilaya state.
- Includes fake checkout simulator behavior.
- Can overclaim checkout verification.

## Diagnostics integration recommendation

Replace the current Diagnostics page with a reference-style health-check UI backed by real `DiagnosticsResponse`.

Main view should show:

- WooCommerce status.
- Setup coverage.
- Missing setup.
- Conflicts.
- Manual/protected zones.
- Method issues.
- Fallback risk.
- Recommended next action.

Advanced/collapsed details should hold:

- Full wilaya coverage.
- WooCommerce zone list.
- Zone IDs.
- ownership hints.
- raw warnings.
- generated timestamp.

Diagnostics must remain read-only and should not become the daily editing workflow.

## Current Generator preview audit

Current Generator final step is mainly:

```text
admin-app/src/components/generator/GeneratorWizard.tsx
admin-app/src/components/generator/PreviewPlanPanel.tsx
```

It currently:

- Auto-runs preview on the final step.
- Uses real `fetchPreview`.
- Uses real `fetchApply`.
- Keeps preview-only mode safe.
- Sends backend-required apply confirmation fields internally.
- Keeps advanced details collapsed.
- Shows real apply results.

Problems:

- `PreviewPlanPanel.tsx` is 903 lines.
- It mixes UI, apply behavior, summary logic, advanced details, and helper functions.
- The main view is still more technical than the reference.
- Support details such as hash, contract version, method keys, zone IDs, and ownership sources are close to the main flow.

## Prototype Generator preview audit

The prototype final preview is in `WStepPreview`.

It does better:

- Clear "Preview plan" title.
- Readiness badge.
- Top stat tiles.
- Manual zones alert.
- Preview group card grid.
- First-three-zone preview sample.

It must not be copied as logic:

- Hardcodes manual skipped count and conflicts.
- Uses fake preview hash.
- Uses seed data.
- Says apply engine is not enabled, which is outdated.
- Uses unsupported "58 or 69" / "69 wilayas" wording.

## Generator integration recommendation

Use the prototype visual structure, but keep current backend behavior:

- `fetchPreview`
- `fetchApply`
- preview hash/revalidation internally
- manual-zone protection
- managed-zone protection
- conflict blocking
- checkbox confirmation
- real `ApplyResponse`

Remove or hide:

- fake hash
- disabled apply-engine screen
- mock counts
- seed-data calculations
- unsupported dataset wording
- unsupported feature claims

## Backend mapping

| Prototype area                       | Classification                         | Notes                                                                 |
| ------------------------------------ | -------------------------------------- | --------------------------------------------------------------------- |
| Diagnostics health cards             | Can copy now with real backend data    | Map from `DiagnosticsResponse`.                                       |
| Diagnostics passed/warn/fail summary | Can copy with frontend adaptation      | Count derived health-card statuses.                                   |
| Diagnostics run/check flow           | Can copy with frontend adaptation      | Use real refresh/load state.                                          |
| Diagnostics checkout simulator       | Must be removed or hidden              | Not real checkout proof.                                              |
| Diagnostics full details             | Can copy as collapsed advanced details | Use existing real wilaya/zone data.                                   |
| Generator readiness badge            | Can copy now with real backend data    | Map from `applyReadiness.severity`.                                   |
| Generator top stat tiles             | Can copy with frontend adaptation      | Use preview summary/context, omit unknown stats.                      |
| Generator preview groups             | Can copy now with real backend data    | Map from preview summary and plan groups.                             |
| Generator preview sample             | Can copy with adaptation               | Use real create/add/update plan rows.                                 |
| Generator apply action               | Must be adapted                        | Keep real apply contract.                                             |
| Generator success state              | Must be adapted                        | Use real `ApplyResponse`.                                             |
| Generator disabled apply step        | Must be removed                        | Real safe apply exists.                                               |
| Advanced details                     | Can copy as concept                    | Keep support details collapsed.                                       |
| Fake actions                         | Must be removed                        | No fake apply, reset, sync, provider, CSV backend, or checkout proof. |

## What can be copied

- Visual health-card pattern.
- Readiness badge pattern.
- Summary stat/tile pattern.
- Preview group card pattern.
- First-three-preview sample pattern.
- Collapsed advanced details concept.
- Safety-line visual treatment.

## What must be adapted or removed

Must adapt:

- Diagnostics checks to real `DiagnosticsResponse`.
- Preview cards to real `PreviewResponse`.
- Apply action to real `fetchApply`.
- Success state to real `ApplyResponse`.
- Warning/conflict text to actual backend states.

Must remove:

- Lovable runtime/error capture.
- TanStack Start app shell.
- Seed data.
- `setTimeout` mock diagnostics.
- Fake preview hash.
- Disabled apply-engine card.
- unsupported Advanced/Sync/Import/provider claims.
- "58 or 69" and "69 wilayas" wording.
- fake checkout simulator proof.

## Component split plan

Diagnostics:

- `admin-app/src/components/diagnostics/DiagnosticsPage.tsx`
- `DiagnosticsHealthSummary.tsx`
- `DiagnosticsIssueList.tsx`
- `DiagnosticsRecommendationCard.tsx`
- `DiagnosticsWilayaCoverage.tsx`
- `DiagnosticsAdvancedDetails.tsx`
- `admin-app/src/lib/diagnostics/status.ts`

Generator:

- `admin-app/src/components/generator/GeneratorFinalStep.tsx`
- `GeneratorPreviewSummary.tsx`
- `GeneratorPreviewGroups.tsx`
- `GeneratorPreviewSample.tsx`
- `GeneratorApplyActionCard.tsx`
- `GeneratorApplyResult.tsx`
- `GeneratorAdvancedDetails.tsx`
- `admin-app/src/lib/generator/preview-summary.ts`

`admin-app/src/routes/index.tsx` should stay orchestration only.

## Files over 300 lines / maintainability risks

Current production:

- `admin-app/src/components/generator/GeneratorWizard.tsx` - 1855 lines
- `admin-app/src/routes/index.tsx` - 1425 lines
- `admin-app/src/components/generator/PreviewPlanPanel.tsx` - 903 lines
- `admin-app/src/components/ui/sidebar.tsx` - 744 lines
- `admin-app/src/components/shipping-zones/ShippingZonesToolbar.tsx` - 495 lines
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx` - 438 lines
- `admin-app/src/lib/shipping-zones/status.ts` - 370 lines
- `admin-app/src/components/ui/chart.tsx` - 331 lines

Reference:

- `.agents/references/yaxii-shipping-hub-03/src/routes/index.tsx` - 2002 lines
- `.agents/references/yaxii-shipping-hub-03/src/components/ui/sidebar.tsx` - 744 lines
- `.agents/references/yaxii-shipping-hub-03/src/components/ui/chart.tsx` - 331 lines

Implementation must not copy the reference's giant route-file shape.

## What was before

Diagnostics was accurate but noisy. Generator preview/apply was backend-safe but visually and structurally heavy.

## What changed

Only planning documents and this report were added. No product behavior changed.

## What still remains mocked

No new mock was added. Existing unsupported areas remain not implemented:

- CSV backend.
- commune-level pricing.
- provider imports.
- YSF sync.
- reset/wipe tooling.
- manual-zone adoption.
- zone-name writes.

## What was not implemented

- No Diagnostics UI replacement.
- No Generator preview/final-step replacement.
- No backend display model.
- No WooCommerce write behavior.
- No REST route changes.
- No build artifacts.
- No reference app files copied.

## Security notes

- No new code path was added.
- No nonce, capability, REST, request, or output behavior changed.
- No telemetry, tracking, Lovable error capture, remote call, external asset, or license behavior was added.

## WooCommerce safety notes

- No WooCommerce write logic changed.
- No zones or methods were created, updated, deleted, adopted, reset, or disabled by this task.
- The plan preserves preview/apply as the only write boundary.

## WordPress.org compliance notes

- The plan rejects Lovable runtime/error capture and external runtime dependencies.
- The plan rejects fake paid/pro locks, telemetry, remote assets, unsupported provider actions, and misleading feature claims.
- The plan keeps diagnostics read-only and apply behavior explicit.

## Checks run

- `git diff --check`
- `git status --short --untracked-files=all`

No npm/PHP build was needed because only docs/report files were changed.

## Check results

- `git diff --check`: passed.
- `git status --short --untracked-files=all`: only the four audit/report documents were untracked before staging.
- No npm/PHP build was run because no product code, PHP, TypeScript, CSS, or built asset changed.

## Known risks

- The existing production generator and route files are already large. The implementation should start with extraction, not visual edits inside the same files.
- Diagnostics health-card classification can be done in frontend helpers now, but a backend display model may be useful later if the mapping becomes too complex.
- The reference contains mojibake and dataset-count wording that must not leak into production copy.

## Blockers

None for audit/planning.

Local `.agents/skills/` is missing, while `.agents/skills/` is present and used. This is a harness path mismatch to keep documenting in reports until normalized.

## Next recommended task

TASK-011B: implement the Diagnostics page replacement first, extracting Diagnostics out of `admin-app/src/routes/index.tsx` into focused components and mapping the reference health-card UI to the real `DiagnosticsResponse`.

## Commit hash, if committed

Pending.
