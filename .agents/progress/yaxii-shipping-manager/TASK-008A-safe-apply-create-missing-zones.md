# TASK-008A - Safe Apply Engine: Create Missing Yaxii-Managed Zones Only

Date: 2026-06-28

## Goal

Implement the first narrow safe apply engine step: after a fresh preview revalidation, create only missing Yaxii-managed WooCommerce shipping zones for selected Algeria wilayas.

## Scope

- Enable the existing `/apply` endpoint for a create-only apply step.
- Revalidate the submitted preview immediately before any WooCommerce write.
- Create zones only from fresh `createZones` preview items.
- Record created zones in `yaxii_shipping_manager_managed_zones`.
- Enable the admin wizard apply control only for createable, non-blocked previews with explicit confirmation.
- Update apply documentation to describe the implemented create-only scope.

Out of scope: shipping methods, method prices, zone updates, zone deletes, manual-zone adoption, CSV backend, commune-level pricing, provider imports, checkout changes, YSF sync, licensing, remote calls, and Pro locks.

## Files changed

- `src/Apply/ApplyContract.php`
- `src/Apply/ApplyReadinessEvaluator.php`
- `src/Apply/ApplyRequestSanitizer.php`
- `src/Apply/ManagedZoneRegistry.php`
- `src/Apply/SafeApplyEngine.php`
- `src/Plugin.php`
- `src/Preview/PreviewPlanner.php`
- `src/Rest/ApplyController.php`
- `admin-app/src/api/apply-api.ts`
- `admin-app/src/api/preview-api.ts`
- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/components/generator/PreviewPlanPanel.tsx`
- `admin-app/src/components/generator/types.ts`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/types/apply.ts`
- `admin-app/src/types/preview.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-A6qveiuR.js`
- `assets/admin/assets/main-DYYyrMeQ.js`
- `docs/APPLY-CONTRACT.md`
- `docs/APPLY-WORKFLOW.md`
- `docs/DIAGNOSTICS.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/PREVIEW-PLANNER.md`
- `docs/SETTINGS-CONTRACT.md`

## Files created

- `src/Apply/SafeApplyEngine.php`
- `admin-app/src/api/apply-api.ts`
- `docs/APPLY-ENGINE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-008A-safe-apply-create-missing-zones.md`

## What was before

- `/apply` accepted the apply confirmation contract but always returned a disabled response.
- Preview could explain planned creates, updates, method gaps, conflicts, manual skips, and readiness, but no WooCommerce write path existed.
- The admin wizard showed apply as disabled.
- The managed zone registry was read-only.

## What changed

- `/apply` now runs a create-only safe apply engine.
- The engine regenerates a fresh preview from the submitted `previewRequest` immediately before writing.
- The engine blocks stale previews, changed summaries, blocked readiness, conflicts, unsupported update-only plans, missing WooCommerce, invalid confirmation, unlocked safety policy, and invalid selected wilayas.
- The only WooCommerce write creates new `WC_Shipping_Zone` records from fresh `createZones` items.
- Each created zone receives exactly one `state` location, such as `DZ:17`.
- Created zones are recorded in `yaxii_shipping_manager_managed_zones` with empty `methodInstances`.
- The admin wizard now enables apply only when the preview has creates, no conflicts, non-blocked readiness, and the explicit confirmation phrase `APPLY YAXII SHIPPING PLAN`.
- The apply result reports created, skipped/manual, blocked, registry, warnings, and whether WooCommerce changed.

## Apply behavior

Allowed in TASK-008A:

- Create missing Yaxii-managed zones only.
- Append zones after existing WooCommerce shipping zones.
- Return `applied: true` only when at least one zone was created.

Blocked or not implemented:

- Existing zone updates.
- Deletes.
- Shipping method creation.
- Shipping method label or price updates.
- Manual or unknown zone writes.
- Manual-zone adoption.

## Preview revalidation behavior

The apply endpoint validates the request, then uses the submitted `previewRequest` to regenerate the preview against current WooCommerce diagnostics. The submitted hash and accepted summary must match the regenerated preview before any write occurs. Reapplying the same preview after the first successful create is blocked as stale because the fresh preview no longer has the same create plan.

## Zone creation behavior

`SafeApplyEngine` creates only fresh preview `createZones` items. The runtime smoke created:

- Zone ID `1`: `Yaxii Smoke - 16 Alger`, location `state:DZ:16`, methods `0`.
- Zone ID `2`: `Yaxii Smoke - 17 Djelfa - الجلفة`, location `state:DZ:17`, methods `0`.

No methods or prices were created.

## Managed registry behavior

The registry option `yaxii_shipping_manager_managed_zones` is updated with `autoload=false`. Records include:

- `wilayaCode`
- `zoneId`
- `zoneName`
- `methodInstances: []`
- `createdBy: yaxii_shipping_manager`
- `createdAt`
- `updatedAt`
- `source: apply_create_missing_zones`
- `schemaVersion`

The runtime registry contains records for wilayas `16` and `17` from the controlled smoke.

## Frontend apply behavior

- Apply is enabled only after preview when creates exist and readiness is not blocked.
- Merchant must check confirmation and type `APPLY YAXII SHIPPING PLAN`.
- UI copy says `Create zones` and `Zones created`; it does not claim methods, prices, or full setup were completed.
- Apply response shows created count, skipped/manual count, blocked count, registry state, and warnings.
- Diagnostics shortcut and refresh remain available.

## What still remains mocked or not implemented

- Shipping method creation.
- Shipping method price updates.
- Zone updates.
- Zone deletes.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Manual-zone adoption or merge workflows.

## Security notes

- `/apply` keeps the REST nonce and capability check path.
- State-changing request data is validated by `ApplyRequestSanitizer`.
- The confirmation phrase is required.
- The submitted safety policy snapshot must have all locked values set to true.
- No raw request globals were added.

## WooCommerce safety notes

- WooCommerce inactive state blocks apply.
- The only WooCommerce write APIs are in `src/Apply/SafeApplyEngine.php`.
- No `add_shipping_method` calls exist.
- No delete calls exist.
- No method add/update/delete API calls exist.
- Manual and unknown zones are skipped by preview and are not written by the engine.
- Runtime smoke verified created zones have zero methods.

## WordPress.org compliance notes

- No remote calls, hidden tracking, licensing, Pro locks, external CDN assets, or obfuscated code were added.
- Registry data stores only Yaxii-created zone metadata, not dataset rows, secrets, or raw preview payloads.
- Documentation now describes only the implemented create-only apply scope.

## QA guard findings

- `woo-guard`: passed. The only WooCommerce configuration write creates zones in `SafeApplyEngine`; no methods, prices, deletes, or manual-zone writes.
- `wp-guard`: passed. REST permission/nonce checks remain in place, request validation is explicit, registry option is local.
- `wp-rest-api`: passed. `/apply` keeps permission callback behavior and returns `WP_Error` statuses for blocked requests.
- `clean-code-guard`: passed. Apply logic is isolated in `SafeApplyEngine`; dead disabled validator was removed.
- `docs-guard`: passed. Apply docs now match create-only behavior and do not claim methods/prices are written.
- `wp-plugin-development`: passed for this task boundary.
- `wp-plugin-directory-guidelines`: passed. No prohibited remote/tracking/licensing behavior was added.

## Checks run

- `composer dump-autoload`
- `php -l` on changed PHP files
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- No source maps under `assets/admin`
- Product/runtime forbidden string scan
- Raw dataset bundling scan over `assets/admin`
- WooCommerce write scan
- `git diff --check`
- `git status --short --untracked-files=all`
- WP-CLI runtime bootstrap checks
- Logged-in wp-admin page-context preview/apply smoke

## Check results

- `composer dump-autoload`: passed.
- `php -l`: passed for all changed PHP files.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 8 existing Fast Refresh warnings in shared UI/main files and 0 errors.
- `npm run build`: passed.
- Source maps: none found under `assets/admin`.
- Product/runtime forbidden string scan: passed.
- Broad forbidden string scan: only guardrail/instruction false positives remained in `AGENTS.md`, `CLAUDE.md`, `docs/DATASET-SOURCES.md`, `docs/ARCHITECTURE.md`, `docs/PRD.md`, and `tools/validate-normalized-dataset.mjs`, where the wording is explicitly prohibited or validated.
- Raw dataset bundling scan: passed; built JS does not contain `s450r1-algeria-cities-2025`, `commune_name_arabic`, or `wilaya_name_latin`.
- WooCommerce write scan: allowed zone create path only in `src/Apply/SafeApplyEngine.php`; existing `SettingsController` settings save is unrelated.
- `git diff --check`: passed with CRLF warnings only.

## Runtime smoke result

Runtime worked:

- `wp option get siteurl`: `http://yaxii-ysz.local`
- `wp plugin status yaxii-shipping-manager`: active, version `0.1.0`
- `wp plugin status woocommerce`: active, version `10.9.1`

Controlled smoke:

- Before apply, WooCommerce zone count was `0`.
- Preview/apply for wilaya `16` created one zone, then repeat apply of the same preview was blocked as stale.
- After a final copy fix, preview/apply for wilaya `17` created one zone, then repeat apply of the same preview was blocked as stale.
- Final WooCommerce zone count is `2`.
- Created zones have correct `state:DZ:NN` locations and zero methods.
- Managed registry has records for wilayas `16` and `17`.
- Diagnostics reports wilayas `16` and `17` as configured.
- No manual zones existed in the smoke store, and none were touched.

## UI issues found

- Smoke script initially used non-contract preview field shapes; backend validation correctly rejected them.
- A stale preview recommended-action string still said the apply engine was not implemented; fixed to the create-only apply wording.
- One docs line contained the forbidden literal `telemetry` in a not-implemented list; changed to `remote tracking` so the product/runtime scan passes.

## Known risks

- Registry update failure after a WooCommerce zone create is reported as a warning, but the zone is already created. A later recovery task should reconcile WooCommerce zones and registry records.
- Runtime smoke intentionally created local WooCommerce zones `16` and `17`; future local smoke tests should account for or manually clean this local test state.
- Existing Yaxii-managed zone updates and method creation are intentionally blocked, so a store can still be only partially configured after TASK-008A.

## Blockers

None.

## Next recommended task

TASK-008B should add a registry reconciliation/readback task and then scope shipping method creation for Yaxii-managed zones only, still without touching manual zones or prices until preview coverage is proven.

## Commit hash

This report is included in the TASK-008A commit. Final commit hash is reported in the task closeout.
