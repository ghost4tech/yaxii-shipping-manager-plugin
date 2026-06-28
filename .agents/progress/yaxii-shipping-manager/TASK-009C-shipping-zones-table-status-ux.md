# TASK-009C - Shipping Zones Table Live Status Audit and UX Fix

Date: 2026-06-28

## Goal

Audit and fix the Shipping Zones table so merchants can trust what it shows. The table should act as live WooCommerce status plus local draft planning, while all WooCommerce writes continue to route through Generator preview/apply and the existing SafeApplyEngine.

## Scope

Included:

- Read-only diagnostics ownership extension for Yaxii managed registry records.
- Shipping Zones table live status, live method summary, and draft-only copy.
- Documentation for table behavior and smoke expectations.
- Rebuilt admin assets.

Not included:

- Zone-name updates.
- Reset or wipe tooling.
- Direct table writes to WooCommerce.
- Manual zone adoption.
- Manual zone or manual method updates.
- CSV backend, commune pricing engine, provider imports, or YSF sync.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/009c-shipping-zones-table-status-ux`
- Preflight confirmed `main` and `origin/main` contained TASK-009B commit `524ad34`.
- `.agents/references/yaxii-shipping-hub-03/` remained ignored and was not staged.

## Current Table Audit

Before this task, the Shipping Zones table was driven by local `wilayas` draft state in `admin-app/src/routes/index.tsx`. The app already loaded diagnostics globally, but the table did not use those diagnostics for row status.

Audit result:

- Table rows: local draft only.
- Old status pill: local draft only and misleading as live status.
- Price inputs: local draft only.
- Row enabled switch: local draft only.
- Bulk price tools: local draft only.
- Free and disabled actions: local draft only.
- Generator button: functional navigation to the wizard.
- Diagnostics button: functional navigation when present elsewhere.
- WooCommerce method enabled state and costs: not shown in the table before this task.

## Controls Classification

- Live WooCommerce status: new `WooCommerce status` and `Live WooCommerce zone` columns.
- Local draft only: price inputs, row switches, bulk price, percent, free draft, and disable draft controls.
- Opens Generator preview/apply: `Open Generator to update prices` and `Preview missing setup`.
- Opens read-only diagnostics: `Check diagnostics`.
- Native WooCommerce inspection: `Open WooCommerce zones`.
- Coming soon: CSV controls remain disabled elsewhere.
- Removed or clarified misleading controls: old local-only status pill, bulk `Apply draft price` wording, and draft controls without per-cell draft labels.

## UX Changes Made

- Added the required copy: `Draft only - use Preview & Apply to update WooCommerce.`
- Added a top status card with:
  - `Shipping setup is active`
  - `Some shipping setup is missing`
  - `Manual zones need review`
  - `WooCommerce is inactive`
  - refresh/error states
- Added clear actions:
  - `Open Generator to update prices`
  - `Preview missing setup`
  - `Check diagnostics`
  - `Open WooCommerce zones`
- Renamed bulk draft controls to avoid implying a WooCommerce write.
- Added `Draft` and `Free draft` badges beside method price inputs.
- Kept all edit controls local-only.

## Live Status Behavior

Diagnostics now expose registry-backed ownership:

- `managed_registry` means the zone ID exists in `yaxii_shipping_manager_managed_zones`.
- `yaxii_hint` means the name looks like Yaxii but is not registry-owned.
- `manual_unknown` means manual or unknown ownership.

The table now shows per-wilaya:

- Direct zone existence.
- Managed, missing, manual conflict, needs methods, needs update, ready, checking, and unavailable states.
- Live zone name.
- Ownership label.
- Home and office method enabled state and live cost when the method is registry-owned.

## Draft Behavior

Draft edits still update only frontend state. They do not write to WooCommerce. Merchants are routed to Generator preview/apply for supported method price and label updates.

## Files Changed

- `admin-app/src/routes/index.tsx`
- `admin-app/src/api/diagnostics-api.ts`
- `admin-app/src/types/diagnostics.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-BlYSHm4O.js`
- `assets/admin/assets/main-DtOcPpef.css`
- `src/Plugin.php`
- `src/WooCommerce/ShippingDiagnosticsService.php`
- `docs/DIAGNOSTICS.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-009C-shipping-zones-table-status-ux.md`

Removed replaced built assets:

- `assets/admin/assets/main-D9frQfwT.js`
- `assets/admin/assets/main-Dgo52jlk.css`

## Browser Smoke Result

Authenticated browser smoke passed for the Shipping Zones screen.

Observed in wp-admin:

- Shipping Zones page loaded.
- Draft-only copy was visible.
- Top actions were visible.
- Table showed `WooCommerce status`, `Live WooCommerce zone`, and draft columns.
- DZ:01 showed a managed registry-owned zone.
- DZ:01 showed `Yaxii - 01 Adrar - أدرار`.
- DZ:01 showed home delivery enabled with `700 DZD`.
- DZ:01 showed office delivery enabled with `400 DZD`.
- Draft inputs showed `700 Draft` and `400 Draft`.
- A row with live prices differing from draft showed `Needs update`.
- Generator opened from the Shipping Zones screen.

## Runtime Smoke Result

WP-CLI diagnostics smoke:

- WooCommerce diagnostics returned low risk.
- Configured wilayas: 69.
- Missing wilayas: 0.
- Duplicate conflicts: 0.
- DZ:01 zone ID: 3.
- DZ:01 ownership: `managed_registry`.
- DZ:01 managed methods:
  - home delivery instance 5, cost 700.
  - office delivery instance 6, cost 400.

Controlled price update smoke through preview/apply:

- Selected DZ:01.
- Preview planned one managed method update.
- Apply updated home delivery from 700 to 701.
- Restore preview planned one managed method update.
- Apply restored home delivery to 700.
- Registry `lastKnownCost` returned to 700.
- Method count stayed 2 before and after.

## QA Guard Findings

- `clean-code-guard`: change is scoped; no second apply engine was introduced.
- `docs-guard`: docs describe actual table behavior and current limits.
- `wp-guard`: new backend change is read-only diagnostics data; no unsafe request handling was added.
- `wp-rest-api`: diagnostics payload shape was extended through the existing read-only endpoint contract.
- `woo-guard`: WooCommerce writes remain in SafeApplyEngine; the table has no direct write path.
- `wp-plugin-directory-guidelines`: no external assets, license gates, remote dependencies, obfuscation, or upsell surfaces were added.
- Repo-local `.agent/skills/` did not exist; repo-local `.agents/skills/` guard files were used.

## Checks Run

- `php -l src/WooCommerce/ShippingDiagnosticsService.php`
- `php -l src/Plugin.php`
- `composer dump-autoload`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- No source maps under `assets/admin`
- Scoped restricted-copy scan over product source, built assets, and touched docs
- Raw dataset bundling scan over built JS
- WooCommerce write-path scan over `src` and `admin-app/src`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- PHP lint: passed.
- Composer autoload: passed.
- Typecheck: passed.
- Lint: passed with 8 existing Fast Refresh warnings in shared UI files.
- Build: passed.
- Source maps: none found.
- Scoped restricted-copy scan: passed.
- Raw dataset bundling scan: passed.
- WooCommerce write-path scan: passed; product writes remain in SafeApplyEngine and settings/registry persistence.
- `git diff --check`: passed with CRLF normalization warnings only.
- Final git status: pending at report creation; to be checked before commit.

## What Remains Not Implemented

- Zone-name updates.
- Reset or wipe tooling.
- Direct Shipping Zones table writes.
- Manual zone adoption.
- Manual/unknown zone or method updates.
- CSV backend.
- Commune-level custom pricing engine.
- Provider imports.
- YSF sync.

## Known Risks

- The table can show live method cost only when the method is mapped through the managed registry.
- Name-only Yaxii-looking zones remain weaker evidence than registry-owned zones.
- Lint still reports pre-existing Fast Refresh warnings in shared UI components.

## Blockers

None.

## Next Recommended Task

Run a release-candidate UX pass focused on the Generator and Shipping Zones navigation together, then decide whether zone-name updates are still needed for MVP.

## Commit Hash

Created in the task commit that includes this report. See git history and final closeout for the exact hash.
