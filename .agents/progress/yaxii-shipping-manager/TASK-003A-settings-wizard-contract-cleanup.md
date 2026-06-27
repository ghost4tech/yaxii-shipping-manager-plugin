# TASK-003A - Settings and Wizard Contract Cleanup

Date: 2026-06-27

## Goal

Clean and define the settings and wizard contract before persistence, updating the admin app settings and generator UI to match the MVP product model while keeping all state local/draft only.

## Scope

Included:

- Frontend/domain contract cleanup in `admin-app/`.
- Settings UI contract cleanup.
- Generator/wizard flow cleanup.
- Fixed MVP shipping method templates.
- Locked safety policy display.
- Settings contract documentation.
- Admin asset rebuild.

Excluded:

- WordPress option persistence.
- WooCommerce zone reads or writes.
- WooCommerce diagnostics backend.
- Preview planner.
- Safe apply engine.
- CSV backend.
- YSF sync.
- Provider imports.
- Unlimited custom shipping methods.
- Country expansion UI.
- Telemetry, licensing, Pro locks, or remote calls.

## Files Changed / Created

Changed:

- `admin-app/src/routes/index.tsx`
- `admin-app/src/types/generator.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-BANK_rYQ.js` removed by rebuild.
- `assets/admin/assets/main-D4KxDRFu.css` removed by rebuild.

Created:

- `admin-app/src/types/settings.ts`
- `admin-app/src/data/default-settings.ts`
- `admin-app/src/domain/format-region-label.ts`
- `admin-app/src/domain/zone-name-preview.ts`
- `docs/SETTINGS-CONTRACT.md`
- `assets/admin/assets/main-B90TssnQ.js`
- `assets/admin/assets/main-y-7V8s5a.css`
- `.agents/progress/yaxii-shipping-manager/TASK-003A-settings-wizard-contract-cleanup.md`

## What Was Before

- Settings were local draft only, but the UI still exposed prototype controls such as editable currency label and separate Arabic/French name toggles.
- The wizard used the older five-step flow: dataset, methods, import, prices, review.
- Shipping method definitions were an ad hoc local `{ id, label }` shape.
- Generator contract types existed, but did not yet reflect the full MVP method, naming, safety, and setup-path decisions.

## What Changed

- Added explicit settings contract types for setup path, region label format, zone naming format, office wording, dataset options, and safety rule keys.
- Updated generator types to include setup path, fixed method keys, `flat_rate` method type, locked method flags, zone prefix, selected wilayas, and full manual-zone protection policy.
- Added `default-settings.ts` as the single frontend source for MVP dataset options, label formats, zone naming formats, setup paths, office wording, method templates, and safety rules.
- Added `format-region-label.ts` and `zone-name-preview.ts` for small domain helpers.
- Updated the settings screen to show:
  - Dataset mode with current available and legacy disabled.
  - Region label format.
  - Zone name format.
  - Zone prefix defaulting to `Yaxii`.
  - Office method wording.
  - Fixed home, office, custom 1, and custom 2 method templates.
  - Non-editable currency notice: WooCommerce currency later, fallback `DZD`.
  - Locked safety rules.
- Updated the wizard to seven steps:
  1. Setup path
  2. Dataset mode
  3. Label/naming
  4. Shipping methods
  5. Default prices
  6. Wilaya selection
  7. Review draft
- Updated the wizard review screen to state that it is a local draft and WooCommerce preview/apply comes after diagnostics and preview planner.

## Settings Added

- `datasetMode`
- `regionLabelFormat`
- `zoneNameFormat`
- `zonePrefix`
- `officeMethodWording`
- Fixed `ShippingMethodTemplate` records for:
  - `home_delivery`
  - `office_delivery`
  - `custom_1`
  - `custom_2`
- Locked safety rule display for:
  - Protect manual WooCommerce zones
  - Require preview before apply
  - Skip conflicts by default
  - Never delete manual zones

## Settings Removed

- Editable `Currency label`
- Separate `Show Arabic names`
- Separate `Show French names`
- Unlimited custom method add/remove behavior

## Wizard Changes

- Replaced the old method/import/price flow with the requested seven-step setup flow.
- Added setup path selection for Quick setup, Manual setup, and Import CSV.
- Kept CSV as a contract path only; upload and validation remain backend work.
- Added label/naming preview using the normalized dataset wilaya labels.
- Added fixed method-template editing with home and office locked on.
- Added local default price validation that rejects negative values and treats empty values as unset.
- Added wilaya selection as a separate step.

## Method Contract

MVP method keys are fixed:

- `home_delivery`
- `office_delivery`
- `custom_1`
- `custom_2`

Home delivery and office/stopdesk delivery are required and locked on. Custom method 1 and custom method 2 are optional. All templates use `flat_rate`.

Unlimited custom shipping methods are intentionally excluded from the MVP contract.

## Safety Policy

The UI shows all safety rules as locked on with the copy `Required safety rule for the future apply engine.` Users cannot disable these rules in TASK-003A.

## What Remains Draft / Local

- Dataset mode selection.
- Label format.
- Zone naming format and prefix.
- Office wording.
- Shipping method labels/enabled state/default prices.
- Wilaya selection.
- All generator output.

No settings are persisted to WordPress options in this task.

## What Was Not Implemented

- WordPress option persistence.
- WooCommerce zone reads.
- WooCommerce zone writes.
- WooCommerce diagnostics backend.
- Preview planner.
- Safe apply engine.
- CSV backend.
- YSF sync.
- Provider imports.
- Commune-level pricing.
- Multi-country UI.

## Security Notes

- No PHP or REST code changed.
- No state-changing endpoint was added.
- No WordPress options or database writes were added.
- Frontend still uses existing authenticated REST bootstrap/dataset reads only.

## WooCommerce Safety Notes

- No WooCommerce shipping-zone APIs were added.
- No WooCommerce write path was introduced.
- No checkout hooks, order/product APIs, HPOS surfaces, or money calculations were added.
- Draft prices remain local UI values only.

## WordPress.org Compliance Notes

- No telemetry, analytics, licensing, Pro locks, external assets, provider imports, or remote calls were added.
- Current dataset wording remains cautious and avoids unverified official claims.
- Country expansion UI was not added.
- Built assets were regenerated locally from the admin-app source.

## QA Guard Findings and Fixes

Clean-code guard:

- Split contract constants and domain helpers out of `index.tsx`.
- Removed the unused local settings variable after scan.
- Kept custom method support fixed to two explicit keys instead of adding an unlimited/dynamic method abstraction.

WP/plugin guard:

- No PHP, hooks, settings API, or REST endpoint changes were made.
- No WordPress write capability/nonce surface was introduced.

Woo guard:

- Verified no WooCommerce shipping-zone write APIs or WooCommerce order/product/checkout APIs were added.
- Draft UI copy does not claim live WooCommerce changes.

Docs guard:

- `docs/SETTINGS-CONTRACT.md` documents only the current draft contract and explicitly lists what is not implemented yet.

Test guard:

- Not used for new tests because this task added no tests or executable scripts.

## Checks Run / Results

- `npm run typecheck` in `admin-app`: passed.
- `npm run lint` in `admin-app`: passed with 8 existing Fast Refresh warnings and 0 errors.
- `npm run build` in `admin-app`: passed. New assets:
  - `assets/admin/assets/main-B90TssnQ.js`
  - `assets/admin/assets/main-y-7V8s5a.css`
- Source map check under `assets/admin`: passed; no `.map` files found.
- Forbidden string scan over `src`, `admin-app/src`, and `assets/admin`: passed.
- Raw dataset bundling scan over built JS: passed; no `s450r1-algeria-cities-2025`, `commune_name_arabic`, or `wilaya_name_latin` strings found.
- WooCommerce/write scan over `src` and `admin-app/src`: passed for this task; no new WooCommerce write APIs found.
- `php -l`: not run because no PHP files changed.
- `git diff --check`: passed with Git CRLF warnings only.
- `git status --short --untracked-files=all`: pending commit at report creation.

## Known Risks

- The settings and wizard contract are still local draft state, so UI changes disappear on reload until TASK-003 persistence is implemented.
- The new wizard flow was verified by TypeScript/build checks, not by browser interaction in a real wp-admin session.
- Existing Fast Refresh lint warnings remain in shared UI component files and `main.tsx`.

## Blockers

None.

## Next Recommended Task

TASK-003B: add validated WordPress option persistence for the settings/generator draft contract, with no WooCommerce writes and no preview/apply behavior.

## Commit Hash, If Committed

Pending. The final commit hash is reported in the task closeout response.
