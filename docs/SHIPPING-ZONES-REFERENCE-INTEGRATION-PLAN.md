# Shipping Zones Reference Integration Plan

Date: 2026-06-29

## Goal

Plan how to replace the current Shipping Zones page with the approved Lovable reference at `.agents/references/yaxii-shipping-hub-89` while preserving the existing safe WooCommerce behavior.

This is an audit and planning document only. It does not approve direct WooCommerce table writes, manual-zone adoption, deletes, reset tooling, provider import, CSV backend work, commune-level pricing, YSF sync, licensing, telemetry, external assets, or Pro gating.

## Product Decision

The reference should become the visual and interaction reference for the Shipping Zones page, but not the runtime architecture or data layer.

The target product flow is:

1. Merchant opens Shipping Zones.
2. Merchant edits managed Home or Office prices inline.
3. The edited cell shows current price -> new price.
4. A compact pending changes bar appears.
5. Merchant opens a review dialog or drawer.
6. The review shows only affected wilayas and methods.
7. Merchant clicks `Update prices`.
8. The existing preview/apply backend revalidates WooCommerce state and writes only supported managed method updates.
9. The page refreshes diagnostics and reports exactly what changed.

Routine price updates must not send the merchant through the full Generator. Generator remains for initial setup, bulk setup, and repair.

## Reference Inspected

Path: `.agents/references/yaxii-shipping-hub-89`

The reference is a standalone Lovable/TanStack app. Important files:

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

Reference safety notes:

- The reference contains a nested `.git` directory. It must not be staged or committed.
- The reference includes Lovable runtime/error reporting files. They must not ship in the plugin.
- The reference root imports Google Fonts in its TanStack root route. External font URLs must not ship.
- The reference uses local sample data and fake local save behavior. None of that should become production data flow.
- The reference shows active enable/disable controls and disabled reset controls. Enable/disable is unsupported by the current backend and reset should not be shown.

## Reference UI Summary

### Layout

The page is a focused management workspace:

- compact product header
- simple top navigation
- page title and short purpose text
- one status card with operational metrics
- search and status filters
- optional bulk toolbar when rows are selected
- one bordered table/list surface
- sticky floating pending changes bar
- review dialog for changed prices

This is materially cleaner than the current page because the table is the center of the workflow instead of being surrounded by multiple explanatory cards.

### Header And Status Area

The reference header positions Shipping Zones as a practical price manager. The status card shows:

- active wilayas
- managed methods
- pending changes
- protected manual zones
- short safety copy: manual zones are protected and prices are reviewed before WooCommerce is updated
- secondary links for Diagnostics and WooCommerce zones

This direction should be copied, but values must come from current diagnostics and managed ownership data.

### Table Structure

The table uses these columns:

- selection checkbox
- Wilaya
- Status
- Home delivery
- Office / Stopdesk
- Actions
- expand details

This column structure is a good target for the production page. The Actions column must be simplified for current backend support.

### Filters And Search

The reference has a simple search input and pill filters:

- All
- Active
- Pending changes
- Needs update
- Missing setup
- Protected
- Disabled

Search and most filters are safe frontend behavior. The `Disabled` filter depends on unsupported enable/disable writes and should be hidden until real support exists, or shown only if diagnostics can truthfully report disabled WooCommerce methods without implying edit support.

### Price Editing

The method cell is the strongest part of the reference:

- editable price input for managed methods
- live current price text
- pending state shown inline
- old price struck through
- new price shown next to it
- undo for the pending cell
- non-managed methods show a locked/empty state

This behavior should be copied with production data mapping.

### Free Shipping

The reference models free shipping as a method price state. Internally it uses `pendingPrice: null`; production should map free shipping to a supported `0` cost because the current backend supports price `0`.

The UI should avoid separate `Home free` and `Office free` labels. Use a simple inline free option or quick action that creates the same pending price update as typing `0`.

### Pending Changes Flow

The reference pending bar is concise and obvious:

- shows count of pending changes
- offers Discard
- offers Review
- offers Save changes

This is the right daily-management pattern. In production, both `Review` and `Save changes` should open the review step first, then call existing preview/apply behavior after confirmation.

### Review Dialog

The reference review dialog shows only changed rows:

- wilaya name
- method label
- old price
- new price
- safety copy that WooCommerce is checked again and manual zones are not touched
- final `Update prices` action

This should become the model for price updates. The dialog should not expose the full setup-oriented `PreviewPlanPanel` unless the backend returns a blocking issue that needs deeper explanation.

### Success State

The reference uses a toast saying prices were updated and manual zones were not touched. Production success should use the real `ApplyResponse` counts:

- updated methods
- skipped items
- blocked/conflict count if any
- confirmation that manual zones were not touched when applicable

No fake success state should ship.

### Protected, Manual, And Missing Rows

The reference handles these states well:

- protected rows are not selectable
- protected method cells are not editable
- missing rows are not editable
- row details explain why

Production copy should be simpler:

- `Protected manual zone`
- `Missing setup`
- `Open Generator`
- `Check diagnostics`

### Expanded Details

The reference keeps details hidden until expanded. That should be kept. Production details should show only useful facts:

- managed by Yaxii or protected manual
- WooCommerce zone exists
- Home method live state
- Office method live state
- conflict or missing method reason

Avoid showing raw hashes, internal registry keys, preview hashes, REST payloads, or technical ownership internals in the default table.

### Responsive Behavior

The reference uses a fixed CSS grid for the table rows. It is visually clean on desktop, but it does not provide a full mobile-specific row layout. Production integration should include a responsive pass:

- desktop can keep the reference grid
- narrow widths should avoid text overlap
- if needed, mobile should stack row metadata above method cells
- the sticky pending bar must not cover WordPress admin controls or row actions

## What Should Be Copied

Copy the product and interaction ideas:

- table as the primary workspace
- compact one-card status summary
- searchable/filterable rows
- clear status badges
- inline Home and Office price editing
- old price -> new price pending display
- per-cell undo
- protected/manual rows locked from editing
- missing setup rows locked with Generator CTA
- details hidden by default
- sticky pending changes bar
- compact review dialog or drawer
- success language based on exact changed counts
- focused component decomposition

Copy only after adapting to the existing plugin app, data contracts, and WordPress admin constraints.

## What Must Be Removed Or Adapted

Remove or avoid:

- `.agents/references/yaxii-shipping-hub-89/.git`
- `.lovable`
- Lovable error reporting and capture files
- TanStack Start routing and SSR assumptions
- Google Fonts links and all external assets
- local `INITIAL_ROWS` as production data
- fake `commitChanges()` and fake `shippingZonesApi.save()`
- fake success toast behavior
- active enable/disable switches
- active enable/disable bulk tools
- reset-to-defaults action
- any delete/reset/destructive action
- any disabled feature that looks like a paid/pro lock
- sample mojibake strings from copied output

Adapt:

- `pendingPrice: null` free state to production price `0`
- top navigation to the existing plugin tabs instead of reference-local state
- `StatusCard` metrics to diagnostics-derived metrics
- `RowStatus` to production status mapping
- `ReviewDialog` to call preview/apply revalidation instead of local state mutation
- row actions to only supported actions

## Current App Comparison

| Current problem | Reference solution | Integration decision |
| --- | --- | --- |
| Too many top cards and explanatory notices | One compact status card plus small safety line | Replace the current header area with a compact summary |
| Table still feels partly like draft controls | Table is the main manager with inline editing and save flow | Make Shipping Zones the daily management center |
| `Needs update` does not clearly say what to do next | Pending bar and review dialog provide a next action | Convert changed rows into pending changes with a visible update path |
| Price editing path is not obvious enough | Edited cell shows old -> new and sticky Save changes appears | Copy this interaction |
| Technical details are too visible | Details are hidden behind expansion | Keep default rows clean |
| Actions column has unsupported/random controls | Reference has row menu, but includes unsupported actions | Keep the visual affordance only if actions are real; otherwise remove row actions |
| Free shipping is split into awkward controls | Reference treats Free as price state | Implement free as a clean `0 DZD` price action |
| Enable/disable appears but is not supported | Reference shows active switches | Hide enable/disable until backend support exists |
| Generator is overused for daily edits | Reference keeps price update inside table | Use Generator only for missing setup, bulk setup, or repair |
| Manual/protected state needs clearer copy | Reference locks protected rows | Lock rows and show `Protected manual zone` |
| WooCommerce zones link is useful but secondary | Reference puts it in status card footer | Keep as secondary, open in a new tab |

## Backend Mapping

| Reference feature | Classification | Plan |
| --- | --- | --- |
| Live status card | Can integrate now | Use diagnostics and managed registry data |
| Active wilayas count | Can integrate now with adaptation | Count managed ready/needs update rows, not fake enabled state |
| Managed methods count | Can integrate now | Count managed Home/Office methods from diagnostics |
| Pending changes count | Can integrate now with frontend-only adaptation | Count local pending price edits |
| Protected manual zones count | Can integrate now | Use ownership/conflict diagnostics |
| Search | Can integrate now with frontend-only adaptation | Filter row models in React |
| Status filters | Can integrate now with frontend-only adaptation | Map production statuses to filter keys |
| Disabled filter | Must be hidden for now | Backend cannot write enable/disable; avoid implying support |
| Inline managed price input | Can integrate now | Only enable when diagnostics says method is registry-owned/Yaxii-managed |
| Old -> new pending display | Can integrate now with frontend-only adaptation | Derive from pending map and live method price |
| Per-cell undo | Can integrate now with frontend-only adaptation | Clear pending value for one method |
| Free shipping | Can integrate now with adaptation | Store pending price as `0`; apply through existing method update |
| Bulk set fixed price | Can integrate now with frontend-only adaptation | Safe if it only creates pending edits for editable managed methods |
| Bulk make free | Can integrate now with frontend-only adaptation | Safe if it only creates pending `0` edits |
| Bulk percent/amount/round tools | Can integrate now, but defer | Useful for agencies, but adds complexity; introduce after basic flow is stable |
| Copy Home -> Office / Office -> Home | Can integrate now, but defer | Safe for managed methods, but not MVP-critical for rework |
| Active enable/disable switch | Needs backend task later | Hide until preview/apply supports method enable state safely |
| Bulk enable/disable | Must be removed for now | Unsupported and too risky |
| Reset to defaults | Must be removed | No approved reset/wipe tooling |
| Row actions menu | Can integrate now with removal | Keep only `Discard pending`, `Open Generator`, `Check diagnostics`, or `Open WooCommerce` as context allows |
| Protected manual row lock | Can integrate now | Use diagnostics ownership and conflicts |
| Missing setup row | Can integrate now with frontend-only adaptation | Lock editing and offer `Open Generator` |
| Review dialog | Can integrate now with frontend-only adaptation | Shell can show affected rows; final confirmation must call preview/apply |
| Fake local commit success | Must be removed | Use `fetchPreview` and `fetchApply` only |
| Success toast/message | Can integrate now with adaptation | Use `ApplyResponse` counts and refresh diagnostics |
| Expanded details | Can integrate now | Use diagnostics; keep non-technical |
| Zone name edits | Must be removed | Backend does not update zone names |
| Manual zone adoption | Must be removed | Out of scope and unsafe |
| Manual/unknown method edits | Must be removed | Backend protects these |
| Deletes | Must be removed | Not supported |
| CSV import/export | Needs backend task later | Keep out of Shipping Zones page |
| Commune pricing | Needs backend task later | Keep out of Shipping Zones page |
| Provider imports | Needs backend task later | Keep out |
| YSF sync | Needs backend task later | Keep hidden/coming later outside this page |

## Integration Architecture Plan

Do not keep growing `admin-app/src/routes/index.tsx`. The current Shipping Zones logic should move into focused modules.

Recommended component structure:

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

Names can be adjusted during implementation to match existing project conventions, but the extraction boundary should stay clear:

- route file owns tab selection and high-level navigation
- Shipping Zones page owns row rendering and daily price state
- helpers own status mapping and preview request construction
- API modules remain the only place that calls REST

## Data Flow Plan

Production row model should be derived from:

- wilayas dataset from current plugin config
- method definitions from current app state
- diagnostics response
- managed registry ownership
- live WooCommerce method prices
- local pending price changes

Proposed row model fields:

- `wilayaCode`
- `wilayaName`
- `wilayaNameAr`
- `status`
- `statusLabel`
- `statusReason`
- `ownership`
- `home`
- `office`
- `canSelect`
- `primaryAction`
- `details`

Method cell fields:

- `methodKey`
- `label`
- `livePrice`
- `pendingPrice`
- `isManaged`
- `isEditable`
- `disabledReason`

Pending changes should stay local until the merchant confirms. On confirm:

1. Build a `PreviewRequest` using only affected wilayas and current method templates.
2. Include pending values for changed methods.
3. Include live existing values for unchanged methods needed by the preview planner.
4. Call `fetchPreview`.
5. If preview is blocked, show the blocking state and do not apply.
6. If preview confirms only supported managed method updates, call `fetchApply`.
7. Refresh diagnostics after apply.
8. Clear local pending state only for successful applied changes.

## UX Behavior Decision

Use a review step, not one-click writes.

Recommended labels:

- pending bar primary: `Save changes`
- review title: `Review price updates`
- final action: `Update prices`

This gives merchants a practical "save" mental model while preserving the safety model that every WooCommerce write goes through preview/apply revalidation.

Do not route routine price updates through Generator. Use Generator only for:

- fresh setup
- adding missing Yaxii-managed zones/methods
- bulk setup
- repair when setup is incomplete

## Safety And Unsupported Actions

Enable/disable methods:

- hide from the first integration
- do not show disabled filter unless it is read-only and clearly based on live WooCommerce state
- create a later backend task only if approved

Manual/protected rows:

- lock selection and price inputs
- show `Protected manual zone`
- optional secondary action: `Check diagnostics`
- never write to the manual zone from this page

Missing setup rows:

- lock price inputs
- show `Missing setup`
- primary action: `Open Generator`
- Generator can create or repair through preview/apply

Conflicts:

- show `Conflict detected`
- primary action: `Check diagnostics`
- do not present price edit controls

Deletes/reset:

- do not show on this page
- do not ship disabled destructive controls that invite unsupported behavior

## Implementation Phases

### TASK-010C: Reference Page Integration

Port the reference Shipping Zones UI into production components using current diagnostics, wilayas, method definitions, pending price state, and the existing preview/apply clients.

Constraints:

- no backend changes
- no new backend write behavior
- no active enable/disable
- no reset/delete/adoption
- reference app files are not copied wholesale
- `index.tsx` is reduced to routing/tab orchestration

Acceptance:

- table renders from real diagnostics
- managed methods are editable locally
- protected/manual/missing/conflict rows are locked
- old -> new pending state appears
- pending bar appears
- no fake success state
- review dialog calls preview/apply and refreshes diagnostics after successful method updates

TASK-010C implementation note:

This integration has now been implemented in production components. The reference is used for UX structure and styling, while runtime data comes from the existing dataset, diagnostics, preview, and apply clients.

### TASK-010D: Browser Smoke Polish And Edge States

Acceptance:

- affected rows are reviewed before write
- backend preview revalidates ownership/conflicts
- apply updates only supported Yaxii-managed method labels/prices
- success uses real apply result counts
- diagnostics refresh after apply
- blocked preview shows clear next action

### TASK-010E: Follow-Up Cleanup If Needed

Polish and verify the integrated page in WordPress admin.

Acceptance:

- browser smoke covers managed price update
- browser smoke covers manual/protected lock
- browser smoke covers missing setup CTA
- responsive layout does not overlap
- WooCommerce zones opens in a new tab
- obsolete Shipping Zones code is removed from `index.tsx`

### Later: Enable/Disable Backend

Only if approved, scope backend support for enabling/disabling managed shipping methods. It must be previewed, confirmed, idempotent, and limited to Yaxii-managed methods.

## Risks

- The reference is visually strong but mock-driven; copying it directly would create fake writes.
- Active enable/disable controls would imply unsupported WooCommerce writes.
- Reset/default actions are dangerous without a scoped backend and confirmation model.
- The reference table grid needs responsive hardening before shipping.
- The current `PreviewPlanPanel` is setup-oriented; reusing it unchanged for daily price edits may keep the UX too technical.
- Exact row status mapping must avoid overclaiming ownership or support.
- External Google Fonts and Lovable runtime files would violate the local-first WordPress.org direction.

## Next Recommended Task

TASK-010C should integrate the reference Shipping Zones component shell with real diagnostics and local pending price changes only. It should not add backend behavior. The first implementation task should focus on replacing the daily-management surface while keeping the existing preview/apply contract untouched.
