# Release UX and Workflow Audit

Date: 2026-06-30

Task: TASK-012A - Deep Release UX and Workflow Audit

This is an audit and planning document only. No product code, backend behavior, WooCommerce write path, reset tooling, CSV backend, commune pricing, provider integration, Smart Form sync, telemetry, licensing, Pro lock, remote asset, or external service behavior was implemented.

## Executive Summary

Yaxii Shipping Manager is technically close to a useful free MVP, but the release UX is still too broad. The safest backend paths are now real: the plugin can read WooCommerce diagnostics, preview shipping-zone work, create missing Yaxii-managed zones, add flat-rate methods, update registry-owned method prices and labels, and enable or disable registry-owned methods after fresh preview revalidation. The problem is that the admin UI still exposes future-only workflows beside the real workflows.

The release product should be simplified around four jobs:

1. Manage existing Yaxii-managed prices and method status in Shipping Zones.
2. Generate or repair Yaxii-managed setup through preview/apply.
3. Diagnose conflicts, missing setup, and checkout fallback risk.
4. Save defaults for future generator drafts.

Top-level Import / Export and Smart Form Sync should be hidden before release. Communes should stop being a main generator step. Legacy 58 mode should be hidden or moved to support copy until a verified mapping is available. `Protected` should be renamed because it does not tell merchants what exists or what action is possible.

## Evidence Reviewed

Read:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/APPLY-ENGINE.md`
- `docs/APPLY-CONTRACT.md`
- `docs/APPLY-WORKFLOW.md`
- `docs/PREVIEW-PLANNER.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/DIAGNOSTICS-REFERENCE-INTEGRATION-PLAN.md`
- Latest TASK-010 and TASK-011 reports, including TASK-010G, TASK-010H, TASK-011B, TASK-011D, TASK-011E, TASK-011F, and TASK-011G.

Inspected:

- `admin-app/src/routes/index.tsx`
- `admin-app/src/components/shipping-zones/`
- `admin-app/src/components/generator/`
- `admin-app/src/components/diagnostics/`
- `admin-app/src/api/`
- `admin-app/src/types/`
- `src/Rest/`
- `src/Preview/`
- `src/Apply/`
- `src/Settings/`
- `src/WooCommerce/`

## Current Backend Boundary

Backend-supported today:

- Read current dataset records and communes from local files.
- Read and save plugin settings in `yaxii_shipping_manager_settings`.
- Read WooCommerce zones and methods through diagnostics.
- Preview create zones, update zone names, add methods, update methods, update method status, skip manual zones, conflicts, warnings, and unchanged rows.
- Apply only supported work after nonce, capability, confirmation contract, preview hash, summary, safety policy, and fresh preview revalidation.
- Create missing Yaxii-managed zones.
- Add enabled `flat_rate` methods for supported method keys.
- Update registry-owned method title and cost.
- Enable or disable registry-owned flat-rate method instances.
- Preserve manual and unknown zones by default.

Not supported today:

- Updating WooCommerce zone names.
- Deleting zones or methods.
- Adopting manual zones.
- Updating manual or unknown methods.
- Reset or wipe tools.
- CSV import/export backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Full checkout proof.

## Full Tab Audit

| Tab | Purpose | Current visible content | What works | Confusing or release risk | Dead/future-only | Release decision |
| --- | --- | --- | --- | --- | --- | --- |
| Shipping Zones | Daily management center for existing Yaxii-managed setup. | Status card, search/filter, wilaya rows, dynamic method columns, price inputs, row active switch, bulk tools, repair, diagnostics, WooCommerce zones. | Real diagnostics, real pending changes, safe review/apply, repair flow, dynamic custom method display. | `Protected` is vague; `Needs update` can flash after apply; row active switch can feel like it disables a whole zone; advanced row details are still technical. | Manual adoption, zone name updates, delete/reset are absent and mostly hidden. | Keep as primary tab. Must fix labels and post-apply state. |
| Generator | Setup or repair assistant. | Nine-step modal: setup mode, wilayas, communes, methods, prices, names, safety, preview, generate. | Uses real dataset, real preview, real apply, lazy commune loading, safe apply. | Too long for MVP; setup modes mostly share same backend; communes are prominent but not used by engine; safety is a full step for static rules; disabled legacy and CSV compete with real setup. | CSV card, legacy mode, commune decision as primary step. | Simplify to 4-5 steps. Keep as setup/repair path, not daily manager. |
| Diagnostics | Read-only health check. | Overall health, passed/warnings/failures, health cards, recommendation, actions, collapsed advanced details. | Real diagnostics endpoint, clear read-only framing, no writes. | Cards describe findings but not fixes; all actions are generic; advanced details still dumps full coverage; rest-of-world warning needs merchant context. | Checkout proof remains intentionally absent. | Keep, but make issue-first with action per issue. |
| Settings | Persist defaults. | Dataset mode, label formats, zone prefix, office wording, methods, default prices, safety rules, reset/save. | Real settings save; nonce/capability protected; does not write WooCommerce. | Save settings can be read as live WooCommerce update; method labels/default prices overlap with Shipping Zones live edits; legacy mode appears. | Legacy selection, locked safety toggles as controls, method enable flags for future setup only. | Keep but rename structure to "Defaults"; add stronger copy and move some controls to Generator. |
| Import / Export | Future CSV tools. | Top-level tab with disabled upload, validate, and export controls. | Honest disabled copy. | Makes release feel unfinished; WordPress.org risk if perceived as bait or placeholder. | Entire tab. | Hide before release. Later add under Tools when backend exists. |
| Smart Form Sync | Future ecosystem sync. | Top-level coming-later screen. | Honest: no reads/writes. | Top-level sync promise distracts from free shipping manager; may look like cross-product teaser. | Entire tab. | Hide before release. Keep only as later roadmap doc unless explicitly scoped. |

## Shipping Zones Audit

### Statuses

| Status | Technical meaning today | Merchant understanding | Current action | Recommended wording/action |
| --- | --- | --- | --- | --- |
| Active | A matching direct WooCommerce zone exists, is in the managed registry, has required managed methods, and saved draft defaults match live method costs. | Setup is working. | Editable price cells, row active switch, bulk tools. | Keep `Active`. Action: edit price or status, then review changes. |
| Missing setup | No matching zone, missing registry-owned zone, or required managed methods are missing. | Something was deleted or not installed. | `Repair setup` when safe, otherwise Generator. | Keep `Missing setup`. Action: `Repair setup` with copy: "Recreate missing Yaxii-managed zone or methods." |
| Needs update | Managed zone exists, but local draft/default prices differ from live WooCommerce diagnostics. Pending changes also count in the filter. | Ambiguous: may mean broken, stale, or waiting for refresh. | Editable row and review path. | Rename to `Price differs` or `Review price change` when there is a real draft difference. Use `Updating...` after apply until diagnostics refresh. |
| Protected | Diagnostics found a manual/unknown direct zone or protected row; Yaxii cannot edit it. | Too vague. "Protected" does not say who owns it or what the user can do. | `Diagnostics` button. | Best badge: `Manual zone`. Secondary text: `Protected by Yaxii`. For Yaxii-looking but unregistered zones use `Not managed by Yaxii`. Action: `Review in Diagnostics` and `Open WooCommerce zones`. |
| Conflict detected | More than one direct WooCommerce zone matches a wilaya. Apply blocks. | Something duplicates the same area. | `Diagnostics`. | Keep `Conflict detected`. Action: `Resolve duplicate zones in WooCommerce` plus Diagnostics details. |
| Disabled | Not a row status. A managed method can be disabled while the row remains active if other methods remain enabled. | The method is off at checkout. | Muted method cell; enable through row/bulk controls. | Keep `Disabled` on method cells only. Avoid row-level disabled unless all managed methods are off; then consider `Methods disabled`. |
| Pending changes | Local frontend draft change not yet applied. | Waiting for review/save. | Sticky pending bar and review dialog. | Keep `Pending`. Primary action: `Review changes`. |

### Protected Wording Recommendation

Use two labels instead of one overloaded label:

- `Manual zone` for `manual_unknown` zones. In details: `Yaxii will not edit this WooCommerce zone. Use WooCommerce zones or resolve it manually.`
- `Not managed by Yaxii` for Yaxii-looking/name-hint zones that are not in the managed registry. In details: `This zone name looks related, but it is not recorded in Yaxii's managed registry.`

Avoid `WooCommerce-managed`; all zones are WooCommerce zones, so that wording is not specific enough. Avoid `Needs review` as the badge because it hides ownership. Avoid bare `Protected` because it explains Yaxii's behavior, not the merchant's store state.

### Price Update Behavior

Likely cause:

- The table row status is computed from the current frontend draft/default model and the diagnostics response.
- After applying a price change, `ReviewChangesDialog` clears pending changes and triggers a diagnostics refresh only when the apply response reports a WooCommerce change.
- During the short period before the refreshed diagnostics response arrives, the row can still be comparing the updated local draft against the old diagnostics price. That makes `hasDraftPriceDifference` return true and the row shows `Needs update`.
- After the diagnostics refresh returns current WooCommerce data, the row returns to `Active`.

Recommended fix:

- Add an explicit post-apply refresh state for affected wilaya/method keys.
- Show `Updating...` or `Refreshing WooCommerce...` instead of `Needs update` while diagnostics are stale.
- Keep pending changes visible until either diagnostics confirms the new value or a timeout/error explains that verification failed.
- Consider carrying `lastApplyAffectedKeys` and suppressing `Needs update` for those keys until diagnostics generation time changes.

This appears to be stale UI state, not evidence that the backend apply engine is writing incorrectly.

### Actions

| Action | Current state | Audit decision |
| --- | --- | --- |
| Inline price editing | Real for registry-owned, enabled methods. | Keep. Add clearer disabled tooltip/copy for manual/missing rows. |
| Free shipping | Real as price `0` through quick tools. | Keep. Allow fixed price tool to accept `0` explicitly where not already accepted. |
| Enable/disable | Real for existing registry-owned methods through preview/apply. | Keep. Clarify row active switch means methods, not zone deletion. |
| Bulk tools | Real for editable/toggleable selected managed rows. | Keep, but reduce visual noise on first release if too dense. |
| Repair setup | Real for missing managed zones/methods through preview/apply. | Keep. It should be the primary action for `Missing setup`. |
| Diagnostics action | Real navigation only. | Rename to `Review issue` or `Review in Diagnostics`; Diagnostics must explain next steps. |
| Open Generator | Real navigation/modal. | Keep for setup/repair; avoid using it as the answer to manual conflicts. |
| Open WooCommerce zones | Real native WooCommerce link. | Keep for manual/conflict cases. Make it more prominent in Diagnostics. |
| Reset/delete/adopt | Not visible as active actions. | Keep hidden. |

## Generator Audit

Current steps:

1. Start/setup mode.
2. Wilaya coverage.
3. Communes.
4. Methods.
5. Prices.
6. Names.
7. Safety.
8. Preview.
9. Generate.

Main problems:

- Fresh setup, Continue existing, and Preview changes do not produce distinct backend strategies. The preview planner reads current WooCommerce state and decides create/add/update/skip/conflict. Setup mode mostly changes selected defaults and whether generate is allowed.
- Preview changes is useful for agencies but weak as a primary MVP mode. It is better as a checkbox or final-step option: `Preview only, do not apply`.
- CSV import is shown in the wizard and also as a top-level tab, but no backend exists.
- Communes are presented as a main choice even though the current WooCommerce engine creates wilaya-level zones only.
- Safety is static and can be merged into preview/generate instead of consuming a full step.
- Legacy 58 mode is disabled in coverage and Settings. It is honest but distracting.
- The Generator still feels like the central product, while Shipping Zones has become the daily manager.

Recommended simplified Generator flow for release:

1. `Coverage and setup`
   - Select current dataset wilayas.
   - Hide legacy mode behind small text: `Legacy compatibility is not available in this release.`
   - Offer one optional `Preview only` checkbox.
2. `Methods and prices`
   - Choose Home, Office, and optional custom slots.
   - Set defaults and per-wilaya overrides.
3. `Names`
   - Zone prefix, zone format, region label, method labels.
   - Copy must say zone names are used for new zones and previewed updates; existing zone renames are not applied yet.
4. `Preview`
   - Auto-run preview.
   - Show creates, method additions, method updates, method status updates, manual skips, conflicts.
   - Show safety rules inline.
5. `Generate setup`
   - Only when supported work exists and no conflicts exist.
   - If no work is needed, route to Shipping Zones.

Communes should be removed as a main step. Use a small collapsed `Commune coverage` info panel under Coverage: `Yaxii uses wilaya-level WooCommerce zones in this release. Commune lists are informational only.`

CSV should not replace Preview changes until CSV backend exists. If the user wants the visual slot preserved, use a disabled secondary card inside Tools, not a primary setup mode.

## Diagnostics Audit

What works:

- Diagnostics is read-only.
- The main view no longer exposes raw wilaya tables by default.
- Health cards are based on real diagnostics response fields.
- The recommendation card routes to Shipping Zones, Generator, WooCommerce zones, or refresh.

Gaps:

- Most cards are status summaries, not problem-solving guidance.
- The recommendation is global, so a merchant with a protected zone still has to infer the exact next action.
- `Open Generator` is shown even when the issue is manual zones, where Generator will skip or block instead of fixing the manual zone.
- Advanced details still starts with full wilaya coverage. That is useful for support, but issues should appear first.
- Rest-of-world warning needs plain merchant framing: it may be intentional for Algeria-only COD stores; it is not automatically an error.
- Method issues combine missing, disabled, and missing home/office-like method signals into one count without showing the affected zones in the main view.

Recommended changes:

- Give each warning/failure card an action label:
  - Missing setup: `Repair in Shipping Zones`.
  - Conflict: `Open WooCommerce zones` and `Review duplicate zones`.
  - Manual/protected zones: `Open WooCommerce zones`.
  - Method issues: `Open Shipping Zones`.
  - Rest-of-world: `Confirm in WooCommerce`.
- In advanced details, show an issue list first, then the full wilaya list behind a second accordion: `Full dataset coverage for support`.
- Hide the full current dataset list by default and provide `Copy support summary` later.
- Explain manual/protected zones as: `Yaxii found a WooCommerce zone it does not own. It will not edit it.`
- Explain rest-of-world as: `Only relevant if customers may enter addresses outside configured Algeria wilaya zones.`

## Settings Audit

Settings that affect future setup only:

- Dataset mode.
- Region label format.
- Zone name format.
- Zone prefix.
- Office method wording.
- Method labels.
- Default method prices.
- Optional custom method enabled flags.

Settings that affect existing WooCommerce setup directly:

- None by saving settings alone.

Settings that may affect existing setup through a later preview/apply:

- Method labels and default prices can influence Generator or Shipping Zones preview payloads.
- Zone naming can create preview-only `updateZones`, but existing zone-name writes are not implemented.

UX problems:

- `Save settings` can sound like it updates WooCommerce.
- Method settings duplicate operational controls from Shipping Zones.
- `Zone name format` and `Zone prefix` are useful, but existing zone rename is unsupported.
- Legacy dataset mode appears even though it cannot be selected.
- Locked safety rules are shown as disabled controls, which suggests they are configurable.

Release-ready Settings structure:

1. `Defaults for new previews`
   - Dataset: show current only.
   - Default method labels and prices.
   - Optional custom method slots.
2. `Naming for generated zones`
   - Zone prefix.
   - Zone name format.
   - Region label format.
   - Copy: `Existing WooCommerce zone names are not changed by saving settings.`
3. `Safety policy`
   - Read-only checklist, not disabled switches.
   - Copy: `These rules are always on in this release.`

Primary save copy:

`Save defaults`

Success copy:

`Defaults saved. Existing WooCommerce shipping zones were not changed.`

## Import / Export and Smart Form Sync Audit

Import / Export is visible and not implemented. It has disabled upload, disabled validation, disabled export rows, and copy that says backend endpoints are not connected.

Smart Form Sync is visible and not implemented. It says no sync is active and performs no reads or writes.

Release decision:

- Hide both top-level tabs before WordPress.org release.
- Do not keep them as disabled teasers in the main navigation.
- Do not move them to a visible Coming Soon page for the first release.
- If a roadmap mention is needed, put it in documentation, not the merchant's daily admin UI.

WordPress.org risk:

- The copy is currently honest and not a paid lock, but top-level disabled features can still look like unfinished software or a teaser-heavy interface. For a free WordPress.org MVP, hiding inactive surfaces is safer and clearer.

## Workflow Audit

| Workflow | Current behavior | Expected merchant behavior | UX gap | Recommended fix |
| --- | --- | --- | --- | --- |
| Fresh install / no zones | Shipping Zones shows missing setup; Generator can create zones/methods after preview/apply. | Merchant wants one clear setup path. | Generator has too many steps and future-only choices. | Default to simplified Generator with all current wilayas selected and clear Generate action. |
| Existing manual zones | Rows become protected/conflict; Generator skips or blocks manual zones. | Merchant wants to know if Yaxii can use existing zones or what to do. | `Protected` and Diagnostics do not explain enough. | Use `Manual zone` wording; explain Yaxii cannot edit/adopt yet; offer WooCommerce zones link. |
| Fully managed setup | Shipping Zones shows active rows and editable prices/status. | Merchant changes prices daily. | Good core flow, but bulk tools may be dense. | Keep Shipping Zones primary; improve post-apply state and row copy. |
| Missing setup after deletion | Missing rows show Repair setup; repair uses preview/apply. | Merchant expects restoration. | Good capability. Needs clearer copy that default prices will be used for missing methods. | Keep; make `Repair setup` primary and show exact methods/prices before apply. |
| Daily price change | Inline price creates pending change; review/apply writes safely. | Merchant expects row to remain stable after save. | `Needs update` can flash while diagnostics refresh. | Add `Updating...` verification state after apply. |
| Free shipping change | Quick tool sets price to `0`; apply writes supported update. | Merchant expects free shipping to be explicit. | Fixed price popover currently favors positive values; free mostly through Make free. | Keep Make free; allow `0` in fixed price controls. |
| Enable/disable method | Row/bulk controls create pending status updates; apply writes enabled state. | Merchant expects no deletion. | Row active switch may imply disabling a zone. | Label as `Methods active` or add tooltip/copy. |
| Bulk price change | Selection quick tools create pending changes. | Agency users expect efficient batch edits. | Dense controls can overwhelm merchants. | Keep but group under `Bulk edit selected`. |
| Diagnostics warning | Diagnostics shows card and generic actions. | Merchant wants a fix path. | Actions not tied to the issue. | Add issue-specific next action per card. |
| Settings change | Save persists plugin defaults only. | Merchant may expect live WooCommerce updates. | Copy is present but not strong enough. | Rename to `Save defaults`; success copy says no WooCommerce changes. |
| Preview-only / agency review | Setup mode hides apply and shows diagnostics action. | Agency wants export/shareable review later. | Top-level mode is too similar to normal flow and has no export. | Move to final preview toggle; later add export/copy support. |
| Checkout verification | Diagnostics estimates fallback risk; no full checkout proof. | Merchant wants to know checkout works. | UI can imply protection but not full proof. | Keep wording soft; add a manual checklist or later real checkout simulator only when implemented. |

## Backend Capability vs UX Promises

| Feature / user expectation | Backend support today | UI support today | UX problem | Release decision |
| --- | --- | --- | --- | --- |
| Create zones | Yes, managed zones only after preview/apply. | Generator and repair. | Generator too long. | Ship after simplification. |
| Add methods | Yes, managed zones only. | Generator and repair. | Good, but custom method settings/display need clearer persistence model. | Ship. |
| Update prices | Yes, registry-owned methods. | Shipping Zones and Generator preview. | Stale `Needs update` flash. | Must fix before release. |
| Update labels | Yes, registry-owned methods. | Generator/Settings-driven preview can request it. | Settings save does not apply labels directly. | Ship with clearer copy. |
| Enable/disable | Yes, registry-owned methods. | Shipping Zones row/bulk controls. | Row switch wording can imply zone disable. | Should fix before release. |
| Repair missing setup | Yes for missing managed zones/methods. | Shipping Zones repair dialog. | Needs exact preview clarity. | Ship. |
| Manual conflict protection | Yes. | Protected/conflict statuses. | `Protected` too vague. | Must fix before release. |
| Manual adoption | No. | No active adoption action. | Users may expect "continue existing" to adopt. | Hide/clearly state unsupported. |
| Zone name updates | Preview only. Apply blocks/does not write. | Names/Settings can imply naming changes. | Existing zones not renamed. | Can ship as limitation if clearly labeled. |
| Reset/delete | No. | No active reset/delete. | None. | Keep hidden. |
| CSV import/export | No. | Top-level disabled tab and wizard card. | Looks unfinished. | Hide until ready. |
| Commune pricing | No. | Commune step/list. | Main-step prominence implies support. | Hide as main step; info only. |
| Provider imports | No. | Not visible as active workflow. | None. | Keep hidden. |
| YSF sync | No. | Top-level disabled tab. | Distracts and may look like teaser. | Hide until ready. |
| Settings defaults | Yes. | Settings tab. | Could be misunderstood as live WooCommerce update. | Rename/copy fix. |

## Suggestions and Priorities

### Must Fix Before Release

- Rename and explain `Protected`. Use `Manual zone` or `Not managed by Yaxii`, with `Protected by Yaxii` as supporting text.
- Fix post-apply status flash. Show `Updating...` or `Refreshing...` after successful apply until diagnostics confirms the result.
- Hide top-level Import / Export.
- Hide top-level Smart Form Sync.
- Simplify Generator and remove communes as a main step.
- Make Settings clearly about defaults, not live WooCommerce updates.
- Hide or de-emphasize legacy 58 mode until a verified safe mapping exists.

### Should Fix Before Release

- Add issue-specific actions to Diagnostics cards.
- Make advanced Diagnostics issue-first and move full wilaya coverage deeper.
- Clarify row active switch as method enable/disable, not zone deletion.
- Let fixed price tools accept `0` explicitly.
- Reduce bulk-tool density for merchants while keeping agency power available.
- Make repair preview show exact methods and prices that will be restored.

### Can Ship As Limitation

- Zone-name updates are previewed but not applied.
- Manual zones are protected, not adopted.
- Checkout diagnostics do not replace a real checkout test.
- Current setup is wilaya-level, not commune-level.
- Custom method slots are limited to two.

### Hide Until Ready

- CSV import/export UI.
- Smart Form Sync UI.
- Reset/delete/wipe tooling.
- Manual adoption.
- Provider imports.
- Commune-level pricing controls.
- Legacy 58 setup mode.

### Later Roadmap

- CSV import/export backend with validation and preview.
- Issue export/copy from Diagnostics for agencies.
- Manual zone adoption after a dedicated preview/confirmation model.
- Zone-name update support for managed zones.
- Support-safe checkout/rate verification.
- Commune-level shipping only after a real custom WooCommerce shipping method is scoped.
- YSF sync only after explicit product scope.

## Recommended Product Flow

Release navigation:

1. `Shipping Zones`
2. `Generator`
3. `Diagnostics`
4. `Settings`

Merchant flow:

1. On first install, open Generator.
2. Generate preview.
3. Apply safe managed setup.
4. Land in Shipping Zones.
5. Use Shipping Zones for price/status changes.
6. Use Diagnostics only when a status needs explanation.
7. Use Settings only for future defaults.

## Release-Readiness Scores

| Area | Score | Explanation |
| --- | ---: | --- |
| Shipping Zones UX | 7/10 | Real daily workflow exists, including prices, status changes, custom method display, and repair. Needs clearer protected/manual wording and post-apply refresh state. |
| Generator UX | 5/10 | Backend integration is real, but the flow is too long and includes main-step future/informational choices. |
| Diagnostics UX | 7/10 | Stronger health-check shape exists. Needs issue-specific actions and less full-list detail in advanced view. |
| Settings UX | 6/10 | Real settings save exists. Needs clearer "defaults only" structure and less live-update ambiguity. |
| Overall merchant clarity | 6/10 | The plugin is powerful but still presents too many jobs at once. Hide inactive tabs and shorten setup. |
| Technical safety | 8/10 | Preview/apply boundaries, nonce/capability checks, managed registry ownership, and manual protection are strong. Stale UI feedback is the main safety-perception gap. |
| WordPress.org readiness | 7/10 | No telemetry/licensing/remote assets found in inspected surfaces, but top-level disabled future features should be hidden before submission. |

## Suggested Next Implementation Tasks

1. TASK-012B: Hide unreleased tabs and simplify top navigation to Shipping Zones, Generator, Diagnostics, Settings.
2. TASK-012C: Rename protected/manual statuses and add actionable diagnostics copy.
3. TASK-012D: Add post-apply refreshing state to Shipping Zones rows and suppress stale `Needs update`.
4. TASK-012E: Simplify Generator flow by removing commune and safety as full steps, hiding legacy mode, and moving preview-only to final preview.
5. TASK-012F: Restructure Settings as defaults-only and clarify save behavior.
6. TASK-012G: Make Diagnostics issue-first with per-card next actions and support export/copy planning.

## Blockers

None for this audit. Implementation should stay blocked until the user approves the next scoped task because this task is audit/planning only.
