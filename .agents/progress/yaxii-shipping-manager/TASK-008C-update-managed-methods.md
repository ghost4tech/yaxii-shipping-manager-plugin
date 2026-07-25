# TASK-008C: Safe Updates for Yaxii-Managed Method Labels and Prices

Date: 2026-06-28

## Goal

Implement safe updates for existing Yaxii-managed WooCommerce flat-rate method labels and prices only.

## Git Sync Result

- Started from `task/008b-ux2-final-apply-manager-controls`.
- Confirmed local commits `dc73c15`, `1209f15`, and `504c0ae` existed.
- Confirmed local `main` and `origin/main` were initially behind those commits.
- Fast-forwarded `main` to `504c0ae` and pushed `origin/main`.
- Created and worked on `task/008c-update-managed-methods`.
- Did not rewrite history or delete branches.
- Did not stage `.agents/references/yaxii-shipping-hub-03/`.
- Worktree note: unrelated old `app/` prototype deletions were present before TASK-008C changes and were left untouched.

## Files Changed

- `src/Apply/SafeApplyEngine.php`
- `src/Preview/PreviewPlanner.php`
- `admin-app/src/api/apply-api.ts`
- `admin-app/src/components/generator/PreviewPlanPanel.tsx`
- `admin-app/src/types/apply.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-Dgo52jlk.css`
- `assets/admin/assets/main-C_AWwjNt.js`
- `assets/admin/assets/main-DJljV7RF.js`
- `docs/APPLY-ENGINE.md`
- `docs/APPLY-CONTRACT.md`
- `docs/APPLY-WORKFLOW.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/PREVIEW-PLANNER.md`

## Files Created

- `.agents/progress/yaxii-shipping-manager/TASK-008C-update-managed-methods.md`

## Update Behavior

- `updateMethods` preview rows are now supported apply work when they target existing Yaxii-managed methods.
- Apply still regenerates the preview from the submitted preview request before any write.
- Stale preview hash, changed summary, conflicts, blocked readiness, invalid confirmation, disabled safety policy, or invalid selected wilayas still block apply.
- Existing zone name updates remain unsupported and are reported as later work.
- If no supported change is needed, the apply response message is `No supported changes were needed.`

## Registry Ownership Checks

Method updates now verify:

- preview item type is `method_update`
- preview item ownership is `managed_registry`
- target zone exists in `yaxii_shipping_manager_managed_zones`
- registry wilaya code matches the preview wilaya code
- WooCommerce zone still exists
- WooCommerce zone still has the expected `DZ:NN` state location
- target method key is recorded in that registry zone
- recorded WooCommerce method instance still exists in the same zone
- recorded/current method is `flat_rate`

If any check fails, the method update is skipped and reported. No manual zone or unknown method is adopted.

## Price and Label Behavior

- Updates write only WooCommerce flat-rate instance `title` and `cost`.
- Price `0` remains valid.
- Missing, invalid, or negative prices are rejected or skipped safely.
- Successful method updates refresh the registry method `title`, `lastKnownCost`, and the parent zone `updatedAt`.
- Registry storage still does not include raw preview payloads, dataset rows, secrets, or checkout data.

## Frontend UX Behavior

- Update-only previews now show `Ready to update prices`.
- The update message says Yaxii will update prices and labels only for methods it created.
- The primary button is `Update prices`.
- The existing checkbox `I reviewed this setup` is required.
- Compact summaries show method update count and grouped price/label update summaries.
- Post-apply output shows methods updated, prices updated when available, manual zones not touched, and diagnostics refresh.
- Preview-only mode still hides apply and tells the merchant to switch setup mode to apply changes.

## Runtime Smoke Result

WP-CLI/REST smoke passed on LocalWP `http://yaxii-ysz.local`.

Controlled smoke:

- Used wilaya `01`, zone ID `3`, home delivery instance ID `5`.
- Previewed home delivery price change from `700` to `701`.
- Preview returned `updateMethods: 1`.
- Apply returned `updatedMethods: 1` and `wooCommerceChanged: true`.
- WooCommerce method cost changed to `701`.
- Registry `lastKnownCost` changed to `701`.
- Repeating the same apply request returned stale preview status `409`.
- Method count stayed `2`, so no duplicate methods were created.
- Restored home delivery cost to `700`.
- Checkout-like WooCommerce zone matching for `DZ:01` resolved to the same zone and restored cost.

Browser admin smoke was not automated because no authenticated browser session or credentials were available in this turn. The WP-CLI/REST smoke exercised the REST preview/apply controllers and WooCommerce shipping APIs directly.

## What Remains Not Implemented

- WooCommerce zone name updates.
- Deletes for zones or methods.
- Manual-zone adoption.
- Manual or unknown method updates.
- Reset/wipe tooling.
- CSV backend.
- Commune-level pricing engine.
- Provider imports.
- YSF sync.

## QA Guard Findings

- Used repo-local `.agents/skills` guard instructions for WooCommerce, WordPress, REST, clean code, docs, and Plugin Directory review.
- `.agents/skills/` was not present; `.agents/skills/` existed and was used.
- WooCommerce guard: writes remain guarded by preview revalidation and registry ownership checks; no deletes or manual-zone write path were added.
- WordPress/REST guard: state-changing apply continues to require capability and REST nonce checks; user-facing PHP strings are translation-ready.
- Clean-code guard: removed the dead method-update skip helper and kept changes scoped to the apply/planner/UI contract.
- Docs guard: updated behavior docs to reflect TASK-008C and retained explicit not-implemented boundaries.
- Plugin Directory guard: no licensing, external assets, remote calls, provider dispatch, tracking, or upsell surface was added.

## Checks Run and Results

- `composer dump-autoload`: passed.
- `php -l src/Apply/SafeApplyEngine.php`: passed.
- `php -l src/Preview/PreviewPlanner.php`: passed.
- `npm run typecheck` in `admin-app`: passed.
- `npm run lint` in `admin-app`: passed with 8 pre-existing fast-refresh warnings in shared UI/main files.
- `npm run build` in `admin-app`: passed.
- Source map scan under `assets/admin`: passed, none found.
- Forbidden string scan over source/build/docs scope: passed.
- Built JS raw dataset marker scan: passed.
- WooCommerce write scan: allowed writes only in settings/registry and `SafeApplyEngine`; no delete calls, manual-zone update path, or manual-method update path found.
- `git diff --check`: passed.

## Risks

- Browser-level admin and checkout smoke was not automated in this turn.
- The current test store was restored to its original wilaya `01` home delivery price after smoke, but the smoke did perform real WooCommerce method updates during the test.
- Existing unrelated `app/` deletions remain in the worktree and must not be mixed into this commit.

## Next Recommended Task

Implement safe zone-name updates for Yaxii-managed zones, or add a focused browser-authenticated smoke harness for the wizard/apply flow before adding more write paths.

## Commit Hash

Final commit hash is reported in the task closeout and available from `git log -1`.
