# TASK-012J - Refresh After Generate and Shipping Editor Rename

## Date

2026-06-30

## Goal

Refresh the editor state after Generator successfully creates setup so merchants do not need to reload the browser, and rename the visible `Shipping Zones` surface to `Shipping Editor`.

## Scope

- Frontend tab/header/action copy only.
- Generator completion state refresh only.
- Documentation updates for the renamed editor and return-refresh smoke expectation.
- No backend write-path changes.

## Files changed

- `admin-app/src/routes/index.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsRecommendationCard.tsx`
- `admin-app/src/components/generator/GeneratorGenerateStep.tsx`
- `admin-app/src/components/generator/GeneratorPreviewSummary.tsx`
- `admin-app/src/components/generator/GeneratorStartStep.tsx`
- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesHeader.tsx`
- `admin-app/src/lib/diagnostics/status.ts`
- `admin-app/src/lib/generator/diagnostics-guidance.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-DkM7cDGE.js`
- `assets/admin/assets/main-BTOrB7ge.js`
- `docs/GENERATOR-WIZARD.md`
- `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SETTINGS-CONTRACT.md`
- `docs/SHIPPING-ZONES-TABLE.md`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-012J-refresh-after-generate-shipping-editor.md`

## What was before

After a successful Generator apply, `Return to shipping editor` closed the wizard and navigated to the editor tab, but diagnostics were not reloaded. Newly generated WooCommerce shipping zones could remain invisible until a full browser refresh.

The main navigation and related actions still used the merchant-facing label `Shipping Zones`.

## What changed

- `GeneratorWizard.onComplete` now increments `diagnosticsReloadKey` before returning to the editor tab.
- The diagnostics effect reloads WooCommerce state and rebuilds Shipping Editor rows from fresh diagnostics.
- Visible navigation, header, generator, diagnostics, and settings copy now use `Shipping Editor`.
- Internal route id and component names remain stable to keep this change narrow.
- Built admin assets were regenerated with Vite.

## What still remains mocked

- CSV import/export backend remains unimplemented.
- Commune-specific pricing remains unimplemented.
- Provider imports and YSF sync remain unimplemented.

## Security notes

No PHP, REST, nonce, capability, or backend write code changed.

## WooCommerce safety notes

No new WooCommerce create, update, delete, manual-zone, or manual-method paths were added. Existing writes remain behind Generator preview/apply and Shipping Editor review/apply flows.

## WordPress.org compliance notes

No telemetry, licensing, remote assets, external fonts, hidden calls, or obfuscated code were added.

## Checks run

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Source map scan under `assets/admin`
- Restricted phrase scan over `admin-app/src`, `src`, `assets/admin`, and updated docs
- Raw dataset token scan over built admin JS
- Targeted external asset scan for remote fonts, remote CSS, and remote scripts
- WooCommerce write/delete diff scan over `admin-app/src` and `src`
- `git diff --check -- admin-app/src docs/SHIPPING-ZONES-TABLE.md docs/GENERATOR-WIZARD.md docs/RUNTIME-SMOKE.md docs/SETTINGS-CONTRACT.md docs/RESET-AND-CLEANUP-TOOL-PLAN.md assets/admin`
- `git status --short --untracked-files=all`

## Check results

- Typecheck passed.
- Lint passed with pre-existing fast-refresh warnings in shared UI files and `main.tsx`.
- Build passed and emitted `assets/admin/assets/main-DkM7cDGE.js`.
- No source maps found under `assets/admin`.
- Restricted phrase scan returned no matches.
- Raw dataset token scan returned no matches.
- Targeted external asset scan returned no matches.
- WooCommerce write/delete diff scan returned no matches.
- Diff whitespace check passed.

## Known risks

- Browser smoke was not run for this narrow task. The behavior is covered by the React state path and build/typecheck, but a live click-through should still be done before release.
- Lint still reports existing fast-refresh warnings outside this task.

## Blockers

None.

## Next recommended task

Run a browser smoke on a disposable store: generate a small controlled setup, click `Return to shipping editor`, and confirm the generated rows appear without refreshing.

## Commit hash, if committed

Pending at report creation; final response records the committed hash.
