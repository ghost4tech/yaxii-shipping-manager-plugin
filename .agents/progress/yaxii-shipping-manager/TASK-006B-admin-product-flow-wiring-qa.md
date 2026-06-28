# TASK-006B — Admin Product Flow Wiring and Runtime QA

Date: 2026-06-28

## Goal

Audit and fix the admin app product flow so a merchant can test the full safe read-only journey:

Settings -> Wizard/Generator -> Preview -> Diagnostics -> Apply disabled.

## Scope

Frontend product-flow wiring and runtime QA only. No WooCommerce writes, no real apply engine, no CSV backend, no provider integrations, no checkout field changes, and no commune-level pricing were implemented.

## What was broken or unclear

- Generator copy still described diagnostics and preview planning as future work even though both endpoints now exist.
- The wizard could create a preview inside the modal, but closing the wizard lost the preview context and sent the user away from the generator flow.
- The review step did not clearly show which wilayas and method prices were being sent to preview.
- The preview request did not include per-wilaya pricing rows from the current local draft.
- The diagnostics screen had a disabled placeholder CTA instead of a working refresh action.
- Negative price input handling was inconsistent and could feel like a dead field.
- The apply-disabled state existed, but the user flow did not connect preview, diagnostics, and disabled apply clearly enough.

## Files changed

- `admin-app/.prettierrc`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-BCo4HDco.js`
- `assets/admin/assets/main-CiiohCr3.js` removed by rebuilt asset hash

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-006B-admin-product-flow-wiring-qa.md`

## What was before

The admin app had the required screens and API clients, but the product journey still felt disconnected. Preview output was scoped to the wizard modal, diagnostics could not be refreshed from the UI, and copy implied that implemented read-only features were not active.

## What changed

- Persisted the latest preview result on the Generator screen after the wizard closes.
- Kept wizard completion on the Generator tab instead of sending the user to Shipping Zones.
- Added a diagnostics shortcut from preview output.
- Added a diagnostics refresh action.
- Updated copy to clearly say preview is read-only and no WooCommerce changes are made.
- Sent selected wilaya codes, method templates, pricing rows, naming settings, and label format to the preview endpoint.
- Added selected-wilaya and method-price summaries on the wizard review step.
- Disabled preview when no wilayas are selected.
- Kept Apply disabled with clear copy that the apply engine is not enabled yet.
- Added local validation feedback for negative prices.
- Rebuilt the admin bundle and updated the Vite manifest.

## Settings flow result

Source inspection confirms settings still load through `GET /settings`, save through `PUT /settings`, and reset to defaults through the existing settings API wiring. TASK-006B did not change settings persistence. The settings UI now shows a useful local error when a method price is negative or invalid.

## Dataset flow result

The admin app continues to fetch current wilayas from `/dataset?mode=current&include=wilayas`. No raw dataset JSON is imported into React, and the raw dataset bundling scan passed. Legacy 58 remains unavailable in the UI copy.

## Wizard/generator flow result

The wizard now supports a usable local draft journey:

- setup path
- dataset mode
- label and naming
- methods
- default prices
- wilaya selection
- review draft
- preview changes

The review step now shows selected wilayas, enabled method prices, safety-rule status, and a working preview action. Closing the wizard keeps the latest preview visible on the Generator screen.

## Preview flow result

`Preview changes` calls `POST /preview` and sends the current local draft fields, including selected wilaya codes and pricing rows. The response groups, readiness card, preview hash/contract fields, warnings, unchanged items, and disabled apply state remain visible. Copy states: "This is a preview only. No WooCommerce changes were made."

## Diagnostics flow result

The Diagnostics screen still uses the read-only `/diagnostics` endpoint and now has a working refresh button. WooCommerce inactive and fresh/empty states remain handled by the existing diagnostics response display.

## Apply disabled flow result

Apply remains disabled. The preview panel still says the apply engine is not enabled yet, and no fake success or generated-live state was added.

## What remains mocked/not implemented

- Real WooCommerce apply engine.
- WooCommerce shipping zone create/update/delete.
- Shipping method add/update writes.
- CSV backend.
- YSF sync.
- Provider imports.
- Checkout field changes.
- Commune-level pricing.

## Security notes

No PHP or REST endpoint code was changed. Existing endpoint capability and nonce behavior were not weakened. The frontend continues using the existing bootstrap nonce and API clients.

## WooCommerce safety notes

No WooCommerce write APIs were added. The scan surfaced only existing read-only `WC_Shipping_Zones`/`WC_Shipping_Zone` references and the existing plugin settings save path.

## WordPress.org compliance notes

No telemetry, remote calls, CDN assets, licensing, Pro locks, or hidden tracking were added. Built assets remain local under `assets/admin/`.

## QA guard findings

- `clean-code-guard`: fixed flow state instead of adding a separate mock flow; preview state is held at the generator level and reused.
- `wp-guard`: no PHP touched; existing REST clients remain nonce-backed through bootstrap config.
- `wp-rest-api`: no endpoint changes; preview request now matches the existing read-only endpoint contract more completely.
- `woo-guard`: no WooCommerce writes added; apply remains disabled.
- `docs-guard`: this report documents the database runtime smoke blocker and avoids claiming browser verification passed.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- source map scan under `assets/admin`
- forbidden string scan over `src`, `admin-app/src`, and `assets/admin`
- raw dataset bundling scan over built JS
- WooCommerce write scan over `src` and `admin-app/src`
- `wp option get siteurl`
- `wp plugin status yaxii-shipping-manager`
- `wp plugin status woocommerce`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- `npm run typecheck`: passed.
- `npm run lint`: passed with 8 pre-existing Fast Refresh warnings in UI component files and `main.tsx`.
- `npm run build`: passed; generated `assets/admin/assets/main-BCo4HDco.js`.
- Source map scan: passed; no `.map` files under `assets/admin`.
- Forbidden string scan: passed.
- Raw dataset bundling scan: passed.
- WooCommerce write scan: no new writes found; existing read-only diagnostics and plugin settings save references only.
- `git diff --check`: passed, with Windows CRLF working-copy warnings only.
- PHP lint and `composer dump-autoload`: not run because no PHP files changed.

## Browser smoke result or blocker

Browser smoke in logged-in wp-admin was blocked because the local WordPress runtime cannot connect to the database from WP-CLI. These commands all failed with `Error: Error establishing a database connection.`:

- `wp option get siteurl`
- `wp plugin status yaxii-shipping-manager`
- `wp plugin status woocommerce`

Because WordPress could not bootstrap, app load, settings save/reset, preview, diagnostics, and disabled apply could not be verified in the browser during this task.

## Known risks

- The route file remains a large admin-screen module from earlier work; this task kept edits scoped to flow wiring instead of splitting it.
- Browser/runtime behavior still needs a real wp-admin smoke pass once the LocalWP database is available.
- Lint still reports pre-existing Fast Refresh warnings in shared UI component files.

## Blockers

- Local WordPress database connection failure blocked browser smoke.

## Next recommended task

Run a logged-in wp-admin smoke pass after restoring the local database, then proceed to a narrow TASK-006C runtime polish pass only if the browser smoke finds real UI issues.

## Commit hash

Pending.
