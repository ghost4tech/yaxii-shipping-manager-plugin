# TASK-006A - Safe Apply Engine Contract and Confirmation Design

Date: 2026-06-28

## Goal

Design and implement the safe apply confirmation contract shared by the backend and admin app before any WooCommerce write engine exists.

## Scope

This task added a disabled apply contract endpoint, strict apply request validation, preview hash fields, frontend disabled apply copy, and apply contract documentation. It did not create, update, delete, or modify WooCommerce shipping zones or methods.

## Files changed

- `admin-app/src/api/preview-api.ts`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/types/preview.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-BDtjsXzv.js`
- `assets/admin/assets/main-CiiohCr3.js`
- `docs/APPLY-CONTRACT.md`
- `docs/APPLY-WORKFLOW.md`
- `docs/PREVIEW-PLANNER.md`
- `src/Apply/ApplyContract.php`
- `src/Plugin.php`
- `src/Preview/PreviewPlanner.php`
- `src/Rest/Routes.php`

## Files created

- `admin-app/src/types/apply.ts`
- `src/Apply/ApplyRequestSanitizer.php`
- `src/Apply/ApplySafetyValidator.php`
- `src/Rest/ApplyController.php`
- `.agents/progress/yaxii-shipping-manager/TASK-006A-safe-apply-confirmation-contract.md`

## What was before

Preview responses returned a read-only plan and apply readiness state, but there was no backend apply request contract, no disabled `POST /apply` endpoint, and no explicit preview hash/reference fields for future apply validation.

## What changed

The preview response now includes:

- `previewHash`
- `previewGeneratedAt`
- `applyContractVersion`
- `canApplyLater: false`
- `canApplyLaterMessage: Apply engine is not implemented yet.`

The apply contract now exposes the future request fields and required confirmation phrase. The admin app preview panel displays a disabled apply contract section with the preview reference, generated timestamp, and contract version.

## Apply request contract

The disabled apply endpoint validates a future apply payload with these required top-level fields:

- `previewHash`
- `previewGeneratedAt`
- `selectedWilayaCodes`
- `acceptedPlanSummary`
- `confirmed`
- `confirmationText`
- `safetyPolicySnapshot`
- `applyContractVersion`

Validation rejects unknown top-level keys, missing fields, non-SHA-256 preview hashes, stale or future preview timestamps, empty or invalid wilaya codes, decimal/negative summary counts, planned deletes, unsupported contract versions, missing explicit confirmation, wrong confirmation text, and unlocked safety policy snapshots.

Required confirmation text:

`APPLY YAXII SHIPPING PLAN`

Contract version:

`apply-contract-v1`

## Apply endpoint behavior

Added:

`POST /wp-json/yaxii-shipping-manager/v1/apply`

The endpoint requires the same admin capability policy as other protected endpoints plus a valid `X-WP-Nonce`. It validates the request body and always returns a controlled disabled response when validation passes:

- `applyEngineAvailable: false`
- `message: Apply engine is not enabled yet.`
- `requestAccepted: true`
- `validatedRequest`
- `requiredNextSteps`
- `warnings`

No WooCommerce APIs that write zones or methods are called.

## Preview token/hash behavior

`previewHash` is a deterministic SHA-256 hash of the apply contract version, selected wilaya codes, preview summary, plan groups, and locked safety policy. It is not persisted in this task. Future apply work must re-read WooCommerce, regenerate the preview, compare the hash, and only then proceed.

## Frontend changes

The admin preview UI now shows:

- disabled apply state
- preview reference hash prefix
- preview generated timestamp
- apply contract version
- copy explaining that apply will be enabled only after the safe apply engine is implemented

No success state, apply action, or WooCommerce write button was added.

## What still remains mocked

No fake apply success state exists. The wizard and preview remain local/read-only for future apply purposes.

## What was not implemented

- WooCommerce shipping zone creation
- WooCommerce shipping zone updates
- WooCommerce shipping zone deletion
- Shipping method creation
- Shipping method price updates
- Real apply engine
- CSV backend
- YSF sync
- Checkout field modifications
- Commune-level pricing
- Provider imports
- Telemetry, licensing, Pro locks, or remote calls

## Security notes

The apply endpoint uses a real permission callback and requires a REST nonce. Request validation is strict and rejects unknown keys instead of silently accepting unsupported data.

## WooCommerce safety notes

This task is no-write. The changed code does not call `save()`, `delete()`, `add_shipping_method`, `WC_Shipping_Zone`, or shipping zone create/update/delete paths. Future apply remains blocked by the disabled endpoint response.

## WordPress.org compliance notes

The implementation is local-only and introduces no telemetry, external services, CDN dependencies, obfuscation, licensing checks, or remote calls.

## QA guard findings

- `wp-guard`: nonce and capability checks are present on the disabled apply endpoint.
- `wp-rest-api`: route registration uses a real permission callback and returns controlled REST errors for invalid payloads.
- `woo-guard`: no WooCommerce write API calls were introduced.
- `clean-code-guard`: tightened boolean and integer validation to avoid truthy-string acceptance and decimal summary counts.
- `docs-guard`: updated apply and preview docs to state that apply is still disabled and no WooCommerce writes happen.

## Checks run

- `composer dump-autoload`
- `php -l` on changed PHP files
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- forbidden string scan
- raw dataset bundling scan over built JS
- WooCommerce write scan
- option write scan
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- `composer dump-autoload`: passed.
- PHP lint: passed for all changed PHP files.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 8 existing Fast Refresh warnings and 0 errors.
- `npm run build`: passed; rebuilt `assets/admin/assets/main-CiiohCr3.js`.
- Source maps: none found under `assets/admin`.
- Forbidden string scan: no matches.
- Raw dataset bundling scan over built JS: no matches.
- WooCommerce write scan over touched apply/preview/admin paths: no matches.
- Option write scan: only existing plugin settings repository writes found.
- `git diff --check`: passed.
- Final git status: pending at report creation.

## Known risks

- `previewHash` is not persisted and is not yet used to authorize a real apply. Future apply work must regenerate and compare it immediately before writing.
- The disabled apply endpoint validates request shape only; it does not yet verify that the submitted hash matches a freshly generated preview.
- Future apply must re-read WooCommerce state immediately before writing to avoid stale previews.

## Blockers

None.

## Next recommended task

TASK-006B: implement a dry-run-backed apply validation pass that re-reads WooCommerce and compares the submitted preview hash, still without writing, before the first real apply engine task.

## Commit hash

Pending at report creation; final response records the committed hash.
