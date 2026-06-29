# Product Flow UX Audit

Date: 2026-06-29

## Goal

Audit the current Yaxii Shipping Manager tabs and workflows before another UI or backend task. This is an audit and planning document only. No product code was changed for this audit.

The main finding is that the backend is now safer and more capable than the product flow suggests. The UI still asks merchants to think like implementers: drafts, diagnostics, preview groups, generator paths, managed registry ownership, and future controls compete with the daily job of editing shipping prices.

## Current Product Model

Recommended product roles:

| Area | Product role | Merchant expectation |
| --- | --- | --- |
| Shipping Zones | Daily management center | Check live shipping coverage, edit managed prices, review and update WooCommerce safely |
| Generator | Initial setup and bulk setup wizard | Create missing Yaxii-managed zones and methods, or prepare broad changes |
| Diagnostics | Support and advanced health check | Understand conflicts, missing setup, and WooCommerce risk when something looks wrong |
| Settings | Defaults and naming rules | Configure defaults used by new previews and future setup work |
| Import / Export | Later bulk tooling | Disabled until real CSV backend exists |
| Smart Form Sync | Later ecosystem integration | Hidden or clearly coming later until real YSF integration exists |

## Tab Audit

### Shipping Zones

Purpose:

Shipping Zones should be the main daily management center for Algeria shipping prices and supported method actions. Merchants should land here to answer: are my shipping zones working, what are my Home and Office prices, and how do I update them safely?

What it shows now:

- Live WooCommerce status summary.
- Active wilaya count, managed method count, and pending-change count.
- Safety card explaining review before WooCommerce update.
- Search and filters for all, active, needs update, missing setup, manual conflict, and pending changes.
- Table rows for wilaya, status, Home price, Office price, and row details.
- Price inputs for registry-owned Home and Office methods.
- Free shipping switch for supported price cells.
- Bulk selected-row price controls.
- Sticky `Review changes` workflow when pending prices exist.
- Diagnostics and native WooCommerce settings links.

Controls that are real:

- Live diagnostics read from WooCommerce through the diagnostics endpoint.
- Price edits create pending changes for registry-owned methods.
- Free shipping sets pending price `0`.
- Bulk price and bulk free shipping affect selected registry-owned rows only.
- `Review changes` calls the preview endpoint and then uses the existing safe apply panel.
- `WooCommerce zones` opens the native WooCommerce shipping settings in a new tab.
- Manual or unknown methods are blocked from table editing.

Controls that are confusing:

- `Open Generator` is still too prominent for a daily management page. It implies the wizard is the answer to routine price edits.
- `Needs update` can mean either local draft differs from live WooCommerce or a pending change exists, but the next action is not always obvious enough.
- The safety card and sticky review bar both explain review, creating repeated process copy.
- Filters are useful for agencies, but they may be too much for a small merchant when all they need is price editing.
- Bulk changes are powerful but should be visually secondary to row-level editing.
- Details are hidden by default, which is correct, but even the visible status system still carries technical categories such as manual conflict and missing setup.

Controls that are too technical:

- Ownership distinctions should not be central outside details. Merchants need `Managed by Yaxii`, `Manual zone`, or `Needs review`, not registry logic.
- Diagnostics should be secondary and named like a support tool, not a main daily action.
- The preview/apply panel still exposes setup-level language even when it is launched from a one-row price edit.

Controls that should move to Generator:

- Broad setup mode decisions.
- Dataset mode selection.
- Wilaya coverage selection.
- Commune visibility.
- Delivery method selection.
- Default method labels and broad pricing defaults.
- Zone name format and prefix decisions.
- Initial missing-zone and missing-method creation.

Controls that should become direct simple safe actions:

- Editing managed Home price.
- Editing managed Office price.
- Setting a managed method price to free.
- Bulk applying a price to selected managed rows.
- Reviewing and applying only the pending method price changes.

What the merchant should understand in 5 seconds:

Your live Algeria shipping prices are here. Change Home or Office prices, then click one clear save/review action. Manual WooCommerce zones are protected.

What agencies should do quickly:

- Search a wilaya by code or name.
- Filter to missing setup, conflicts, or pending changes.
- Bulk update managed Home or Office prices.
- Open diagnostics when a conflict blocks safe updates.
- Open native WooCommerce zones in a new tab for inspection.

Recommendation:

Keep Shipping Zones as the main management page. Reduce it to one clear daily workflow: edit prices, review update, confirm. Move setup/bulk creation back into Generator. Keep diagnostics as secondary.

### Generator

Purpose:

Generator is the setup and bulk preparation wizard. It should help a merchant create missing Yaxii-managed zones and methods, review broad coverage, and prepare larger changes safely.

What it shows now:

- Setup mode.
- Wilaya coverage.
- Commune visibility.
- Delivery methods.
- Prices.
- Names and labels.
- Safety check.
- Preview and apply.

Current strengths:

- It uses real persisted settings.
- It lazy-loads communes.
- It auto-runs preview on the final step.
- It uses the real preview and apply endpoints.
- Preview-only mode exists.
- It protects manual zones by design.

Current weaknesses:

- It is too long for routine price edits after initial setup.
- It can pull merchants away from the table even when a safe table update would be clearer.
- `Fresh setup`, `Continue existing`, and `Preview changes` need sharper job definitions.
- The same preview/apply panel serves both initial setup and daily price edits, but the copy still leans toward setup.

Recommended role:

- Fresh setup: onboarding path for stores with no Yaxii-managed setup.
- Continue existing: add missing managed zones or methods and handle broad setup corrections.
- Preview changes: support/agency planning mode with no apply pressure.
- Daily price edits: should stay in Shipping Zones, not require the full wizard.

### Diagnostics

Purpose:

Diagnostics is mostly support and agency/debug tooling. It should not be the daily merchant home.

What it shows now:

- Algeria state registration status.
- Configured, missing, conflict, zones-without-methods, fallback-risk, and rest-of-world summaries.
- Recommended next action.
- Full wilaya coverage table.
- Existing WooCommerce zones with ownership hints and method facts.
- Local draft method simulator.

Recommendation:

Keep Diagnostics available, but move it behind a `Tools` or `Advanced` mental model in the UI. Shipping Zones should surface only the diagnostic result needed for action. Diagnostics should explain conflicts, missing setup, fallback risk, and manual-zone protection for agencies/support.

Merchant-facing content:

- Store health summary.
- Missing setup count.
- Conflict count.
- Clear next action.

Agency/support content:

- Full wilaya diagnostic table.
- WooCommerce zone IDs.
- Ownership hints.
- Method counts, disabled methods, and cost facts.

### Import / Export

Purpose:

Future bulk tools.

What it shows now:

- Disabled CSV import.
- Disabled validation and preview import.
- Disabled export rows for local draft configuration and WooCommerce snapshot.

Not implemented:

- CSV upload backend.
- CSV validation backend.
- Export endpoint.
- WooCommerce snapshot export endpoint.

Recommendation:

Keep it as Coming Soon or hide it until scoped. If visible, it should be small and honest: `CSV tools are not available yet.` CSV import/export can be MVP only if a real backend task is prioritized; otherwise it should not compete with the core setup and price-management flow.

### Settings

Purpose:

Settings should define defaults used by Generator and future setup work. It should not imply immediate changes to existing WooCommerce zones.

What is real:

- Settings are persisted through the settings endpoint.
- Dataset mode is stored, but only current mode is available.
- Region label format is stored.
- Zone name format and prefix are stored.
- Office wording and custom label are stored.
- Method labels, enabled state for optional methods, and default prices are stored.
- Safety rules are locked on.

What affects Generator:

- Dataset mode.
- Region label format.
- Zone naming.
- Zone prefix.
- Office wording and custom label.
- Method templates and default prices.
- Optional custom method enabled state.

What affects existing WooCommerce zones:

- Settings save itself does not update existing WooCommerce zones or methods.
- Existing Yaxii-managed method labels and prices can be updated only through preview/apply when the generated preview includes supported `updateMethods` work.
- Existing zone names are previewed but not applied yet.

Confusing parts:

- Method label/default price edits in Settings can look like live WooCommerce changes.
- The `Save settings` action is correctly scoped, but merchants may expect it to update checkout prices.
- The `Reset to defaults` button can look dangerous even though it resets plugin settings, not WooCommerce zones.

Recommendation:

Simplify Settings into defaults and naming rules. Add very direct copy: `Save settings changes future drafts. It does not update existing WooCommerce shipping zones.` Any existing-zone update should be launched from Shipping Zones or Generator preview/apply.

### Smart Form Sync

Purpose:

Future YSF ecosystem feature.

What it shows now:

- Coming later.
- No sync active.
- No reads or writes.

Recommendation:

Hide it until YSF integration is scoped, or leave it as a small disabled roadmap item under Tools. It should not be a primary tab in the first free release because it makes the MVP look broader than it is.

## Current Workflow Map

### Initial Setup

Current flow:

1. Merchant opens Generator.
2. Chooses setup mode.
3. Selects wilayas.
4. Optionally views communes.
5. Chooses delivery methods.
6. Sets prices.
7. Sets names and labels.
8. Reviews safety.
9. Preview auto-runs.
10. Merchant checks confirmation.
11. Apply creates missing managed zones, adds methods, or updates registry-owned method labels/prices where supported.

Backend reality:

- Create managed zones is supported.
- Add missing methods is supported.
- Update managed method labels/prices is supported.
- Manual zones are protected.
- Conflicts block apply.

UX issue:

This is good for setup, but too heavy for routine edits.

### Daily Price Update

Current flow:

1. Merchant opens Shipping Zones.
2. Edits a managed price or toggles free shipping.
3. Row and sticky bar show pending changes.
4. Merchant clicks `Review changes`.
5. The same preview/apply panel appears.
6. Merchant checks `I reviewed this setup`.
7. Apply updates the Yaxii-managed method price.

Ideal flow:

1. Merchant opens Shipping Zones.
2. Edits a price in the row.
3. Row clearly shows changed from old price to new price.
4. One action appears: `Review and update`.
5. The system revalidates WooCommerce in the background and shows a short confirmation summary.
6. Merchant confirms `Update prices`.
7. WooCommerce is updated.
8. Success says exactly which methods and wilayas changed.

Recommendation:

Use a `Review & Apply` modal or focused inline panel for table price edits. Avoid sending merchants into the full Generator. Keep the preview/apply backend contract, but translate it into a price-update experience.

### Manual-Zone Conflict

Current behavior:

- Diagnostics reports duplicate conflicts.
- Preview returns blocked readiness.
- Apply blocks if conflicts exist.
- Manual or unknown zones cannot be edited through the table.

UX issue:

Merchants may not know whether they should use WooCommerce, call support, or remove something. The UI should say: `This wilaya has a manual WooCommerce zone. Yaxii will not change it. Open Diagnostics or WooCommerce zones to review.`

### No-Op State

Current behavior:

- Preview can return no creates, no method additions, and no method updates.
- Preview panel says setup already exists.

Recommended state:

Shipping Zones should show `All managed prices are up to date` and avoid a review/apply call unless the merchant edits something.

### Preview-Only Mode

Current behavior:

- Generator supports preview-only setup mode and hides apply.

Recommendation:

Keep preview-only in Generator for agencies and support. It should not be a daily table mode. Shipping Zones should always be live manager mode, with safe confirmation only after changes.

## Better Product Flow

Recommended plugin flow:

1. Merchant opens Shipping Zones first.
2. If setup exists, they manage prices there.
3. If setup is missing, the page offers `Create setup with Generator`.
4. Generator handles initial setup and broad bulk changes.
5. Shipping Zones handles routine price updates.
6. Diagnostics explains blockers and support details.
7. Settings controls defaults for future drafts.
8. Import / Export and Smart Form Sync stay hidden or clearly future until real backend work exists.

## Shipping Zones Daily Management Recommendation

Best daily update pattern:

Use `Review & Apply` for table price updates, not a one-click direct save and not a full sticky workflow that looks like a separate draft system.

Why:

- One-click save is fast, but WooCommerce zone writes are store configuration and must be revalidated.
- A full generator handoff is safe, but too heavy for changing one price.
- A sticky pending bar is useful for multiple changes, but it should say `Review & apply price updates`, not generic `Review changes`.

Recommended interaction:

1. Inline price cell accepts the new price.
2. Cell shows `700 DZD -> 750 DZD` or `Free`.
3. Bottom bar says `3 price updates ready`.
4. Primary action says `Review & apply`.
5. Modal or focused panel says exactly:
   - wilayas affected
   - method affected
   - old price
   - new price
   - manual zones will not be touched
   - WooCommerce will be checked again before update
6. Merchant clicks `Update prices`.
7. Apply result says:
   - `Updated Home delivery in 3 wilayas`
   - `Manual zones were not touched`
   - `No duplicate methods were created`
8. Diagnostics refreshes after success.

## Backend Capability vs UI Expectation

| UI control or expectation | Supported now | Supportable with existing backend | Needs new backend task | Recommendation |
| --- | --- | --- | --- | --- |
| Read live zone status | Yes | Yes | No | Keep in Shipping Zones |
| Read live managed method prices | Yes | Yes | No | Keep in table |
| Edit managed Home price | Yes, through preview/apply | Yes | No | Make a direct table price-update flow using existing preview/apply |
| Edit managed Office price | Yes, through preview/apply | Yes | No | Same as Home |
| Set managed price to free | Yes, price `0` | Yes | No | Keep as inline free option |
| Bulk-set managed prices | Yes, through preview/apply | Yes | No | Keep secondary for agencies |
| Create missing managed zones | Yes | Yes | No | Keep in Generator |
| Add missing managed methods | Yes | Yes | No | Keep in Generator and setup repair |
| Update managed method labels | Yes, through preview/apply | Yes | No | Keep mainly in Generator/Settings-driven preview, not daily table |
| Enable or disable methods | No | No | Yes | Hide from table until scoped |
| Update WooCommerce zone names | No, preview only | No | Yes | Keep as future task |
| Delete zones or methods | No | No | Yes, dangerous | Do not add for MVP |
| Reset or wipe setup | No | No | Yes, dangerous | Do not add without explicit safe backend |
| Adopt manual zones | No | No | Yes, dangerous | Keep out of MVP |
| Edit manual or unknown methods | No | No | Yes, risky | Keep protected and route to WooCommerce |
| CSV import | No | No | Yes | Coming Soon or hidden |
| CSV export | No | No | Yes | Coming Soon or hidden |
| Commune-level pricing | No | No | Yes, custom shipping method required | Do not imply availability |
| Provider import or dispatch | No | No | Yes, out of scope | Hide |
| YSF sync | No | No | Yes, out of scope | Hide or Coming Soon under Tools |
| Settings save updates existing zones | No | Existing backend can later preview method label/price updates, but settings save does not apply them | May need a clearer settings-to-preview flow | State clearly that settings affect future drafts |

## Specific Shipping Zones Feedback

- Too many top cards and notices: reduce to one status strip plus one compact action area.
- `Open Generator` can be overused: show it only when setup is missing or merchant chooses bulk setup.
- Diagnostics should be secondary: rename to `Advanced diagnostics` or move under Tools.
- WooCommerce zones should open in a new tab: current behavior is correct and should remain.
- Table should not show too much live technical data: keep zone IDs and ownership internals hidden in details or Diagnostics.
- Details should be hidden: current default is correct.
- Actions column should not have random buttons: current details-only approach is better; future row actions should be limited to supported actions.
- Home free and Office free should be clean inline free options: current switch is better than row action buttons, but it should read as part of price editing.
- Enable/disable should not appear if not supported: keep only a small coming-later note outside the table or remove entirely.
- `Needs update` needs a clear next action: pair it with `Review & apply price updates` and show what changed.
- Changing a price needs an obvious save/update path: use `Review & apply`, not `Open Generator`.
- The table should feel real: stop calling supported changes local drafts; call them pending WooCommerce updates that require review.

## Recommended Next Product Task

TASK-010B should redesign only the Shipping Zones daily price-update flow on top of the existing preview/apply backend:

- Replace generic pending-copy with price-update-specific copy.
- Replace or refine sticky `Review changes` into `Review & apply price updates`.
- Add old-price to new-price summaries.
- Keep Generator out of routine price edits.
- Hide unsupported enable/disable from the table.
- Keep diagnostics and WooCommerce zones secondary.
- Do not add backend writes beyond the existing SafeApplyEngine.
