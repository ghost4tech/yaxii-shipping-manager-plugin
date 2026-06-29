# Generator Preview Reference Integration Plan

Date: 2026-06-29

## Goal

Replace the Generator final preview/final-step presentation with the stronger prototype preview-plan UI while preserving the real preview/apply backend behavior.

Reference source:

```text
.agents/references/yaxii-shipping-hub-03/src/routes/index.tsx
```

Production sources today:

```text
admin-app/src/components/generator/GeneratorWizard.tsx
admin-app/src/components/generator/PreviewPlanPanel.tsx
admin-app/src/api/preview-api.ts
admin-app/src/api/apply-api.ts
admin-app/src/types/preview.ts
admin-app/src/types/apply.ts
```

## Non-Negotiable Backend Behavior

Keep:

- `fetchPreview`
- `fetchApply`
- `PreviewRequest`
- `PreviewResponse`
- `ApplyRequest`
- `ApplyResponse`
- `previewHash`
- `previewGeneratedAt`
- accepted plan summary
- locked safety policy snapshot
- `apply-contract-v1`
- backend-required confirmation phrase sent internally
- backend revalidation before write
- managed-zone protection
- manual-zone protection
- conflicts blocking apply

Do not add a frontend write path. Do not bypass preview/apply.

## Current Final Step

Current strengths:

- Auto-preview starts when a valid draft reaches the final step.
- Preview-only mode hides apply controls.
- Apply uses real nonce-backed REST.
- Confirmation is visible as `I reviewed this setup`.
- Advanced details are collapsed.
- Apply result is based on real backend response.

Current weaknesses:

- `PreviewPlanPanel.tsx` is 903 lines.
- It mixes final action, summary, apply result, affected wilaya details, advanced details, API apply behavior, and summary helper logic.
- Main UI is still more backend-shaped than merchant-shaped.
- Preview group details can surface technical labels too close to the main flow.
- It originally lacked the prototype's clear preview-plan grid.

## Reference Elements to Reuse

Can copy with real backend data:

- Readiness badge.
- Top stat tiles.
- Preview group card grid.
- Manual-zone alert.
- Safety line visual treatment.

Can copy with frontend-only adaptation:

- Card layout and tone classes.
- Count badge pattern.
- Ready/attention/blocked visual mapping.

Must not copy:

- Hardcoded `manualSkipped = 2`.
- Hardcoded `conflicts = 0`.
- Fake preview hash.
- Disabled apply engine card.
- Preview-only-only copy.
- Seed data calculations.
- "58 or 69 wilaya" and "69 wilayas" wording.
- Any unsupported provider/import/sync copy.

## Proposed Component Structure

Create or refactor toward:

```text
admin-app/src/components/generator/GeneratorFinalStep.tsx
admin-app/src/components/generator/GeneratorPreviewSummary.tsx
admin-app/src/components/generator/GeneratorPreviewGroups.tsx
admin-app/src/components/generator/GeneratorGenerateStep.tsx
admin-app/src/components/generator/GeneratorAdvancedDetails.tsx
admin-app/src/lib/generator/preview-summary.ts
admin-app/src/lib/generator/generate-result.ts
```

Possible split of current `PreviewPlanPanel.tsx`:

- Keep `PreviewPlanPanel` as a thin orchestrator temporarily, or replace it with `GeneratorFinalStep`.
- Move final status derivation into `admin-app/src/lib/generator/preview-summary.ts`.
- Move generate result summary into `admin-app/src/lib/generator/generate-result.ts`.
- Move collapsed hash/contract/raw groups into `GeneratorAdvancedDetails.tsx`.
- Keep long affected wilaya rows in collapsed advanced details only.

Target file size:

- Keep each new production component below roughly 300 lines.
- Do not grow `GeneratorWizard.tsx`.
- Do not grow `admin-app/src/routes/index.tsx`.

## Data Mapping

| UI area | Production source |
| --- | --- |
| Readiness badge | `response.applyReadiness.severity` and `response.applyReadiness.title` |
| Wilayas selected | `response.summary.selectedWilayas` |
| Communes covered | Existing `GeneratorPreviewContext` if available; otherwise omit or use "Wilaya-level coverage" |
| Methods enabled | `context.enabledMethodLabels.length` or method groups in plan |
| Region format | `GeneratorPreviewContext` or draft context if available |
| Zones to create | `response.summary.createZones`, `response.plan.createZones` |
| Zone updates later | `response.summary.updateZones`, hidden/collapsed if zero |
| Methods to add | `response.summary.addMethods`, plus methods nested under `createZones` |
| Method updates | `response.summary.updateMethods` |
| Method status updates | `response.summary.updateMethodStatuses` |
| Manual zones skipped | `response.summary.skipManualZones`, `response.plan.skipManualZones` |
| Conflicts | `response.summary.conflicts`, `response.plan.conflicts` |
| Warnings | `response.summary.warnings`, `response.warnings`, `response.plan.warnings` |
| Unchanged | `response.summary.unchanged` |
| Apply allowed | existing `canApplyPreview(response)` logic |
| Apply result | `ApplyResponse` |

## Main Merchant View

Show:

- readiness badge
- summary stat tiles
- preview group cards
- one manual-zone/conflict warning when relevant
- compact coverage tile with tooltip details
- separate Generate step after the preview
- success/no-change result after generate

Hide or collapse:

- preview hash
- contract version
- generated timestamp
- raw plan item arrays
- zone IDs
- method keys
- ownership-source codes
- long affected wilaya lists

## Apply Action

Keep production write behavior, but present it from the separate Generate step:

- One-click `Generate setup` action after the preview has been reviewed.
- Preview step is read-only and only continues when the preview matches the current draft.
- Preview-only mode shows no generate button.
- Blocked state routes to refresh preview and diagnostics.
- The real backend confirmation phrase, preview hash, generated timestamp, accepted plan summary, safety policy snapshot, contract version, and preview request stay internal.

Do not copy the reference's fake disabled action logic. Use the reference visual shell for the Generate step and wire it to the real backend.

## Success State

Use real `ApplyResponse`:

- `wooCommerceChanged`
- `message`
- created zones count
- created methods count
- updated methods count
- skipped/blocked/conflict count
- warnings

Never hardcode success. Never say WooCommerce changed unless the response says it did.

## Backend Gaps

No backend task is required for the first UI integration.

Possible later backend task only if merchant/support UX needs a more compact diagnostics or preview display model:

- Add a read-only display summary to preview response.
- Add pre-classified diagnostics health checks.

Do not add that until the frontend helper approach proves insufficient.

## Implementation Checks

Recommended checks for the implementation task:

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- restricted phrase scan
- external asset scan
- source map scan under `assets/admin`
- `git diff --check`
- browser smoke of Generator final preview in wp-admin

No PHP checks are needed unless backend files change.

## TASK-011C Implementation Result

Implemented on branch `task/011c-generator-preview-reference-ui`.

Production UI now uses the prototype preview-plan shape while keeping the real preview/apply contracts:

- `PreviewPlanPanel.tsx` is a thin compatibility export to `GeneratorFinalStep`.
- Final-step UI is split into summary, preview group, and advanced-details components.
- Real `PreviewResponse` data drives readiness, stat tiles, group cards, blocked/manual-zone alerts, and advanced support details.
- Preview-only mode keeps apply controls hidden in the active wizard and shows a read-only action message.
- Generate still goes only through `fetchApply` with preview hash, generated timestamp, accepted plan summary, safety policy snapshot, contract version, confirmation phrase, and the original preview request.
- Main UI keeps hash, contract version, generated timestamp, zone IDs, method keys, ownership hints, and raw plan lists inside collapsed advanced details.

Implementation files:

```text
admin-app/src/components/generator/GeneratorFinalStep.tsx
admin-app/src/components/generator/GeneratorPreviewSummary.tsx
admin-app/src/components/generator/GeneratorPreviewGroups.tsx
admin-app/src/components/generator/GeneratorGenerateStep.tsx
admin-app/src/components/generator/GeneratorAdvancedDetails.tsx
admin-app/src/lib/generator/preview-summary.ts
admin-app/src/lib/generator/generate-result.ts
admin-app/src/lib/generator/preview-plan-item.ts
```

No backend write behavior was changed.

## TASK-011C Feedback Pass

Implemented on the same branch after UX feedback:

- The Preview coverage tile now shows only `Wilaya level` in the main card.
- Coverage detail remains available through the `Coverage details` tooltip.
- The preview sample section was removed from the Preview step.
- The old ready-to-save action card was removed from the Preview step.
- A separate Step 9 `Generate` screen now uses the reference action-card shape.
- Step 9 shows one-click `Generate setup`, loading animation classes, real `fetchApply` wiring, and real result messaging after the backend responds.
- Success-state actions include `Return to shipping editor` and `WooCommerce zones`.
- Preview-only mode and blocked previews do not show the generate action.

No fake reference logic, mock apply result, backend write bypass, external asset, or unsupported feature was added.
