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
- It lacks the prototype's clear preview-plan grid and sample view.

## Reference Elements to Reuse

Can copy with real backend data:

- Readiness badge.
- Top stat tiles.
- Preview group card grid.
- Manual-zone alert.
- Preview sample card.
- Safety line visual treatment.

Can copy with frontend-only adaptation:

- Card layout and tone classes.
- Count badge pattern.
- First-3-sample pattern.
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
admin-app/src/components/generator/GeneratorPreviewSample.tsx
admin-app/src/components/generator/GeneratorApplyActionCard.tsx
admin-app/src/components/generator/GeneratorApplyResult.tsx
admin-app/src/components/generator/GeneratorAdvancedDetails.tsx
admin-app/src/lib/generator/preview-summary.ts
```

Possible split of current `PreviewPlanPanel.tsx`:

- Keep `PreviewPlanPanel` as a thin orchestrator temporarily, or replace it with `GeneratorFinalStep`.
- Move final status derivation into `admin-app/src/lib/generator/preview-summary.ts`.
- Move apply result rendering into `GeneratorApplyResult.tsx`.
- Move collapsed hash/contract/raw groups into `GeneratorAdvancedDetails.tsx`.
- Move affected wilaya rows into either `GeneratorPreviewSample.tsx` or a collapsed details component.

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
- sample of affected wilayas/methods
- apply action card when safe
- success/no-change result after apply

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

Keep the current production action behavior:

- Visible checkbox: `I reviewed this setup`.
- Button labels based on real supported work:
  - create zones and add methods
  - add methods and prices
  - create zones
  - update methods
- Apply disabled until checkbox is checked.
- Preview-only mode shows no apply button.
- Blocked state routes to refresh preview and diagnostics.

Do not copy the reference's disabled `WStepApply` card. It is obsolete.

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
