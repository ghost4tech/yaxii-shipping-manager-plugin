# TASK-005A - Safe Apply Contract and Ownership Model

Date: 2026-06-27

## Goal

Design and implement the safe apply contract foundation and ownership model so future WooCommerce writes can distinguish Yaxii-managed zones from manual merchant zones.

## Scope

- Added a read-only managed zone registry contract.
- Added a read-only apply contract service and REST endpoint.
- Updated the preview planner to resolve ownership from the managed registry before weak name hints.
- Updated preview UI rows to show ownership source.
- Added apply contract documentation and updated preview planner documentation.
- Rebuilt admin assets because frontend source changed.

No WooCommerce writes were implemented.

## Files Changed

- `admin-app/src/routes/index.tsx`
- `admin-app/src/types/preview.ts`
- `assets/admin/.vite/manifest.json`
- `docs/PREVIEW-PLANNER.md`
- `src/Plugin.php`
- `src/Preview/PreviewPlanner.php`
- `src/Rest/Routes.php`
- Removed old built JS:
  - `assets/admin/assets/main-2WhKDoUB.js`
- Added new built JS:
  - `assets/admin/assets/main-CVgJ7N5E.js`

## Files Created

- `src/Apply/ManagedZoneRegistry.php`
- `src/Apply/ApplyContract.php`
- `src/Rest/ApplyContractController.php`
- `docs/APPLY-CONTRACT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-005A-safe-apply-contract-ownership-model.md`

## What Was Before

Diagnostics and preview could classify zones only through weak naming hints. A zone that looked like it started with the Yaxii prefix could be treated as Yaxii-looking, but there was no durable Yaxii ownership registry.

## What Changed

The plugin now has a read-only managed registry contract based on the option name `yaxii_shipping_manager_managed_zones`. The registry reader returns sanitized records when present and an empty registry when the option is missing or invalid.

The preview planner now resolves ownership in this order:

1. `managed_registry`
2. `yaxii_name_hint`
3. `manual_unknown`

Preview plan items now expose ownership source data, and the admin preview UI displays it as `Yaxii managed`, `Yaxii-looking`, or `Manual/unknown`.

## Ownership Model

Managed zone records support:

- `wilayaCode`
- `zoneId`
- `zoneName`
- `methodInstances`
- `createdBy`
- `createdAt`
- `updatedAt`
- `source`
- `schemaVersion`

Managed method instance records support:

- `methodKey`
- `instanceId`
- `methodId`
- `title`
- `lastKnownCost`

The registry is intentionally read-only in this task. No fake records are created.

## Managed Registry Behavior

- Missing option returns an empty registry.
- Non-array option values return an empty registry.
- Invalid records are skipped in memory.
- Records require at least a two-digit `wilayaCode` and positive `zoneId`.
- Method instances require a positive `instanceId`.
- No repaired records are persisted.
- No WooCommerce data is written.

## Preview Planner Ownership Changes

- Registered zone IDs are treated as Yaxii-managed.
- Yaxii-looking names remain weak hints.
- Manual/unknown overlapping zones continue to be skipped by default.
- Duplicate direct zone matches remain conflicts.
- Create previews indicate the future zone would be recorded under the managed registry by a later apply engine.

## Apply Contract Endpoint

Added:

```text
GET /wp-json/yaxii-shipping-manager/v1/apply-contract
```

The endpoint returns:

- `applyEngineAvailable: false`
- `managedRegistryAvailable: true`
- `managedRegistryOption`
- `managedZoneCount`
- locked `safetyPolicy`
- `requiredNextSteps`
- `warnings`
- `generatedAt`

Security:

- WooCommerce active: requires `manage_woocommerce`.
- WooCommerce inactive: requires `manage_options`.
- Uses a real permission callback.
- Read-only endpoint only.

## Frontend Changes

- Preview plan item types now include `ownershipSource` and `ownershipSources`.
- Preview rows show ownership badges.
- Review draft screen now says: `Apply engine is not enabled yet. Yaxii will only apply reviewed plans in a later step.`
- Apply remains disabled.

## What Still Remains Mocked

- Wizard draft state remains local until settings or future preview/apply flows use it.
- CSV import/export remains UI-only.
- The future apply action remains unavailable.

## What Was Not Implemented

- No WooCommerce shipping zones were created, updated, or deleted.
- No WooCommerce shipping methods were added or updated.
- No method prices were changed.
- No safe apply engine was implemented.
- No CSV backend was implemented.
- No YSF sync was implemented.
- No checkout fields were modified.
- No provider imports, commune-level pricing, telemetry, licensing, Pro locks, or remote calls were added.

## Security Notes

- The new endpoint is not public.
- Permission checks reuse the existing capability policy.
- The registry reader uses `get_option()` only.
- No request body is accepted by the apply contract endpoint.
- The preview endpoint remains POST with nonce protection.

## WooCommerce Safety Notes

- No WooCommerce write APIs were added.
- No `WC_Shipping_Zone` objects are created or saved by this task.
- No shipping methods are added.
- Manual/unknown zones remain protected by default.
- Name hints are documented as weak and non-authoritative.

## WordPress.org Compliance Notes

- No telemetry, analytics, licensing, remote calls, external CDN assets, or obfuscation were added.
- Documentation describes only implemented read-only behavior and clearly marks the apply engine as future work.

## QA Guard Findings

- `woo-guard`: Pass. New apply contract and registry code perform no WooCommerce writes. Existing WooCommerce reads remain in the diagnostics read layer.
- `wp-guard`: Pass. Option access is read-only in the registry; the new endpoint has a capability callback and no unsafe request handling.
- `wp-rest-api`: Pass. `/apply-contract` is registered under the existing namespace with `WP_REST_Server::READABLE`, a callback, and a real permission callback.
- `wp-plugin-directory-guidelines`: Pass. No tracking, remote dependency, licensing, upsell gate, or obfuscation was added.
- `clean-code-guard`: Pass. Registry, contract, controller, and preview ownership resolution are separated. No fake managed records or hardcoded success path was added.
- `docs-guard`: Pass. `docs/APPLY-CONTRACT.md` and `docs/PREVIEW-PLANNER.md` match the implemented read-only ownership behavior.

## Checks Run

- `composer dump-autoload`
- `php -l src/Apply/ManagedZoneRegistry.php`
- `php -l src/Apply/ApplyContract.php`
- `php -l src/Rest/ApplyContractController.php`
- `php -l src/Preview/PreviewPlanner.php`
- `php -l src/Plugin.php`
- `php -l src/Rest/Routes.php`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- forbidden string scan over `src`, `admin-app/src`, and `assets/admin`
- raw dataset bundling scan over built JS
- WooCommerce write scan over apply/preview/frontend paths
- option write scan over `src`
- broad WooCommerce scan over `src` and `admin-app/src`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Composer autoload: passed.
- PHP lint: passed for all changed PHP files.
- TypeScript typecheck: passed.
- Admin lint: passed with 8 existing Fast Refresh warnings and 0 errors.
- Admin build: passed; generated `assets/admin/assets/main-CVgJ7N5E.js`.
- Source maps: none found under `assets/admin`.
- Forbidden runtime strings: no matches in `src`, `admin-app/src`, or `assets/admin`.
- Raw dataset bundle strings: no matches in built JS.
- WooCommerce apply/preview write scan: no matches.
- Option write scan: found only existing settings option writes in `SettingsRepository`; the managed registry does not write options in this task.
- Broad WooCommerce scan found only existing read-only diagnostics `WC_Shipping_Zone` references.
- `git diff --check`: passed with Git CRLF warnings only.
- Final git status: task-scoped changes only before commit.

## Known Risks

- Runtime REST smoke testing through WordPress was not performed in this task.
- The managed registry is empty until a future apply engine writes records.
- Yaxii-looking name hints remain weak and must not be used as proof of ownership by the future apply engine.
- Existing lint Fast Refresh warnings remain in shared UI files.

## Blockers

None.

## Next Recommended Task

TASK-005B: implement a safe apply dry-run confirmation contract or apply-engine design audit before introducing any WooCommerce write code.

## Commit Hash

Final commit hash is reported in the task closeout response.
