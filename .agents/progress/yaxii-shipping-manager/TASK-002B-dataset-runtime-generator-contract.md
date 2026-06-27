# TASK-002B - Dataset Runtime, REST Wiring, and Generator Contract

Date: 2026-06-27

## Goal

Normalize the S450R1 candidate source into Yaxii-owned runtime dataset files, validate the normalized contract, expose a read-only backend dataset repository and REST endpoint, align bootstrap contracts, wire the admin app to real dataset wilayas, and define the future generator/settings contract without WooCommerce writes.

## Scope

Included:

- Generated normalized current dataset files under `data/algeria/current/`.
- Added legacy 58-compatible placeholder metadata under `data/algeria/legacy-58/`.
- Added source normalization and normalized validation scripts.
- Added PHP dataset repository and read-only REST controller.
- Added `GET /wp-json/yaxii-shipping-manager/v1/dataset`.
- Updated bootstrap `datasetStatus` to expose current/legacy availability.
- Updated TypeScript bootstrap/dataset/generator contracts.
- Updated the admin app to fetch current wilayas from REST instead of inline mock wilaya rows.
- Rebuilt local admin assets.
- Added dataset runtime documentation.

Excluded:

- WooCommerce shipping-zone create/update/delete.
- WooCommerce diagnostics backend.
- Preview planner.
- Safe apply engine.
- CSV import/export backend.
- YSF sync.
- Provider imports.
- Checkout field modifications.
- Commune-level shipping price engine.
- Legacy 58 mapping population.
- Old `app/` changes.

## Files Changed / Created

Created:

- `tools/normalize-s450r1-dataset.mjs`
- `tools/validate-normalized-dataset.mjs`
- `data/algeria/current/metadata.json`
- `data/algeria/current/wilayas.json`
- `data/algeria/current/communes.json`
- `data/algeria/legacy-58/metadata.json`
- `src/Data/DatasetMode.php`
- `src/Data/DatasetReadException.php`
- `src/Data/DatasetRepository.php`
- `src/Rest/DatasetController.php`
- `admin-app/src/api/dataset-api.ts`
- `admin-app/src/types/dataset.ts`
- `admin-app/src/types/generator.ts`
- `docs/DATASET.md`
- `.agents/progress/yaxii-shipping-manager/TASK-002B-dataset-runtime-generator-contract.md`

Changed:

- `src/Plugin.php`
- `src/Rest/BootstrapController.php`
- `src/Rest/Routes.php`
- `admin-app/src/bootstrap.ts`
- `admin-app/src/main.tsx`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-B9zjV8TX.css` removed by rebuild.
- `assets/admin/assets/main-Brw6ZjQB.js` removed by rebuild.
- `assets/admin/assets/main-D4KxDRFu.css` added by rebuild.
- `assets/admin/assets/main-BANK_rYQ.js` added by rebuild.
- `docs/DATASET-SOURCES.md`

## Dataset Normalization Summary

`tools/normalize-s450r1-dataset.mjs` reads:

- `data/sources/s450r1-algeria-cities-2025/cities.json`

It writes only:

- `data/algeria/current/metadata.json`
- `data/algeria/current/wilayas.json`
- `data/algeria/current/communes.json`
- `data/algeria/legacy-58/metadata.json`

Normalization behavior:

- Wilaya numeric IDs become 2-digit string codes.
- Commune numeric IDs become 4-digit string codes.
- Source IDs are preserved as numbers.
- Arabic and Latin/French labels are preserved.
- Labels are trimmed and repeated whitespace is collapsed.
- No records are dropped.
- No names are translated.

The normalizer reported 11 cleaned labels:

- 2 Latin commune labels with repeated whitespace.
- 8 Arabic commune labels with repeated whitespace.
- 1 Arabic commune label with leading whitespace.

## Current Dataset Counts

- Current wilayas: `69`
- Current communes: `1541`
- Metadata version: `current-candidate-2025`
- Complete: `true`
- Verified: `false`

## Legacy Dataset Decision

Legacy mode is contract-only in this task.

`data/algeria/legacy-58/metadata.json` explicitly marks:

- `available`: `false`
- `complete`: `false`
- `verified`: `false`
- reason: mapping deferred until an auditable mapping/cross-source comparison exists.

No legacy 58 rows were guessed or generated.

## Validation Script Results

`tools/validate-normalized-dataset.mjs` validates:

- Metadata existence and mode.
- Current wilaya and commune counts.
- String code formats.
- Numeric source IDs.
- Duplicate wilaya and commune codes.
- Commune `wilaya_code` references.
- Required labels.
- Trimmed labels and no repeated whitespace.
- Mojibake markers.
- UI/build-facing forbidden wording.
- Legacy metadata unavailable/incomplete state.

Result: passed.

## Backend Dataset Repository Summary

Added `Yaxii\ShippingManager\Data\DatasetRepository`.

Behavior:

- Reads normalized JSON from `data/algeria/`.
- Does not read raw `data/sources/` at runtime.
- Supports current wilayas and communes.
- Returns legacy status as unavailable.
- Throws controlled `DatasetReadException` for missing/invalid files.
- Does not use SQL, options, external calls, or WooCommerce APIs.

## REST Endpoint Summary

Added read-only endpoint:

```text
GET /wp-json/yaxii-shipping-manager/v1/dataset
```

Query params:

- `mode=current|legacy_58`
- `include=summary|wilayas|communes`
- `wilaya_code=01` for optional commune filtering

Default:

- `mode=current`
- `include=wilayas`

Security:

- Same capability policy as bootstrap.
- WooCommerce active: `manage_woocommerce`.
- WooCommerce inactive: `manage_options`.
- Route has `permission_callback`.
- Args have sanitize and validate callbacks.
- Invalid mode/include/wilaya_code return REST validation errors.
- Legacy data requests for wilayas/communes return a controlled unavailable error.
- No write routes were added.

## Bootstrap Contract Changes

`datasetStatus` now matches the TypeScript contract:

- `datasetStatus.current.available`
- `datasetStatus.current.complete`
- `datasetStatus.current.verified`
- `datasetStatus.current.wilayaCount`
- `datasetStatus.current.communeCount`
- `datasetStatus.current.version`
- `datasetStatus.legacy58.available`
- `datasetStatus.legacy58.complete`
- `datasetStatus.legacy58.verified`
- `datasetStatus.legacy58.reason`

`admin-app/src/bootstrap.ts` was updated to match PHP payload keys for capabilities, admin URLs, feature flags, and dataset status. It now performs a minimal runtime object-shape check before returning the payload.

## Frontend Dataset Wiring Summary

The admin app now:

- Fetches `GET /dataset?mode=current&include=wilayas` after bootstrap succeeds.
- Uses REST wilayas as the source for the local draft table and generator base list.
- Shows dataset loading, error, and loaded states.
- Gates generator launch until the dataset is loaded.
- Keeps all changes local/draft only.
- Does not import `data/algeria/*.json` or raw `cities.json` into React.
- Does not load communes by default.

Inline mock wilaya rows and placeholder Arabic labels were removed from active frontend source.

## Generator / Settings Contract Summary

Added frontend domain types:

- `DatasetMode`
- `RegionLabelFormat`
- `ShippingMethodTemplate`
- `ShippingMethodKey`
- `GeneratorDraft`
- `PricingMatrixRow`
- `ZoneNamingTemplate`
- `ManualZoneProtectionPolicy`

MVP method keys are defined as:

- `home_delivery`
- `office_delivery`
- `custom_1`
- `custom_2`

Settings UI now shows draft-only controls for:

- Dataset mode.
- Label format.
- Zone name format.
- Currency label.
- Default home price.
- Default office price.
- Optional custom method labels/prices.
- Manual zone protection.
- Preview-before-apply requirement.

No settings persistence was implemented.

## QA Guard Findings and Fixes

Clean-code guard:

- Fixed PHP 7.4 compatibility by replacing `array_is_list()` with a local list-shape helper.
- Avoided fake success paths; unavailable legacy mode returns explicit unavailable metadata/error.
- Kept dataset repository, REST controller, and frontend API client focused.

WP/plugin guard:

- REST route uses capability checks.
- REST args are sanitized/validated.
- No direct request superglobals were introduced.
- No SQL or options/autoloaded data were introduced.

WP REST API guard:

- `register_rest_route()` includes `permission_callback`.
- Args include defaults, sanitizers, and validators.
- Read responses use REST response helpers.
- Invalid/unavailable data returns `WP_Error`.

Woo guard:

- No WooCommerce order/product/shipping APIs were added.
- No WooCommerce shipping-zone read/write code was added.
- No checkout hooks, money logic, HPOS surfaces, or Store API writes were added.

Test guard:

- No brittle mock-heavy tests were added.
- Validation behavior is covered by executable Node validation scripts against real generated JSON files.

Docs guard:

- `docs/DATASET.md` documents only implemented behavior.
- Official-status wording remains cautious: current data is candidate and unverified.
- Legacy mode is documented as deferred/unavailable.

## What Remains Draft / Mock

- Shipping prices and enabled rows remain local draft state only.
- Generator/settings controls are draft-only and not persisted.
- Diagnostics screen still uses local draft checks only.
- Import/export UI remains disabled/backend-not-connected.
- Smart Form Sync remains coming-later only.

## What Was Not Implemented

- Settings persistence.
- WooCommerce diagnostics backend.
- WooCommerce zone reader.
- Preview planner.
- Safe apply engine.
- CSV import/export backend.
- Legacy 58 mapping.
- Commune-level pricing.
- WooCommerce shipping-zone writes.
- YSF sync.

## Checks Run / Results

- `node tools/validate-s450r1-source.mjs`: passed.
- `node tools/normalize-s450r1-dataset.mjs`: passed; generated current and legacy metadata files and reported 11 cleaned labels.
- `node tools/validate-normalized-dataset.mjs`: passed.
- `composer dump-autoload`: passed.
- `php -l` on all PHP files under `src/`: passed.
- `npm run typecheck` in `admin-app`: passed.
- `npm run lint` in `admin-app`: passed with 8 pre-existing Fast Refresh warnings and 0 errors.
- `npm run build` in `admin-app`: passed. New assets:
  - `assets/admin/assets/main-BANK_rYQ.js`
  - `assets/admin/assets/main-D4KxDRFu.css`
- Source map check under `assets/admin`: passed; no `.map` files found.
- Forbidden string scan over `src`, `admin-app/src`, and `assets/admin`: passed.
- Raw dataset bundling scan over built JS: passed; no `s450r1-algeria-cities-2025`, `commune_name_arabic`, or `wilaya_name_latin` strings found.
- `git diff --check`: passed with Git CRLF warnings only.

## Risks

- Current dataset remains candidate/unverified until independent official/cross-source verification is done.
- Legacy 58-compatible mode is unavailable until an auditable mapping exists.
- The REST endpoint was not runtime-tested through a logged-in browser/WP-CLI session in this task.
- Lint still reports existing Fast Refresh warnings in shadcn-style components and `main.tsx`.
- Release packaging still needs the broader allowlist/readme/license/i18n work from TASK-001K.

## Blockers

None for TASK-002B.

## Next Recommended Task

TASK-003: persist dataset mode and local generator/settings draft state using safe WordPress options with explicit validation, no WooCommerce writes, and no preview/apply behavior yet.

## Commit Hash, If Committed

`1478da555c7cd0a4f44d17dea5ecf2576357543a`
