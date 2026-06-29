# TASK-010B - Shipping Zones Reference Integration Audit and Plan

Date: 2026-06-29

## Goal

Analyze the approved Lovable reference at `.agents/references/yaxii-shipping-hub-89` and create a safe integration plan for replacing the current Shipping Zones page without implementing UI or backend changes.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git root: `C:/Users/Aymen/Local Sites/yaxii-ysz/app/public/wp-content/plugins/yaxii-shipping-manager`
- Branch: `task/010b-shipping-zones-reference-integration-plan`
- Starting status: clean
- Recent graph at task start:
  - `b7c3365 TASK-010A: audit product flow and shipping zones UX`
  - `d1f3dd5 TASK-010: redesign shipping zones management page`
  - `718a1e8 TASK-009D: make shipping zones table manage supported changes`
  - `9f70b79 TASK-009C: clarify shipping zones table status and draft controls`
- TASK-010 commit `d1f3dd5`: present locally
- TASK-010A commit `b7c3365`: present locally
- Local `main`: behind latest approved TASK-010 and TASK-010A work
- `origin/main`: behind latest approved TASK-010 and TASK-010A work
- Safe sync path: merge or fast-forward the approved task branches into `main` through normal review/PR flow, then push; do not rewrite history
- Nested `app/.git`: absent
- Reference nested `.git`: present at `.agents/references/yaxii-shipping-hub-89/.git`; not staged

## Scope

Audit and planning only.

No product code was changed. No WooCommerce behavior was changed. No UI implementation was added. No backend write paths were added.

## Files Changed

- None

## Files Created

- `docs/SHIPPING-ZONES-REFERENCE-INTEGRATION-PLAN.md`
- `.agents/progress/yaxii-shipping-manager/TASK-010B-shipping-zones-reference-integration-plan.md`

## Reference Inspected

Reference path:

- `.agents/references/yaxii-shipping-hub-89`

Important reference files inspected:

- `src/features/shipping-zones/components/shipping-zones-page.tsx`
- `src/features/shipping-zones/components/app-header.tsx`
- `src/features/shipping-zones/components/status-card.tsx`
- `src/features/shipping-zones/components/filters-bar.tsx`
- `src/features/shipping-zones/components/bulk-toolbar.tsx`
- `src/features/shipping-zones/components/row-item.tsx`
- `src/features/shipping-zones/components/method-cell.tsx`
- `src/features/shipping-zones/components/pending-bar.tsx`
- `src/features/shipping-zones/components/review-dialog.tsx`
- `src/features/shipping-zones/components/row-actions.tsx`
- `src/features/shipping-zones/components/status-badge.tsx`
- `src/features/shipping-zones/data.ts`
- `src/features/shipping-zones/types.ts`
- `src/features/shipping-zones/helpers.ts`
- `src/features/shipping-zones/use-shipping-zones.ts`
- `src/features/shipping-zones/api.ts`
- `src/routes/index.tsx`
- `src/routes/__root.tsx`
- `package.json`
- `src/styles.css`

## Reference UI Summary

The reference contains a focused Shipping Zones editor:

- compact app header and tab navigation
- one status card with active wilayas, managed methods, pending changes, and protected manual zones
- search and status filters
- optional quick-tools toolbar for selected rows
- a table/list centered on Home and Office price editing
- inline old price -> new price pending display
- protected/manual and missing rows locked from editing
- hidden row details behind an expand button
- sticky pending changes bar
- compact review dialog with only affected rows and old/new values
- success toast after fake local commit

The strongest reusable pieces are the method cell, pending changes bar, review dialog concept, locked protected row state, compact status summary, and reduced visual noise.

## Current App Comparison

The current Shipping Zones page already uses live diagnostics and preview/apply, but the page still feels too explanatory and technical. It has multiple top cards, a setup-style review panel, and too much contextual text around the table.

The reference solves the main product issue by making the table the management center. It gives the merchant a direct path:

1. edit price
2. see old -> new
3. click Save changes
4. review affected rows
5. update prices

Integration decision: use the reference as the UX target, but adapt every behavior to the current diagnostics, preview, and apply contracts.

## Backend Mapping

Supported now:

- live diagnostics/status
- Yaxii-managed ownership detection
- managed Home/Office/custom method prices
- create managed zones through Generator/apply
- add managed methods through Generator/apply
- update existing Yaxii-managed method labels/prices through preview/apply
- protect manual/unknown zones
- block conflicts
- avoid duplicate methods

Can integrate now:

- compact live status card
- search and filters
- managed inline price edits
- old -> new pending display
- free shipping as `0` price
- per-cell undo
- pending changes bar
- review dialog shell
- protected/manual row locks
- missing setup row CTA
- conflict row CTA
- success state based on real apply result

Can integrate now with frontend-only adaptation:

- row status mapping
- pending change counting
- affected-row review list
- hidden row details
- bulk set fixed price and bulk make free, if limited to editable managed rows

Needs backend task later:

- enable/disable method writes
- disabled state management
- zone-name updates
- CSV import/export backend
- commune-level pricing
- provider imports
- YSF sync

Must be hidden, disabled, or removed:

- active enable/disable switches
- bulk enable/disable
- reset-to-defaults
- deletes
- manual-zone adoption
- manual/unknown method edits
- fake local save/success
- external Google Fonts
- Lovable error reporting
- TanStack Start runtime assumptions
- reference sample data

## What Can Be Copied Now

Copy as design and interaction references:

- page focus and hierarchy
- compact status summary
- search/filter placement
- Home and Office method cell design
- inline old -> new pending display
- pending bar placement and action priority
- review dialog structure
- protected/manual row lock behavior
- hidden details pattern
- component extraction model

Do not copy the reference app wholesale.

## What Must Be Removed Or Disabled

- `.agents/references/yaxii-shipping-hub-89/.git`
- `.lovable`
- Lovable error capture/reporting
- Google Fonts and any external assets
- TanStack route/root/server/start files
- mock `INITIAL_ROWS`
- fake `shippingZonesApi.save()`
- fake `commitChanges()`
- active enable/disable controls
- reset/default/destructive affordances
- disabled/pro-like features
- unsupported manual-zone or unknown-method edits

## Component Extraction Plan

Do not keep growing `admin-app/src/routes/index.tsx`.

Recommended production structure:

- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesHeader.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesStatusCard.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesToolbar.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesTable.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneRow.tsx`
- `admin-app/src/components/shipping-zones/ShippingPriceCell.tsx`
- `admin-app/src/components/shipping-zones/PendingChangesBar.tsx`
- `admin-app/src/components/shipping-zones/ReviewChangesDrawer.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneDetails.tsx`

Recommended helpers:

- `admin-app/src/lib/shipping-zones/status.ts`
- `admin-app/src/lib/shipping-zones/pending-changes.ts`
- `admin-app/src/lib/shipping-zones/preview-request.ts`

Recommended types:

- `admin-app/src/types/shipping-zones.ts`

The route should orchestrate tabs and pass existing app data down. Shipping Zones components should map real diagnostics and pending state into view models.

## Future Implementation Phases

### TASK-010C

Integrate the reference Shipping Zones component shell with real diagnostics and local pending price changes. No backend changes and no apply behavior changes.

### TASK-010D

Wire the review drawer/dialog to existing preview/apply for supported managed method price updates.

### TASK-010E

Run WordPress admin browser smoke, polish responsive behavior, and remove obsolete old table code from `index.tsx`.

### Later

Scope enable/disable method support only if approved and only through preview/apply for Yaxii-managed methods.

## What Was Before

The current page had real live diagnostics and safe preview/apply behavior, but its UX still felt like a technical draft table. Price edits were possible, but the surrounding controls, status language, and setup-oriented review panel made the daily-management workflow less obvious.

## What Changed

Only documentation changed. A detailed integration plan was created.

## What Still Remains Mocked

No runtime behavior was changed. Existing mocked/future areas remain:

- CSV backend
- Smart Form Sync
- provider imports
- commune-level pricing
- enable/disable method writes
- zone-name updates
- destructive reset/delete flows

## Security Notes

No code changed. The plan explicitly keeps all WooCommerce writes behind the existing preview/apply flow and avoids unsafe direct table writes.

## WooCommerce Safety Notes

The plan preserves current safety rules:

- do not touch manual/unknown zones
- do not adopt manual zones
- do not delete zones or methods
- do not update zone names
- update only supported Yaxii-managed methods through preview/apply
- refresh diagnostics after apply

## WordPress.org Compliance Notes

The plan rejects:

- Lovable telemetry/error reporting
- Google Fonts or external assets
- hidden remote calls
- licensing or Pro locks
- misleading disabled paid screens
- fake success states

The plugin remains local-first in the proposed integration.

## Skills And Guards Used

Repository-local `.agent/skills/` was not present. Repository-local `.agents/skills/` was present and inspected.

Guards used:

- `clean-code-guard`
- `docs-guard`
- `woo-guard`
- `wp-guard`
- `wp-rest-api`
- `wp-plugin-directory-guidelines`

## Checks Run

- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- `git diff --check`: passed
- `git status --short --untracked-files=all`: showed only the two intended new files before staging

## Known Risks

- The reference is visually good but mock-driven; copying it directly would create fake data behavior.
- The reference active enable/disable controls are unsupported by the current backend.
- The reference reset affordance must not ship.
- The reference table grid needs responsive hardening.
- The existing shared `PreviewPlanPanel` may remain too setup-oriented for daily price edits unless TASK-010D creates a focused review drawer.

## Blockers

No blockers for this audit/planning task.

## Next Recommended Task

TASK-010C: integrate the reference Shipping Zones component shell with real diagnostics and local pending price changes, with no backend behavior changes.

## Commit Hash

Committed on the task branch. Final branch-head hash is recorded in the task closeout response because embedding a commit's own final hash inside a tracked report changes that hash.
