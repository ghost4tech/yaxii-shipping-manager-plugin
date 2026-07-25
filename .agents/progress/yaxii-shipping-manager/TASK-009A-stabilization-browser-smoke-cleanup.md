# TASK-009A - Stabilization, Browser Smoke, and Worktree Cleanup

Date: 2026-06-28

## Goal

Stabilize the current Yaxii Shipping Manager MVP flow before adding more WooCommerce write features, verify the merchant flow in wp-admin and WP-CLI, and resolve worktree noise safely.

## Git Sync Result

- Started from the TASK-008C line.
- `origin/main` already contained TASK-008C commit `8fbdb55` through merge commit `3de1d1e`.
- Local `main` was fast-forwarded to `origin/main`.
- Created `task/009a-stabilization-browser-smoke-cleanup` from `origin/main`.
- No history rewrite and no branch deletion.

## Worktree Cleanup Result

- The deleted `app/` path is a tracked 105-file TanStack/Lovable prototype tree.
- The active admin app is `admin-app/`; the tracked `app/` tree was already absent from the working tree.
- The obsolete `app/` deletion is intentionally included as cleanup because it is not the mounted WordPress admin app and includes old prototype code.
- `.agents/references/yaxii-shipping-hub-03/` remains untracked and is now ignored through `.gitignore`.

## Reference App Handling

- Confirmed `.agents/references/yaxii-shipping-hub-03/` contains reference-only app files and a nested `.git`.
- Did not stage or commit the reference app.
- Added `.agents/references/` to `.gitignore` so nested reference apps do not appear in future commits.

## Browser Smoke Result

Authenticated browser smoke was performed with `agent-browser` against LocalWP.

Passed:

- Plugin admin page loads in wp-admin.
- Shipping Zones screen is visible and labels price/free/enable controls as local draft controls.
- Generator opens.
- Fresh setup defaults to all current wilayas.
- Setup modes show distinct copy for Fresh setup, Continue existing, and Preview changes.
- Commune skip path works.
- Commune show path lazy-loads Adrar communes as read-only.
- Methods, prices, names, and safety steps are reachable.
- Final preview auto-runs.
- Details are collapsed by default.
- Preview-only mode hides apply controls and shows `Done` plus one `Check diagnostics` action.
- Post-fix `Check diagnostics` closes the wizard and opens `#/diagnostics`.

Browser issue found and fixed:

- `Check diagnostics` did not reliably navigate away from the wizard in the post-build smoke. The active callback now changes to the Diagnostics tab while closing the wizard.

## WP-CLI/REST Smoke Scenarios And Results

Scenario 1 - Existing setup no-op:

- Used wilaya `01` with live WooCommerce labels/prices as the draft.
- Preview returned `createZones: 0`, `addMethods: 0`, `updateMethods: 0`, `unchanged: 1`.
- Recommended action now says no supported shipping changes were found.

Scenario 2 - Method price update:

- Targeted registry-owned `home_delivery` in zone `3`, instance `5`.
- Updated Home delivery from `700` to `811`.
- Apply response: `updatedMethods: 1`, `createdZones: 0`, `createdMethods: 0`, `skippedMethodUpdates: 0`.
- Registry `lastKnownCost` changed to `811`.
- Restored Home delivery to `700`.
- Registry `lastKnownCost` returned to `700`.

Scenario 3 - No duplicates:

- Flat-rate method count stayed `2` before update, after update, after repeat preview, and after restore.
- Repeat preview after the update returned `updateMethods: 0`.

Scenario 4 - Manual-zone protection:

- A temporary manual zone was not created because cleanup would require deleting a WooCommerce zone, and this task has a no-delete boundary.
- Manual-zone protection remains covered by preview/apply ownership checks and should be tested in a disposable store with explicit cleanup approval.

Shipping rate check:

- WooCommerce package destination `DZ:01` matched zone `3`.
- Rates returned Home delivery `700` and Office delivery `400` after restore.

## UI Issues Found/Fixed

- Updated top notice copy to say apply can create missing managed zones, add missing methods, and update Yaxii-managed method prices after confirmation.
- Updated generator hub copy to mention supported apply work, not only zone creation.
- Updated Shipping Zones copy to stop saying method and price writes are not implemented; this screen is a local draft editor and supported WooCommerce writes happen through generator preview/apply.
- Updated preview recommended action copy for no-op and method-update previews.
- Fixed diagnostics action navigation from the final wizard screen.

## Files Changed/Created

Changed:

- `.gitignore`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-*.js`
- `docs/GENERATOR-WIZARD.md`
- `src/Preview/PreviewPlanner.php`

Deleted:

- `app/` obsolete tracked prototype tree

Created:

- `docs/RUNTIME-SMOKE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-009A-stabilization-browser-smoke-cleanup.md`

## What Remains Not Implemented

- Zone-name updates.
- Reset or wipe tooling.
- CSV backend.
- Commune-specific pricing.
- Provider imports.
- YSF sync.
- Manual-zone adoption.
- Manual or unknown method updates.

## QA Guard Findings

- `clean-code-guard`: changes are narrow; no new abstractions or write paths were added.
- `docs-guard`: docs now describe current TASK-008C behavior and the TASK-009A smoke checklist; stale pre-apply copy was removed.
- `wp-guard`: no new REST endpoints, capabilities, or direct request access were added.
- `wp-rest-api`: no REST schema or permission behavior changed.
- `woo-guard`: no new WooCommerce write paths were added; smoke used the existing SafeApplyEngine path and restored the controlled price.
- `wp-plugin-directory-guidelines`: reference app remains ignored and uncommitted; no external assets or hidden calls were added.
- `.agents/skills/` is absent; repo-local `.agents/skills/` guard files were used.

## Checks Run/Results

- `composer dump-autoload`: passed after rerun from plugin root. First attempt from `admin-app` failed due wrong directory.
- `php -l src/Preview/PreviewPlanner.php`: passed.
- `npm --prefix admin-app run typecheck`: passed.
- `npm --prefix admin-app run lint`: passed with existing fast-refresh warnings in shared UI files.
- `npm --prefix admin-app run build`: passed.
- No source maps under `assets/admin`: passed.
- Scoped forbidden product-string scan over source, active docs changed in this task, report, and built assets: passed.
- Raw dataset bundling scan over built JS: passed.
- WooCommerce write scan: only existing settings persistence and SafeApplyEngine writes were found; no delete calls, manual-zone update path, or manual-method update path were added.
- `git diff --check`: passed with line-ending warnings only.
- Broad repository forbidden-string scan: found only policy/validator references that intentionally prohibit legacy wording; active product/source scoped scan passed.
- Browser admin smoke: passed with fixes noted above.
- WP-CLI safe update/restore smoke: passed.
- WooCommerce shipping-rate check: passed.

## Risks

- The deleted `app/` prototype cleanup is large in line count because it removes a tracked prototype tree.
- Manual-zone overlap was not tested by creating a temporary zone because this task forbids deletes.
- Lint still reports pre-existing fast-refresh warnings in shared UI files.

## Blockers

None for TASK-009A.

## Next Recommended Task

TASK-009B should run a dedicated disposable-store manual-zone protection smoke, or TASK-010 can scope the next safe write feature after manual-zone smoke is approved.

## Commit Hash

To be recorded in the final response after commit.
