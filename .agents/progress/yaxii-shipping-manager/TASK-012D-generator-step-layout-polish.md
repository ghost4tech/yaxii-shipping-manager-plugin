# TASK-012D: Generator Step Layout Polish

## Date

2026-06-30

## Goal

Polish the Generator wizard structure after TASK-012C by making Start its own step and splitting method selection from pricing without changing backend behavior.

## Git state

- Branch: `task/012d-generator-step-layout-polish`
- Base commit confirmed locally: `c4b37ac` (`TASK-012C: simplify generator and enable legacy 58`)
- Pre-existing unrelated dirty files were present before this task and were not staged.
- Commit hash: pending final commit.

## Scope

- UI layout only for Generator wizard steps.
- Documentation and smoke checklist updates for the new flow.
- Admin asset rebuild.
- No backend, REST, dataset, settings, diagnostics, preview planner, registry, or SafeApplyEngine behavior changes.

## Files changed

- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/components/generator/GeneratorStartStep.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-C9Q6OHlL.css`
- `assets/admin/assets/main-jlayDG6c.js`
- `docs/GENERATOR-WIZARD.md`
- `docs/RUNTIME-SMOKE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-012D-generator-step-layout-polish.md`

## Files created

- `admin-app/src/components/generator/GeneratorStartStep.tsx`
- `.agents/progress/yaxii-shipping-manager/TASK-012D-generator-step-layout-polish.md`

## What was before

- `How would you like to start?` was rendered inside the Coverage step.
- Methods and prices shared one long step.
- Preview-only mode could continue into the Generate step shell.

## What changed

- The wizard now uses seven steps:
  1. Start
  2. Coverage
  3. Methods
  4. Prices
  5. Names
  6. Preview
  7. Generate
- Start was extracted into `GeneratorStartStep.tsx`.
- Coverage now contains only dataset mode, wilaya selection, repair context, and collapsed commune reference.
- Methods now contains method enablement and method labels.
- Prices now contains default prices, custom-method prices when enabled, bulk apply, per-wilaya overrides, and price validation.
- Preview-only mode stops at Preview with `Done reviewing` instead of continuing to Generate/apply controls.
- Footer button copy now says `Continue to <next step>` for clearer movement.

## Step flow result

The visible stepper and header now show:

```text
Start -> Coverage -> Methods -> Prices -> Names -> Preview -> Generate
```

Forward gating is:

- Start: always advanceable.
- Coverage: requires at least one selected wilaya.
- Methods: requires at least one enabled method.
- Prices: blocked only by invalid price input.
- Preview: requires a current successful preview before Generate.

## Start step behavior

- Shows diagnostics-derived recommended path.
- Shows `Create new setup`, `Repair existing setup`, and `Preview only`.
- Uses the requested copy:
  - `Create a new shipping setup for selected wilayas.`
  - `Fix missing Yaxii-managed zones or methods. Manual zones are not touched.`
  - `Review the plan without applying changes.`
- If diagnostics report setup already active, the recommendation says:
  `Your setup is already active. Use Shipping Zones for daily price changes.`

## Coverage step behavior

- Coverage is the second step.
- It includes the dataset selector, loaded dataset counts, wilaya selection, repair/no-repair notices, and collapsed commune reference.
- It does not include setup mode cards.
- Commune copy remains:
  `Yaxii uses wilaya-level WooCommerce zones in this release. Communes are shown for reference only.`

## Methods/Prices split

- Methods controls enabled flat-rate methods and labels.
- Prices controls default prices and per-wilaya overrides.
- `0` and `free` remain valid free-shipping values through the existing parser.
- Invalid or negative price input blocks forward movement from Prices.

## Legacy mode UI behavior

- No backend legacy behavior changed.
- The selector still shows:
  - `Current Algeria dataset`
  - `Legacy 58-compatible dataset`
- Counts continue to come from the loaded dataset response.

## Browser/runtime smoke result or blocker

- Browser and runtime smoke remain blocked because LocalWP/WordPress cannot connect to the database.
- Evidence: `wp option get siteurl` returned `Error: Error establishing a database connection.`

## What remains not implemented

- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Reset/wipe tooling.
- Manual-zone adoption.
- Zone-name updates.

## QA guard findings

- `clean-code-guard`: Start step was extracted instead of adding more rendering weight to `GeneratorWizard.tsx`; no speculative backend abstractions were introduced.
- `docs-guard`: `docs/GENERATOR-WIZARD.md` and `docs/RUNTIME-SMOKE.md` now match the seven-step UI.
- `woo-guard`: no WooCommerce write path was added or modified.
- `wp-guard`: no new PHP/admin request handling or public output was added.
- `wp-rest-api`: no REST route or request schema changed.
- `wp-plugin-directory-guidelines`: no telemetry, licensing, Pro locks, remote assets, external fonts, or hidden calls were added.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Source map scan under `assets/admin`
- Restricted phrase scan over `admin-app/src`, `src`, and `assets/admin`
- Raw dataset bundling scan over `assets/admin`
- External asset scan over `admin-app/src`, `src`, and `assets/admin`
- WooCommerce write scan over changed source diff
- `wp option get siteurl`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- TypeScript typecheck: passed.
- ESLint: passed with 8 existing Fast Refresh warnings.
- Admin build: passed with the existing Vite tsconfig-paths notice and chunk-size warning.
- Source map scan: passed, no `.map` files found.
- Restricted runtime phrase scan: passed.
- Raw dataset bundling scan: passed.
- External asset scan: passed.
- Woo write scan: no new write paths found; only the existing `fetchPreview` import appeared.
- WP-CLI runtime check: blocked by database connection failure.
- `git diff --check`: passed; line-ending warnings only.

## Security notes

- No PHP, REST, nonce, capability, or filesystem write behavior changed.
- No direct request handling was added.

## WooCommerce safety notes

- No SafeApplyEngine behavior changed.
- No zone, method, registry, or settings write behavior changed.
- Generator still writes only through the existing preview/apply flow.

## WordPress.org compliance notes

- No external assets, remote fonts, telemetry, licensing, Pro locks, or hidden calls were added.
- Future-only CSV/sync/provider/reset features remain unimplemented.

## Known risks

- Browser behavior could not be verified until the LocalWP database is available.
- The built JS chunk remains slightly above Vite's warning threshold.

## Blockers

- Local WordPress database connection failure blocks browser, REST, and full WP-CLI smoke.

## Next recommended task

Restore LocalWP database connectivity and run TASK-012D browser smoke for Start, Coverage, Methods, Prices, Legacy 58 selection, Preview-only behavior, and existing Preview/Generate behavior.
