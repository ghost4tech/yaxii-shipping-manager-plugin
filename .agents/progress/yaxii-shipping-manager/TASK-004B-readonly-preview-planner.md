# TASK-004B - Read-only Preview Planner

Date: 2026-06-27

## Goal

Build a read-only preview planner that compares the Yaxii current dataset, persisted settings, optional frontend draft overrides, and current WooCommerce diagnostics to return a clear dry-run plan before any WooCommerce write engine exists.

## Scope

- Added backend preview request validation.
- Added deterministic backend preview planning.
- Added `POST /wp-json/yaxii-shipping-manager/v1/preview`.
- Wired the generator review step to request and display grouped preview output.
- Added preview planner documentation.
- Rebuilt admin assets because frontend source changed.

## Files Changed

- `src/Plugin.php`
- `src/Rest/Routes.php`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- Removed old built JS:
  - `assets/admin/assets/main-BzWKzekI.js`
- Added new built JS:
  - `assets/admin/assets/main-2WhKDoUB.js`

## Files Created

- `src/Preview/PreviewPlanner.php`
- `src/Preview/PreviewRequestSanitizer.php`
- `src/Rest/PreviewController.php`
- `admin-app/src/api/preview-api.ts`
- `admin-app/src/types/preview.ts`
- `docs/PREVIEW-PLANNER.md`
- `.agents/progress/yaxii-shipping-manager/TASK-004B-readonly-preview-planner.md`

## What Was Before

TASK-004A exposed read-only diagnostics and the Diagnostics screen could show current WooCommerce zone/method state. The wizard review step still only showed a local draft summary and had no real preview call.

## What Changed

The plugin now has a protected read-only preview endpoint. It accepts optional draft overrides, validates the payload, reads current diagnostics and settings, and returns grouped preview items for proposed creates, updates, method additions, method updates, protected manual-zone skips, conflicts, warnings, and unchanged rows.

## Preview Planner Behavior

The planner:

- Uses current normalized wilayas.
- Uses persisted settings unless draft overrides are provided.
- Uses current diagnostics as the WooCommerce read layer.
- Defaults to all current wilayas when no `selectedWilayaCodes` override is provided.
- Plans `createZones` when a selected wilaya has no direct `DZ:NN` zone.
- Plans `updateZones` only for Yaxii-looking direct zones whose preview name differs.
- Plans `addMethods` when enabled draft methods are not visible on a Yaxii-looking zone.
- Plans `updateMethods` when a matched method label or flat-rate cost string differs from the draft.
- Plans `skipManualZones` when a manual/unknown WooCommerce zone overlaps the wilaya.
- Plans `conflicts` when multiple direct zones match the same wilaya.
- Never plans deletes.
- Returns `canApplyLater: false` with `Apply engine is not implemented yet.`

## REST Endpoint Added

```text
POST /wp-json/yaxii-shipping-manager/v1/preview
```

Security:

- WooCommerce active: requires `manage_woocommerce`.
- WooCommerce inactive: requires `manage_options`.
- Requires `X-WP-Nonce`.
- Uses a real permission callback.
- Does not write WooCommerce, settings, files, or database rows.

Request validation:

- Rejects non-object payloads.
- Rejects unknown top-level keys.
- Validates two-digit wilaya codes.
- Validates `zoneNameFormat` and `regionLabelFormat`.
- Validates fixed MVP method keys and `flat_rate` type.
- Rejects duplicate method keys.
- Rejects negative prices.

## Frontend Changes

- Added `admin-app/src/api/preview-api.ts`.
- Added `admin-app/src/types/preview.ts`.
- Generator review step now has a `Preview changes` action.
- Preview call sends selected wilaya codes, method templates, zone name format, zone prefix, and region label format.
- UI shows loading and error states.
- UI displays grouped preview output:
  - Zones to create
  - Zones to update
  - Methods to add
  - Methods to update
  - Manual zones skipped
  - Conflicts
  - Warnings
  - Unchanged
- UI clearly states: `This is a preview only. No WooCommerce changes were made.`
- Apply remains disabled with `Apply engine comes next.`

## Safety Rules Enforced

- Manual or unknown zones are skipped by default.
- Conflicts are blocked into the `conflicts` group.
- Deletes are never planned.
- Preview is required before any future apply engine.
- Safety policy is returned in the response and remains locked on.

## What Still Remains Mocked

- The local wizard draft remains local until the user explicitly uses it.
- The local shipping table remains draft UI state.
- CSV import/export remains UI-only.

## What Was Not Implemented

- No WooCommerce zones were created, updated, or deleted.
- No WooCommerce shipping methods were added or updated.
- No method prices were changed.
- No safe apply engine was implemented.
- No CSV backend was implemented.
- No YSF sync was implemented.
- No checkout fields were modified.
- No provider imports, commune-level pricing, telemetry, licensing, Pro locks, or remote calls were added.

## Security Review

- Preview is a POST endpoint because it accepts a draft payload.
- POST preview requires both capability and REST nonce.
- Request data is read through `WP_REST_Request`, sanitized, and validated.
- Invalid payloads return `WP_Error` with HTTP 400.
- Dataset read failures return controlled REST errors.
- No public access was added.

## WooCommerce Safety Review

- The preview planner reads diagnostics output only.
- It does not call WooCommerce write APIs.
- It does not instantiate or save shipping zones.
- It does not add shipping methods.
- It does not update flat-rate costs.
- WooCommerce write scans found no preview-path calls to `save()`, `delete()`, `add_shipping_method`, or shipping-zone create/update/delete APIs.

## WordPress.org Compliance Review

- No external assets, tracking, telemetry, licensing, obfuscation, or remote dependency were added.
- Documentation describes implemented read-only preview behavior only.
- The UI does not claim zones were generated or applied.

## QA Guard Findings

- `woo-guard`: Pass. The planner consumes diagnostics data and performs no WooCommerce writes.
- `wp-guard`: Pass. POST endpoint uses capability and REST nonce, validates request body, and avoids direct superglobals.
- `wp-rest-api`: Pass. Route is registered under the existing namespace, uses `WP_REST_Server::CREATABLE`, has a permission callback, and returns controlled `WP_Error` failures.
- `clean-code-guard`: Pass. Planner, sanitizer, controller, frontend API, and types are separated. No fake success or mock response path was added.
- `docs-guard`: Pass. `docs/PREVIEW-PLANNER.md` matches the implemented endpoint, input fields, output groups, safety behavior, and non-implemented boundaries.

## Checks Run

- `composer dump-autoload`
- `php -l src/Plugin.php`
- `php -l src/Rest/Routes.php`
- `php -l src/Rest/PreviewController.php`
- `php -l src/Preview/PreviewPlanner.php`
- `php -l src/Preview/PreviewRequestSanitizer.php`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- forbidden string scan over `src`, `admin-app/src`, and `assets/admin`
- raw dataset bundling scan over built JS
- WooCommerce write scan over preview-related PHP/TS source
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Composer autoload: passed.
- PHP lint: passed.
- TypeScript typecheck: passed.
- Admin lint: passed with 8 existing Fast Refresh warnings and 0 errors.
- Admin build: passed.
- Source maps: none found.
- Forbidden runtime strings: no matches.
- Raw dataset bundle strings: no matches in built JS.
- WooCommerce preview-path write scan: no matches.
- `git diff --check`: passed with Git CRLF warnings only.
- `git status --short --untracked-files=all`: task-scoped changes only before commit.

## Known Risks

- Runtime REST smoke testing through WordPress was not performed in this task.
- Yaxii-managed ownership is still based on weak naming hints until a persisted ownership map exists.
- A broad manual `DZ` zone will conservatively skip matching wilayas by default.
- Unknown but syntactically valid selected wilaya codes are harmlessly ignored because only dataset rows are planned.
- Existing lint Fast Refresh warnings remain in shared UI files.

## Blockers

None.

## Next Recommended Task

TASK-004C: add runtime smoke coverage for diagnostics and preview endpoints, or TASK-005A: design the safe apply contract without implementing writes yet.

## Commit Hash

Final commit hash is reported in the task closeout response.
