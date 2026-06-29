# Prototype UI Rework Audit

Date: 2026-06-29

## Scope

This is an audit and planning document for replacing two UI surfaces with patterns from the latest reference prototype:

- Diagnostics page
- Generator preview/final step

No production UI, backend write logic, REST route, WooCommerce zone/method behavior, build artifact, or reference app file was changed by this audit.

## Reference Inspected

Reference path:

```text
.agents/references/yaxii-shipping-hub-03
```

This was the newest folder under `.agents/references/` and it contains the relevant old prototype UI in:

```text
.agents/references/yaxii-shipping-hub-03/src/routes/index.tsx
```

Relevant prototype sections:

- `WStepPreview`, `PreviewGroup`, `ReadinessBadge`, disabled `WStepApply`
- `DiagnosticsScreen`, `SummaryStat`, `HealthCard`, `CheckoutSim`

The reference is a TanStack/Lovable prototype. It must be treated as a visual and interaction reference only.

## Current Diagnostics Audit

Current production Diagnostics lives inside:

```text
admin-app/src/routes/index.tsx
```

The current screen shows:

- A "Checkout Protection" header.
- A `Refresh diagnostics` action wired to the real diagnostics REST endpoint.
- WooCommerce state registration status.
- Loading, error, and WooCommerce inactive states.
- Six summary tiles:
  - Configured wilayas
  - Missing wilayas
  - Conflicts
  - Zones without methods
  - Fallback risk
  - Rest-of-world methods
- Recommended next action from the backend.
- Full wilaya coverage table with code, French name, Arabic name, status, and matched zone names.
- Full WooCommerce zone panel with zone IDs, ownership hints, matched/overlap counts, method counts, and method badges.
- A local draft method simulator based on current frontend wilaya draft data.

Useful parts:

- It is read-only.
- It uses the real `fetchDiagnostics` client and nonce-backed REST route.
- It shows WooCommerce inactive and diagnostics error states.
- It surfaces the backend recommended next action.
- It exposes conflicts, missing wilayas, method gaps, manual/unknown ownership, and rest-of-world risk.

Noisy or repeated parts:

- It renders the entire wilaya list again, which duplicates Shipping Zones.
- It exposes every matched zone name in the main flow, which is noisy when the dataset count is high.
- It exposes zone IDs and method-count diagnostics too early.
- The local draft simulator duplicates wizard/shipping-zone draft concepts and is not a real checkout simulation.
- The current page can repeat dataset/wilaya information and make a 69-wilaya dataset feel like the main diagnostic result instead of a health signal.

Too technical for normal merchants:

- Zone IDs.
- Ownership hints such as weak Yaxii hints.
- Matched/overlapping wilaya counts per zone.
- Method counts and disabled method totals per zone.
- Full raw wilaya coverage table.
- Preview/backend contract-like wording.

Should be hidden under details or advanced:

- Full wilaya coverage table.
- Full zone list.
- Zone IDs.
- Method instance details.
- Ownership hint source.
- Generated timestamp.
- Raw warnings beyond the first merchant-facing warning.

Normal merchants should see:

- Overall setup health.
- Whether WooCommerce is active.
- Whether Yaxii-managed setup is present.
- Missing setup count.
- Conflict count.
- Manual/protected zone count.
- Method issue count.
- Checkout fallback risk.
- One recommended next action.
- Direct path to Generator, Shipping Zones, or WooCommerce zones when useful.

Agencies/support should see:

- Collapsed advanced details.
- Exact wilaya rows with missing/conflict status.
- Exact zone names and IDs.
- Manual/protected ownership signals.
- Method-count and enabled-method signals.
- Backend warnings and generated timestamp.

## Prototype Diagnostics Audit

Prototype Diagnostics does better at page shape:

- It starts as a health check, not a data table.
- It has an idle state with a clear `Run check` action.
- It has a running state.
- It summarizes passed, warnings, and failures.
- It presents health cards for WooCommerce detected, shipping enabled, zones configured, missing wilayas, duplicate zones, and checkout fallback risk.
- It avoids showing the full wilaya table in the main result.

Prototype Diagnostics must not be copied as logic:

- It uses local React state, seed wilaya data, and a `setTimeout`.
- It invents WooCommerce version/status details.
- It derives missing/conflict counts from mock wilaya status.
- It includes a checkout simulator based on mock frontend methods.
- It can say "every Algeria wilaya can complete checkout", which is too strong unless real checkout-rate verification exists.

## Diagnostics Recommendation

Replace the current Diagnostics UI with the prototype health-check layout, but map every value from the real `DiagnosticsResponse`.

Recommended main page structure:

1. Header: "Checkout Protection" or "Diagnostics".
2. Read-only health summary card with overall status.
3. Health cards:
   - WooCommerce status
   - Yaxii setup coverage
   - Missing setup
   - Conflicts
   - Manual/protected zones
   - Method issues
   - Checkout fallback risk
4. Recommended next action card.
5. Optional actions:
   - Open Shipping Zones
   - Open Generator
   - Open WooCommerce zones
   - Refresh diagnostics
6. Collapsed advanced details:
   - Wilaya coverage
   - WooCommerce zones
   - warnings
   - generated timestamp

Diagnostics must remain read-only and must not become the daily edit surface. Shipping Zones remains the management center.

## Current Generator Preview/Final Audit

Current production final preview is split between:

```text
admin-app/src/components/generator/GeneratorWizard.tsx
admin-app/src/components/generator/PreviewPlanPanel.tsx
```

Current behavior:

- Final step auto-runs `fetchPreview` when the draft is valid.
- Loading/error/invalid-draft states are handled.
- `PreviewPlanPanel` receives the real `PreviewResponse`, `PreviewRequest`, and context.
- Apply uses `fetchApply`.
- The visible confirmation is a checkbox.
- The frontend sends the backend-required `APPLY YAXII SHIPPING PLAN` phrase internally only after confirmation.
- `previewHash`, `previewGeneratedAt`, accepted summary, locked safety policy, contract version, and `previewRequest` are sent to the backend.
- The backend revalidates before writing.
- Advanced details are collapsed.

Useful current parts:

- Real backend behavior is wired correctly.
- Manual zones and no-deletes safety is visible.
- Apply result is shown after real apply.
- Unsupported zone-name updates are called out as later work.
- Preview-only mode hides apply.

Confusing or too technical:

- `PreviewPlanPanel.tsx` is 903 lines and mixes rendering, apply behavior, summary derivation, advanced details, and helper functions.
- The final view still has many backend-shaped concepts.
- Affected wilayas and advanced details can still expose method keys, zone IDs, ownership sources, and hash/contract metadata.
- The main summary is less visually scannable than the reference preview groups.
- The current status/action card is correct but not as approachable as the prototype preview-plan grid.

## Prototype Generator Preview/Final Audit

Prototype final preview does better at visual shape:

- Big "Preview plan" section.
- Readiness badge: ready, attention, blocked.
- Top stat tiles for selected wilayas, commune coverage, method count, and region format.
- Manual-zone alert near the top.
- Preview groups:
  - Zones to create
  - Zones to update
  - Methods to add
  - Methods to update
  - Manual zones skipped
  - Conflicts
  - Warnings
  - Unchanged
- Sample of the first three planned zones with method price badges.

Prototype final preview must not be copied as behavior:

- It hardcodes manual skipped count to `2`.
- It hardcodes conflicts to `0`.
- It computes zones/methods from selected frontend rows, not real diagnostics.
- It displays a fake preview hash such as `prv_{selected.length}x{methods.length}`.
- It labels apply as disabled/not enabled, which is outdated because the real safe apply engine exists.
- It uses preview-only copy that no longer matches the current backend.
- It uses "69 wilayas" and "58 or 69" wording that conflicts with dataset wording rules.

## Generator Preview Recommendation

Replace the current final preview visual layout with the prototype preview-plan grid and sample-card pattern, but keep all real production contracts:

- `fetchPreview`
- `fetchApply`
- preview hash and revalidation internally
- managed-zone protection
- manual-zone protection
- conflicts block apply
- unsupported operations hidden or collapsed

The main UI should not expose:

- preview hash
- contract version
- generated timestamp
- raw plan group names when a merchant-facing label is clearer
- zone IDs
- method keys
- ownership-source codes

Those can remain in `GeneratorAdvancedDetails` for support only.

## Backend Mapping Summary

| Prototype UI element | Production classification | Mapping |
| --- | --- | --- |
| Diagnostics health cards | Copy with real backend data | Derive from `DiagnosticsResponse.summary`, `woocommerceActive`, `zoneResults`, and `warnings`. |
| Diagnostics passed/warnings/failures summary | Copy with frontend-only adaptation | Derive counts from classified health cards, not mock `CheckResult`. |
| Diagnostics idle/run/check pattern | Copy with frontend-only adaptation | Use existing load/refresh lifecycle; initial ready may still auto-load, but the visual can look like a run result. |
| Diagnostics checkout simulator | Remove or hide | Current simulator is not a real checkout-rate test. Do not present as checkout proof. |
| Full wilaya table | Hide under advanced | Keep for support, not merchant main path. |
| Full zone list | Hide under advanced | Keep for support. |
| Generator readiness badge | Copy with real backend data | Map from `response.applyReadiness.severity`. |
| Generator stat tiles | Copy with real backend data | Use selected wilayas, loaded commune count when available, enabled method count, region format. |
| Generator preview groups | Copy with real backend data | Use `PreviewResponse.summary` and `PreviewResponse.plan`. |
| Manual zones alert | Copy with real backend data | Show when `summary.skipManualZones > 0` or manual/protected diagnostics exist. |
| Preview sample card | Copy with adaptation | Use real `plan.createZones` and `plan.addMethods`; limit to first 3. |
| Disabled apply step | Remove | Real safe apply exists. Keep confirmation/apply action card instead. |
| Fake preview hash | Remove | Real hash stays hidden in advanced details only. |
| Apply action | Adapt | Keep checkbox confirmation and real `fetchApply`. |
| Success state | Adapt | Use real `ApplyResponse`, never hardcoded success. |
| Advanced details | Copy concept, adapt content | Collapsed support details only. |

## Reference Safety Findings

Do not ship from the reference:

- `src/lib/lovable-error-reporting.ts`
- `src/lib/error-capture.ts`
- `src/lib/error-page.ts`
- TanStack Start/router runtime files
- `routeTree.gen.ts`
- `server.ts`
- `start.ts`
- `.lovable` or Lovable-connected runtime concepts
- `@lovable.dev/vite-tanstack-config`
- `@tanstack/react-start`
- seed/mock wilaya data
- mock timeout diagnostics
- fake preview hash
- disabled apply-engine messaging
- unsupported Advanced/Sync/Import claims
- provider or sync-looking screens
- "58 or 69 wilaya" / "69 wilayas" wording

No external CDN import was found in the inspected source, but the reference has many dependencies and Lovable/TanStack runtime assumptions that are not suitable for the WordPress admin app.

## Maintainability Risks

Current production files over 300 lines:

- `admin-app/src/components/generator/GeneratorWizard.tsx` - 1855 lines
- `admin-app/src/routes/index.tsx` - 1425 lines
- `admin-app/src/components/generator/PreviewPlanPanel.tsx` - 903 lines
- `admin-app/src/components/ui/sidebar.tsx` - 744 lines
- `admin-app/src/components/shipping-zones/ShippingZonesToolbar.tsx` - 495 lines
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx` - 438 lines
- `admin-app/src/lib/shipping-zones/status.ts` - 370 lines
- `admin-app/src/components/ui/chart.tsx` - 331 lines

Reference files over 300 lines:

- `.agents/references/yaxii-shipping-hub-03/src/routes/index.tsx` - 2002 lines
- `.agents/references/yaxii-shipping-hub-03/src/components/ui/sidebar.tsx` - 744 lines
- `.agents/references/yaxii-shipping-hub-03/src/components/ui/chart.tsx` - 331 lines

Implementation must not grow `admin-app/src/routes/index.tsx`. The route should stay orchestration only. New Diagnostics and Generator work should be extracted into focused components and helpers before visual replacement.

## Recommended Implementation Boundary

Next task should be an implementation task with this boundary:

- Extract Diagnostics UI out of `routes/index.tsx`.
- Replace the Diagnostics main view with health cards and collapsed advanced details.
- Split `PreviewPlanPanel.tsx` into final-step components and summary helpers.
- Replace the Generator final main view with reference-style preview groups and sample cards.
- Keep current REST clients and backend contracts unchanged.
- Do not copy the reference runtime, seed data, mock behavior, Lovable code, or TanStack app shell.

No backend task is required for the first UI integration unless the implementation discovers a missing support-only field that cannot be derived safely from existing response types.
