# Settings UX and Logic Audit

Date: 2026-07-02

## Goal

Audit the current Settings page logic, backend contracts, and merchant UX before implementation. This audit does not change product code, backend settings behavior, the preview/apply engines, Generator, Shipping Editor, or removal tooling.

## Executive Recommendation

Use Model 4 for the MVP: Settings should have only:

1. General defaults
2. Advanced tools

But "General defaults" should be very small. Settings should not duplicate the full Generator setup draft. The MVP Settings page should keep only a true global preference if it remains useful outside one Generator run, convert safety rules into a read-only note, and keep Remove Yaxii setup inside Advanced tools.

Main direction:

- Keep visible in Settings: region label format only if it is reframed as a global wilaya display preference.
- Move to Generator only: dataset mode, zone naming, zone prefix, office wording, method labels, default prices, and custom method enablement.
- Convert safety toggles to a read-only safety card: "Safety rules are always on."
- Keep backend option keys for compatibility and initial Generator prefill. Do not remove stored keys yet.
- Do not sync Generator draft changes back to Settings automatically.

## Evidence Summary

Inspected code and docs show:

- Settings are stored in `yaxii_shipping_manager_settings` through `SettingsRepository`.
- `PUT /settings` sanitizes and persists the option only; it does not write WooCommerce shipping zones.
- `SettingsSanitizer` rejects unknown keys, forces locked required methods on, and forces all safety rules to true.
- Generator initializes from persisted settings, then keeps draft state local.
- Preview can override saved settings with draft values for dataset, region labels, zone naming, and method templates.
- Diagnostics currently follows the saved dataset mode because the diagnostics endpoint does not accept a dataset override.
- WooCommerce Algeria state registration follows saved `datasetMode` and `regionLabelFormat`.
- Shipping Editor uses saved settings to choose the displayed dataset and initial method definitions, but live row prices/status come from diagnostics.
- Safe Apply writes only from preview/apply payloads; it does not read Settings directly for a live update after a Settings save.

## Current Settings Inventory

| Setting name | Current UI location | Stored in WordPress option? | Used by Generator? | Used by Shipping Editor? | Used by Diagnostics? | Used by Preview Planner? | Used by SafeApplyEngine? | Affects live WooCommerce immediately? | Merchant value | Risk/confusion | Recommendation |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---|---|
| Dataset mode | Settings main card | Yes, `datasetMode` | Yes, as initial draft; Generator can override locally | Yes, app loads the base wilaya list from saved mode | Yes, diagnostics service defaults to saved mode | Yes, saved mode unless preview override is sent | Indirectly, through preview/apply payload | Yes for registered Algeria state list/count on future WooCommerce state reads; no existing zone/price update | Lets old 58-wilaya stores prepare a legacy setup | High: saving legacy can make admin/diagnostics/checkouts look 58-oriented while merchant expects current coverage | Move to Generator only |
| Region label format | Settings main card | Yes, `regionLabelFormat` | Yes, as initial draft; Generator can override locally | No for table labels; rows show dataset French/Arabic fields directly | Indirectly through WooCommerce state registration, not diagnostics matching | Yes, controls generated zone-name labels | Indirectly, through preview-created zone names or method updates | Yes for WooCommerce Algeria state labels on future state reads; no existing zone/price update | Useful as a global display preference | Medium: name sounds like zone naming only, but it also affects WooCommerce state labels | Keep in Settings |
| Zone name format | Settings main card | Yes, `zoneNameFormat` | Yes, as initial draft and editable in Names step | No live update; Shipping Editor does not rename zones | No | Yes, controls preview `zoneName` and unsupported `updateZones` details | Indirectly for newly created zones only | No for existing zones; yes only if a later preview/apply creates missing zones | Useful during setup | High: Settings copy says defaults, but field looks like it should rename live zones | Move to Generator only |
| Zone prefix | Settings main card | Yes, `zonePrefix` | Yes, as initial draft and editable in Names step | No live update; diagnostics uses saved prefix only for Yaxii-looking ownership hints | Yes, ownership hint treats saved prefix as a Yaxii name hint | Yes, controls preview `zoneName` | Indirectly for newly created zones only | No for existing zones; may affect diagnostics ownership hints after save | Useful during setup | High: can change ownership-hint classification without changing actual Woo zones | Move to Generator only |
| Office method wording | Settings main card | Yes, `officeWordingMode` plus `officeCustomLabel` | Yes, as initial draft and editable in Names step | No live update | No | Only through the generated `methods` labels sent by Generator | Indirectly if preview/apply adds or updates managed methods | No until preview/apply writes supported method label changes | Useful during setup | High: sounds like it may rename current Woo methods | Move to Generator only |
| Home delivery label/default price | Settings method rows | Yes, inside `methods` | Yes, as initial draft and editable in Methods/Prices steps | Yes, as method definition/default fallback, but live price display comes from Woo diagnostics | No | Yes, saved value unless Generator/Shipping Editor preview request overrides it | Indirectly through preview/apply payload | No immediate live update | Useful for first setup defaults | High: price defaults look like live prices, especially beside Shipping Editor | Move to Generator only |
| Office delivery label/default price | Settings method rows | Yes, inside `methods` | Yes, as initial draft and editable in Methods/Prices steps | Yes, as method definition/default fallback, but live price display comes from Woo diagnostics | No | Yes, saved value unless Generator/Shipping Editor preview request overrides it | Indirectly through preview/apply payload | No immediate live update | Useful for first setup defaults | High: overlaps Shipping Editor live price management and Generator draft pricing | Move to Generator only |
| Custom method 1 label/default price/enabled state | Settings method rows | Yes, inside `methods` | Yes, as initial draft and editable in Methods/Prices steps | Yes, saved enabled state can add/remove the method column unless diagnostics discovers an existing managed custom method | No | Yes, if enabled in saved settings or Generator draft | Indirectly through preview/apply payload | No immediate live update | Useful only during setup or repair | High: enabling here can affect admin columns/previews but not create live Woo methods until Generator/preview/apply | Move to Generator only |
| Custom method 2 label/default price/enabled state | Settings method rows | Yes, inside `methods` | Yes, as initial draft and editable in Methods/Prices steps | Yes, saved enabled state can add/remove the method column unless diagnostics discovers an existing managed custom method | No | Yes, if enabled in saved settings or Generator draft | Indirectly through preview/apply payload | No immediate live update | Useful only during setup or repair | High: same confusion as Custom method 1 | Move to Generator only |
| Safety policy fields | Settings disabled toggles | Yes, inside `safetyPolicy`; sanitizer forces all true | Generator carries the safety policy as protected draft metadata | No direct UI choice | Preview/apply readiness uses locked policy | Yes, returned in preview response and hash | Yes, apply request includes `safetyPolicySnapshot` | No user-change effect because all values are locked true | Trust signal | High: disabled toggles imply merchant-configurable policy, but these are required engine rules | Convert to read-only safety note |
| Reset defaults | Settings header action | No separate option; writes defaults to settings option | Resets future Generator prefill if used | Resets saved method/default dataset view if used | Resets saved diagnostics dataset behavior | Resets preview defaults when no overrides are sent | Indirectly for later preview/apply only | Can change WooCommerce state registration defaults on later requests; does not update zones | Low | High: a global reset can wipe defaults for fields that should no longer be visible | Remove from visible UI |
| Save defaults | Settings header action | No separate option; persists the current settings option | Saves future Generator prefill | May alter Shipping Editor base dataset/method definitions | May alter diagnostics dataset mode if dataset remains visible | Alters preview defaults when no overrides are sent | Indirectly for later preview/apply only | Can alter Woo state labels/dataset after request reload; does not update zones | Useful if Settings keeps at least one real preference | Medium: label sounds harmless while some fields affect state registration | Keep in Settings |
| Remove Yaxii setup advanced tool | Settings Advanced tools | No settings option; uses managed registry and WooCommerce zone data | After success, Generator can create setup again | After success, Shipping Editor sees empty setup via refreshed diagnostics | Uses read-only removal preview; refreshes diagnostics after action | No | Separate confirmed removal executor, not SafeApplyEngine | Yes, after typed confirmation; deletes only verified managed zones/methods | High for testing and agency cleanup | High if not isolated because it is a destructive WooCommerce configuration action | Move to Advanced |

## Product Model Evaluation

### Model 1: Settings only contains global plugin preferences and advanced tools

This is clean, but the current UI contains many setup-draft fields that are not global preferences. It would require moving most visible controls out.

### Model 2: Settings contains defaults for new Generator runs

This is the current model. It is the source of confusion because Generator already exposes the same decisions at the moment they matter, while Shipping Editor handles live values.

Do not keep this as the MVP model.

### Model 3: Settings is removed/minimized and Generator owns setup defaults

This is the strictest model and would remove most duplication. It is attractive, but the plugin still needs a home for Remove Yaxii setup and possibly one global display preference.

### Model 4: Settings has two sections only: General defaults and Advanced tools

Recommended for MVP.

Use this model, but keep General defaults intentionally small. Do not keep all current setup defaults just because they already exist.

## Duplicated Generator Controls

| Field duplicated with Generator | Authoritative place | Should Settings prefill Generator? | Should Generator save back to Settings? | Confusion risk |
|---|---|---:|---:|---|
| Dataset mode | Generator for setup runs | For compatibility only until removed from visible Settings | No | High: saved legacy mode changes broader diagnostics/state context |
| Region label format | Settings if treated as global display preference; Generator can override draft naming | Yes | No | Medium: same control can mean checkout state labels and setup zone labels |
| Zone name format | Generator Names step | Yes, as compatibility/default only | No | High: Settings save does not rename existing zones |
| Zone prefix | Generator Names step | Yes, as compatibility/default only | No | High: also affects diagnostics Yaxii-name hinting |
| Office wording/custom label | Generator Names step | Yes, as compatibility/default only | No | High: Settings save does not rename live methods |
| Method labels | Generator Methods step for setup; Shipping Editor for supported live managed method updates | Yes, as compatibility/default only | No | High: merchant may expect existing method labels to change |
| Default prices | Generator Prices step for setup; Shipping Editor for live managed prices | Yes, as compatibility/default only | No | Very high: price fields beside Settings feel like live pricing |
| Custom method enabled state | Generator Methods step | Yes, as compatibility/default only | No | High: enabling does not create methods immediately |

Recommendation: do not try to keep Settings and Generator continuously synced. Generator should own a local draft for each run. Settings may provide initial defaults, but Generator changes should remain local unless the merchant explicitly saves a separate "Save as future default" action in a later, carefully scoped task.

## Safety Rules UX

Current visible safety rules:

- Protect manual WooCommerce zones
- Require preview before apply
- Skip conflicts by default
- Never delete manual zones

These should not appear as settings. They are required engine rules.

Recommended UI:

```text
Safety rules are always on
Yaxii protects manual WooCommerce zones, requires preview before apply, skips conflicts by default, and never deletes manual zones.
```

Optional secondary copy:

```text
These rules cannot be disabled in this release.
```

Implementation direction:

- Remove disabled switch rows from visible Settings.
- Replace them with one read-only card.
- Keep `safetyPolicy` in backend responses and apply contracts for compatibility and hash stability.
- Keep sanitizer behavior that forces all values to true.

## Dataset Mode UX

Dataset mode is the riskiest current Settings field because it behaves like a global preference:

- The admin app uses saved mode to load the base wilaya list.
- Diagnostics uses saved mode when no explicit mode is passed.
- WooCommerce state registration uses saved mode.
- Generator can override mode locally for preview.

If a merchant saves `legacy_58`, later expects current coverage, and forgets the saved setting, the plugin can hide or deprioritize current wilayas in admin/diagnostics and register fewer Algeria state options. That is too much hidden global behavior for a setup-default field.

MVP recommendation:

- Remove dataset mode from visible Settings.
- Keep current dataset as the normal global default.
- Keep legacy mode selectable inside Generator Coverage only.
- Diagnostics should follow current saved/global default outside Generator, but preview diagnostics should use the selected Generator mode through the existing preview override path.
- Preserve `datasetMode` in the backend option for compatibility, but do not promote it as a merchant setting until the product explicitly supports a global legacy-store mode.

Future implementation concern:

- If existing stores already saved `legacy_58`, an implementation task should decide whether to keep reading it, reset it to `current` during a migration, or show a one-time notice. Do not silently change it in this audit task.

## Method Labels and Default Prices UX

Default method labels and prices should not live in visible Settings for MVP.

Reasons:

- Generator already has Methods and Prices steps.
- Shipping Editor is the live WooCommerce management surface.
- Settings saves defaults only and does not update existing WooCommerce prices.
- TASK-012J already removed default-vs-live price comparison from row status because defaults are not live truth.

Recommended behavior:

- Move Home/Office labels and default prices to Generator only.
- Move custom method enablement, labels, and prices to Generator only.
- Shipping Editor should continue to show live values from WooCommerce diagnostics and let merchants update supported registry-owned methods through preview/apply.
- Shipping Editor live values should not sync back into Settings defaults automatically.
- If the product later wants "save these prices as future defaults", add an explicit action after successful Generator or Shipping Editor apply, not silent syncing.

## Advanced Tools UX

`Remove Yaxii setup` should stay in Settings, inside Advanced tools only.

It should not move to Diagnostics for MVP:

- Diagnostics is read-only and should remain a health-check surface.
- Removal is a destructive, confirmed write path.
- Settings already contains Advanced tools and existing docs define this location.

The Settings page can exist mainly for:

- one small General defaults/preference section
- a read-only safety note
- Advanced tools

## Backend Compatibility

Do not remove backend settings keys in the first implementation task.

Preserve:

- `datasetMode`
- `regionLabelFormat`
- `zoneNameFormat`
- `zonePrefix`
- `officeWordingMode`
- `officeCustomLabel`
- `methods`
- `safetyPolicy`

Reasons:

- Existing saved options may contain these keys.
- REST clients and frontend parsing currently expect the full persisted shape.
- Preview planner reads saved settings before applying overrides.
- Apply contract exposes `safetyPolicy`.
- Removing keys would be a contract migration, not a UX cleanup.

The first implementation should hide or move UI controls without changing the REST shape.

## Proposed Final Settings Structure

### Page Header

Title:

```text
Settings
```

Description:

```text
Manage global preferences and advanced setup tools.
```

### Section: General Defaults

Keep only if the product wants a global state-label preference:

Label:

```text
Wilaya display language
```

Help text:

```text
Used for Algeria wilaya labels in WooCommerce and as the default for new Generator drafts.
```

Choices:

- French
- Arabic
- French - Arabic
- Arabic - French

Save button:

```text
Save settings
```

Success copy:

```text
Settings saved. Existing WooCommerce shipping zones and prices were not changed.
```

If no global display preference is kept, remove this section and keep Settings as Advanced tools plus safety note only.

### Section: Safety

Title:

```text
Safety rules are always on
```

Body:

```text
Yaxii protects manual WooCommerce zones, requires preview before apply, skips conflicts by default, and never deletes manual zones.
```

Secondary copy:

```text
These rules cannot be disabled in this release.
```

No toggles.

### Section: Advanced Tools

Title:

```text
Advanced tools
```

Tool:

```text
Remove Yaxii setup
```

Description:

```text
Remove only Yaxii-managed WooCommerce zones and methods. Manual WooCommerce zones will not be touched.
```

Keep the existing removal preview, modal, typed confirmation, blocker handling, and technical details behavior.

## Follow-up Implementation Tasks

1. Hide Generator-only controls from Settings while preserving the full REST settings contract.
2. Replace the disabled safety toggles with a single read-only safety card.
3. Keep or rename region label format as `Wilaya display language`; if kept, update copy to disclose WooCommerce state-label impact.
4. Move dataset mode visibility to Generator Coverage only; decide what to do with existing saved `legacy_58` values before changing runtime behavior.
5. Remove visible method labels/default prices/custom method toggles from Settings; keep Generator as the setup draft owner.
6. Update `docs/SETTINGS-CONTRACT.md`, `docs/GENERATOR-WIZARD.md`, and `docs/RUNTIME-SMOKE.md` after implementation, not before.
7. Run a browser smoke to prove Settings no longer implies live price/zone updates and Generator still previews with local draft overrides.

## What Should Not Be Implemented Yet

- Do not delete backend settings keys.
- Do not change `SettingsSanitizer`.
- Do not change `SettingsRepository`.
- Do not change `SafeApplyEngine`.
- Do not add a new WooCommerce write path.
- Do not sync Shipping Editor live values back to Settings.
- Do not sync Generator changes back to Settings.
- Do not add manual-zone adoption.
- Do not add CSV backend, commune-level pricing, provider imports, YSF sync, telemetry, licensing, Pro locks, external fonts, or remote assets.

## Risks

- Existing saved `datasetMode: legacy_58` may still influence admin, diagnostics, and WooCommerce state registration until a migration or behavior change is scoped.
- Hiding fields while preserving backend defaults can leave stale saved values active. The implementation task must decide which hidden values should keep applying and which should be ignored by UI flows.
- Region label format is partly global and partly setup-draft naming. Its copy must be precise if kept.
- Removing method defaults from Settings may surprise a user who already learned the current page, but it aligns better with Generator and Shipping Editor responsibilities.

## Final MVP Recommendation

Keep Settings, but make it small:

- `Wilaya display language`, if treated as a real global preference.
- Read-only `Safety rules are always on`.
- `Advanced tools` with `Remove Yaxii setup`.

Everything else should move to Generator-only UI or remain backend-only for compatibility.
