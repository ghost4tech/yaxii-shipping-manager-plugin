# TASK-008B - Add Methods to Yaxii-Managed Zones

Date: 2026-06-28

## Goal

Add enabled WooCommerce `flat_rate` shipping method instances with wizard prices to Yaxii-managed zones only.

## Scope

Implemented the next narrow safe apply step after TASK-008A:

- Keep preview revalidation before writing.
- Add missing enabled methods only to zones recorded in `yaxii_shipping_manager_managed_zones`.
- Save method labels and costs only for method instances created by this apply run.
- Record created method instance IDs in the managed registry.
- Update the admin apply-result UI so zone creation and method creation are reported separately.
- Update docs to describe the TASK-008B write boundary.

This branch was created from local TASK-008A commit `2bb2865`. Local `main` was still at TASK-007C (`28a9242`) during preflight, so `main` did not contain TASK-008A locally.

## Files changed/created

Changed:

- `src/Apply/SafeApplyEngine.php`
- `src/Apply/ManagedZoneRegistry.php`
- `src/Apply/ApplyContract.php`
- `src/Apply/ApplyReadinessEvaluator.php`
- `src/Preview/PreviewPlanner.php`
- `admin-app/src/api/apply-api.ts`
- `admin-app/src/components/generator/PreviewPlanPanel.tsx`
- `admin-app/src/types/apply.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-CmRdVyrB.js`
- `docs/APPLY-ENGINE.md`
- `docs/APPLY-CONTRACT.md`
- `docs/APPLY-WORKFLOW.md`
- `docs/PREVIEW-PLANNER.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/DIAGNOSTICS.md`
- `docs/SETTINGS-CONTRACT.md`

Deleted build artifact:

- `assets/admin/assets/main-DYYyrMeQ.js`

Created:

- `.agents/progress/yaxii-shipping-manager/TASK-008B-add-methods-to-managed-zones.md`

Not staged:

- `.agents/references/yaxii-shipping-hub-03/` remains untracked.

## Registry readback behavior

Before creating a method, the apply engine verifies:

- the preview item is a `method_addition`;
- the method key is one of `home_delivery`, `office_delivery`, `custom_1`, or `custom_2`;
- the preview item says the target came from the managed registry;
- the target zone ID exists in `yaxii_shipping_manager_managed_zones`;
- the registry wilaya code matches the preview wilaya code;
- WooCommerce still returns the target zone;
- the WooCommerce zone still has the expected `state:DZ:NN` location;
- the registry does not already record that method key for the zone.

If the registry and WooCommerce disagree, the method is skipped with a warning instead of adopting or modifying the zone.

## Method creation behavior

Allowed write:

- `WC_Shipping_Zone::add_shipping_method( 'flat_rate' )` only inside `SafeApplyEngine`.

The engine then reloads the newly created method instance, saves its title and cost option, and records the method instance in the registry.

Existing method instances are not updated in this task. Preview `updateMethods` items are returned as skipped methods with an honest "not implemented yet" reason.

## Price behavior

Prices are taken from preview method-addition items:

- per-wilaya price is used when provided by the preview planner;
- method default price is used by the planner when a per-wilaya price is missing;
- `0` is valid;
- missing, non-numeric, or negative prices are rejected before method creation.

WooCommerce costs are formatted with `wc_format_decimal()`.

## Frontend apply result changes

The generator preview panel now:

- enables Apply when preview has missing zones or missing methods and readiness allows it;
- keeps the explicit confirmation phrase;
- shows separate counts for "Zones created" and "Methods added";
- shows skipped methods and blocked zones;
- states that prices were applied only to new method instances;
- states that manual zones were not touched;
- keeps diagnostics refresh available.

## What was not implemented

- No zone deletes.
- No zone renames or updates.
- No manual/unknown zone adoption.
- No method updates for existing method instances.
- No shipping method deletion.
- No commune-level pricing.
- No CSV backend.
- No checkout field changes.
- No provider imports or YSF sync.
- No telemetry, licensing, Pro locks, external assets, or remote calls.

## WooCommerce safety review

Guard findings:

- WooCommerce writes are limited to `SafeApplyEngine`.
- Zone creation from TASK-008A remains limited to preview `createZones`.
- Method creation is limited to registry-managed zones with verified `DZ:NN` locations.
- Manual zones are skipped by the preview planner and are not write targets.
- No WooCommerce delete calls were found.
- No method update path was added.
- Registry writes use the existing non-autoloaded option and store only zone/method identifiers, labels, costs, timestamps, and schema metadata.

## Runtime smoke result

Runtime was available in LocalWP.

Logged-in wp-admin/browser smoke:

- Generated a preview for wilayas `16` and `17`.
- Preview had `createZones: 0`, `addMethods: 4`, no conflicts, and allowed apply.
- Applied with Home delivery and Office / Stopdesk enabled.
- Apply response created 4 methods and 0 zones.
- Apply response included one blocked zone-update item because zone renames remain out of scope.
- Manual zones skipped count was 0 for this controlled smoke.
- Reusing the old preview hash was blocked as stale.

WP-CLI readback:

- Zone 1: `state:DZ:16`, methods `Home delivery:700` and `Office / Stopdesk:400`.
- Zone 2: `state:DZ:17`, methods `Home delivery:800` and `Office / Stopdesk:500`.
- Registry records for wilayas `16` and `17` now contain method instance IDs `1`, `2`, `3`, and `4`.
- Diagnostics sees 2 enabled methods on each smoke-test zone.
- Fresh repeat apply did not add duplicates. It blocked unsupported update-only work and method counts stayed `{"1":2,"2":2}`.

## QA guard findings

- `woo-guard`: pass. Method creation is constrained to managed registry targets; no manual-zone writes or deletes.
- `wp-guard`: pass. State-changing route continues through REST permission/nonce flow; inputs continue through request sanitizers.
- `wp-rest-api`: pass. No new route was added; apply response shape was extended and the frontend parser was updated.
- `clean-code-guard`: pass after removing an unused registry helper and keeping the implementation inside existing apply/registry classes.
- `docs-guard`: pass. Docs describe actual TASK-008B behavior and explicitly leave unsupported writes unimplemented.
- `wp-plugin-development`: pass. Uses existing plugin architecture and option storage.
- `wp-plugin-directory-guidelines`: pass. No remote calls, tracking, licensing, or Pro-lock behavior added.

## Checks run/results

- `composer dump-autoload` - pass.
- `php -l` on changed PHP files - pass.
- `npm run typecheck` in `admin-app` - pass.
- `npm run lint` in `admin-app` - pass with 8 pre-existing fast-refresh warnings in shared UI files.
- `npm run build` in `admin-app` - pass.
- Source map scan under `assets/admin` - pass, no `.map` files.
- Production forbidden-copy scan over `src`, `admin-app/src`, and `assets/admin` - pass, no hits.
- Raw dataset bundling scan over built admin assets - pass, no hits.
- WooCommerce write scan - pass. `add_shipping_method()` and zone `save()` appear only in `SafeApplyEngine`; no delete calls found.
- `git diff --check` - pass.
- `git status --short --untracked-files=all` - run before report; final status recorded after commit.

## Known risks

- The current local smoke store already had all 69 Yaxii-managed zones from earlier testing, so TASK-008B was smoked as "methods added to existing managed zones" rather than mixed create-plus-method creation.
- Existing method updates are intentionally skipped; a later task must implement safe updates if merchants change labels or prices after methods already exist.
- If method settings save succeeds but registry update fails, WooCommerce may have a method instance that the registry does not record; the response warns about this case, and a later reconciliation task should handle it.
- Local `main` did not include TASK-008A during this task; this feature branch is correctly based on the TASK-008A commit.

## Blockers

None for TASK-008B implementation.

## Next recommended task

TASK-008C: add a safe managed-method update/reconciliation path for existing Yaxii-managed method instances, including stale registry repair rules and another small runtime smoke.

## Commit hash

Recorded in the final task response. The final commit hash cannot be embedded in the same committed report without changing that hash.
