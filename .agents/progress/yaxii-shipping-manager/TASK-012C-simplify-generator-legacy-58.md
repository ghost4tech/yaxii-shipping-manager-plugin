# TASK-012C: Simplify Generator MVP Flow and Enable Legacy 58 Mode

## Date

2026-06-30

## Goal

Simplify the Generator into a release-ready setup and repair flow, and enable a real Legacy 58-compatible dataset mode derived from the normalized current Algeria dataset.

## Git state

- Branch: `task/012c-simplify-generator-legacy-58`
- Base commit confirmed locally: `ff3a2d4` (`TASK-012B: clean release navigation and status UX`)
- Pre-existing unrelated dirty files were present before this task and were not staged.
- Commit hash: pending final commit.

## Scope

- Enable `legacy_58` as an available dataset mode.
- Make dataset, settings, preview, diagnostics, and admin bootstrap code mode-aware.
- Replace the long Generator wizard with a shorter MVP flow.
- Use diagnostics to guide Generator start mode.
- Keep all WooCommerce writes behind preview/apply safety boundaries.
- Remove hidden hash access to future import/sync screens from the release admin route.

## Files changed

- `admin-app/src/api/dataset-api.ts`
- `admin-app/src/api/settings-api.ts`
- `admin-app/src/bootstrap.ts`
- `admin-app/src/components/generator/GeneratorGenerateStep.tsx`
- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/data/default-settings.ts`
- `admin-app/src/lib/generator/diagnostics-guidance.ts`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/types/dataset.ts`
- `admin-app/src/types/preview.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-BuH1Rcfa.css`
- `assets/admin/assets/main-DRBkLeoN.js`
- `data/algeria/legacy-58/metadata.json`
- `data/algeria/legacy-58/wilayas.json`
- `data/algeria/legacy-58/communes.json`
- `docs/DATASET.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/RELEASE-UX-WORKFLOW-AUDIT.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SETTINGS-CONTRACT.md`
- `src/Data/DatasetRepository.php`
- `src/Preview/PreviewPlanner.php`
- `src/Preview/PreviewRequestSanitizer.php`
- `src/Rest/DatasetController.php`
- `src/Settings/SettingsDefaults.php`
- `src/Settings/SettingsSanitizer.php`
- `src/WooCommerce/AlgeriaStatesRegistrar.php`
- `src/WooCommerce/ShippingDiagnosticsService.php`
- `tools/normalize-s450r1-dataset.mjs`
- `tools/validate-normalized-dataset.mjs`

## Files created

- `admin-app/src/lib/generator/diagnostics-guidance.ts`
- `data/algeria/legacy-58/wilayas.json`
- `data/algeria/legacy-58/communes.json`
- `.agents/progress/yaxii-shipping-manager/TASK-012C-simplify-generator-legacy-58.md`

## What was before

- `legacy_58` existed as a disabled/future dataset mode.
- Dataset REST blocked legacy mode.
- Settings sanitization reset legacy mode to current.
- Preview and diagnostics were effectively current-dataset only.
- Generator had several setup modes that looked different but behaved too similarly.
- Generator used a longer flow with standalone commune and safety steps.
- Hidden hash routes could still expose future Import/Export and Smart Form Sync screens.

## What changed

- `legacy_58` is available and backed by generated JSON files.
- Legacy mode filters wilaya codes `01` through `58` from the normalized current dataset and includes only communes belonging to those wilayas.
- Dataset REST accepts `mode=legacy_58`.
- Settings sanitizer accepts `datasetMode: legacy_58`.
- Preview requests can carry `datasetMode`.
- Preview planner and diagnostics read the active/selected dataset mode so legacy mode does not report the current-only additional wilayas as missing.
- Admin bootstrap exposes active dataset mode and legacy availability.
- Generator starts with diagnostics-guided recommendations:
  - `Create new setup`
  - `Repair existing setup`
  - `Setup already active`
  - `Manual zones need review`
- Generator mode behavior now differs:
  - Create selects all wilayas in the selected dataset.
  - Repair preselects missing or method-incomplete managed wilayas and excludes manual/unknown zones.
  - Preview only runs preview without exposing apply/generate.
- Wizard steps are now:
  1. Coverage
  2. Methods and prices
  3. Names
  4. Preview
  5. Generate
- The standalone commune and safety steps were removed.
- Safety copy is inline in Preview.
- The Generator uses real dataset counts and no hardcoded additional wilaya count.
- Future Import/Export and Smart Form Sync route screens were removed from the release route file.

## What still remains mocked

- CSV import/export backend is still not implemented.
- Commune-level pricing is still not implemented.
- Provider import/dispatch is still not implemented.
- YSF sync is still not implemented.
- Zone-name apply support is still not implemented.
- Manual-zone adoption is still not implemented.

## Legacy 58 implementation

- Generated from the normalized current dataset, not manually typed.
- Wilayas: 58.
- Communes: 1433.
- Codes above `58`: none.
- Metadata marks the dataset available and derived from the user-verified first 58 records of the current normalized dataset.
- Metadata avoids independent official/legal verification claims.

## Generator mode changes

- `Create new setup` defaults to all wilayas for the selected dataset mode.
- `Repair existing setup` uses diagnostics to preselect missing wilayas and managed zones without enabled methods.
- `Preview only` is an advanced support path and hides the apply/generate action.
- No CSV upload/download action is shown in Generator.

## New wizard steps

- Coverage includes dataset mode selection, wilaya selection, and collapsed commune reference.
- Methods and prices controls shipping methods, defaults, custom method slots, and existing per-wilaya overrides.
- Names controls future naming preview and clearly says existing WooCommerce zone names are not changed in this release.
- Preview auto-runs the real preview and shows safety copy inline.
- Generate is only available when preview supports work; no-op state opens Shipping Zones instead.

## Diagnostics-guided behavior

- Fresh/no setup recommends creating a new Algeria shipping setup.
- Missing managed zones or methods recommend repair.
- Fully active setup recommends using Shipping Zones for daily changes.
- Manual conflicts recommend Diagnostics review and states that Yaxii will not edit manual zones.

## Commune handling

- Communes are no longer a main wizard step.
- Coverage includes collapsed commune reference only.
- Copy states that this release uses wilaya-level WooCommerce zones and communes are for reference.

## Safety handling

- No direct Generator writes were added.
- Apply remains behind preview, nonce/capability checks, preview hash, safety policy, managed registry ownership, and WooCommerce re-read.
- Inline safety copy says manual zones are protected, no deletes are made, and WooCommerce is checked again before applying.

## Browser smoke result or blocker

- Browser smoke was blocked because LocalWP/WordPress runtime could not connect to the database.
- Evidence: `wp option get siteurl` returned `Error: Error establishing a database connection.`

## Runtime smoke result

- WP-CLI/REST runtime smoke was blocked by the same database connection failure.
- Local PHP repository smoke passed:
  - `legacy_wilayas=58`
  - `legacy_communes=1433`
  - `codes_above_58=0`

## QA guard findings

- `wp-guard`: no new direct request access, no new unsafe admin output path, and release route now exposes only the four intended tabs.
- `woo-guard`: no new WooCommerce write path; apply behavior remains in the existing safe apply boundary.
- `wp-rest-api`: dataset and preview mode handling remains behind existing REST controller/sanitizer paths.
- `wp-plugin-directory-guidelines`: no telemetry, licensing, Pro locks, remote assets, or hidden calls were added.
- `clean-code-guard`: diagnostics guidance was extracted to `admin-app/src/lib/generator/diagnostics-guidance.ts` instead of further growing the wizard with helper logic.
- `docs-guard`: docs now describe implemented behavior and label CSV/commune/provider/sync work as not implemented.

## Checks run

- `node tools/validate-normalized-dataset.mjs`
- `composer dump-autoload`
- `php -l` on changed PHP files
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Source map scan under `assets/admin`
- Restricted phrase scan over `admin-app/src`, `src`, and `assets/admin`
- Raw dataset bundling scan over `assets/admin`
- External asset scan over `admin-app/src`, `src`, and `assets/admin`
- WooCommerce write scan over changed source diff
- Local PHP repository smoke for `legacy_58`
- `wp option get siteurl`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- Dataset validation: passed.
- Composer autoload generation: passed.
- PHP syntax: passed.
- TypeScript typecheck: passed.
- ESLint: passed with 8 existing Fast Refresh warnings.
- Admin build: passed with existing Vite tsconfig-paths notice and chunk-size warning.
- Source map scan: passed, no `.map` files found under `assets/admin`.
- Restricted runtime phrase scan: passed.
- Raw dataset bundling scan: passed.
- External asset scan: passed.
- Woo write scan: no new write paths found; only preview import and safety copy appeared in diff scan.
- Local PHP legacy repository smoke: passed.
- WP-CLI runtime smoke: blocked by database connection failure.
- `git diff --check`: passed; line-ending warnings only.

## Known risks

- Browser behavior could not be verified until the LocalWP database is available.
- The admin bundle remains slightly above the Vite chunk warning threshold.
- Legacy 58 compatibility is based on the user-verified first 58 records in the normalized current dataset; no independent official/legal verification is claimed.

## Blockers

- Local WordPress database connection failed, blocking browser, REST, and full WP-CLI runtime smoke.

## Next recommended task

Restore LocalWP database connectivity, then run the TASK-012C browser smoke scenarios for current mode, legacy mode, repair mode, preview-only mode, and collapsed commune reference.
