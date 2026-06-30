# TASK-012I - Empty Setup and Removal UI Cleanup

Date: 2026-06-30

## Goal

Simplify the empty/post-removal Shipping Zones experience and simplify the Settings removal tool UI while retaining backend safety.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/012i-empty-setup-removal-ui-cleanup`
- Base checkpoint confirmed locally: `658a433` (`TASK-012H: fix post-removal recovery flow`)
- Pre-existing unrelated dirty files were present before this task and were left unstaged.
- Commit hash: `35ddb07` before report-hash amend; final amended hash is recorded in the final response.

## Scope

- Shipping Zones empty setup state.
- Settings Advanced tools removal UI.
- Existing frontend removal client behavior only.
- Documentation and rebuilt admin assets.

No backend removal safety checks, manual-zone adoption, manual-zone delete/update, CSV backend, commune-level pricing, provider import, YSF sync, zone-name apply, telemetry, licensing, Pro locks, remote assets, external fonts, or hidden calls were added.

## Files changed

- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-BTOrB7ge.js`
- `assets/admin/assets/main-IoOtY9Wq.css`
- `assets/admin/assets/main-Cy7SkqDr.js` removed by rebuild
- `assets/admin/assets/main-qiXySz85.css` removed by rebuild
- `docs/GENERATOR-WIZARD.md`
- `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SETTINGS-CONTRACT.md`
- `docs/SHIPPING-ZONES-TABLE.md`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-012I-empty-setup-removal-ui-cleanup.md`

## What was before

- Empty stores led with the full Shipping Zones table and many row-level `Repair setup` buttons.
- The post-removal state used `No Yaxii shipping setup found`, `Create setup`, and `View manual zones`.
- Settings Advanced tools exposed a preview-heavy `Remove Yaxii-managed setup` flow with candidate lists visible by default.
- The visible removal confirmation required the longer backend phrase.

## What changed

- Shipping Zones now shows `No shipping setup yet` when diagnostics show an empty managed registry, no active managed rows, and most or all wilayas missing.
- The empty setup state uses `Generate shipping zones` and `View all wilayas`.
- The full table, toolbar, row-level `Repair setup`, and selected-row repair tools are hidden until `View all wilayas` is clicked.
- Partial setup still shows the table normally and keeps row-level `Repair setup` plus `Repair selected`.
- Manual/protected-only setup still uses the empty setup state; manual zones are protected info, not a blocker.
- Settings Advanced tools now uses `Remove Yaxii setup`.
- Settings checks the removal preview and shows `No Yaxii setup found.` with no remove button when nothing Yaxii-managed exists.
- The removal action opens `Remove Yaxii setup?` in a modal.
- The modal asks the merchant to type `REMOVE`.
- The client maps visible `REMOVE` to the backend-required `REMOVE YAXII SETUP`.
- The modal shows only summary counts by default and keeps candidate/blocker details under `View technical details`.
- After successful removal, Settings shows `Yaxii setup removed. Manual WooCommerce zones were not touched.` and offers `Generate shipping zones`.

## Empty setup behavior

The Shipping Zones empty state is driven by diagnostics, not only row labels:

- `summary.managedRegistryZoneCount === 0`
- no rows with active, needs-update, or updating managed state
- most/all wilayas missing, or configured rows are only manual/protected rows

Manual WooCommerce zones do not prevent the empty setup state. If there are no manual zones, the manual warning is not shown.

## Partial repair behavior

When any managed setup exists, the table remains the primary workspace. Missing rows keep `Repair setup`; selected missing rows keep `Repair selected`. The TASK-012H repair payload behavior remains unchanged and continues to send `methodStatuses` as an object.

## Removal UI simplification

The frontend now separates merchant copy from backend safety:

- merchant visible confirmation: `REMOVE`
- backend confirmation sent to `POST /managed-setup/remove`: `REMOVE YAXII SETUP`
- preview hash, generated timestamp, accepted summary, stale preview checks, and blocker checks remain unchanged

The UI hides long candidate lists by default. Blocked removal shows `Yaxii setup cannot be safely removed yet.` and no `Confirm removal` button.

## Backend safety retained

No PHP backend code changed. Removal execution remains in `ManagedSetupRemovalExecutor`, and setup/repair writes remain in `SafeApplyEngine`.

## Manual-zone protection behavior

No UI action was added to edit, adopt, override, or delete manual WooCommerce zones or methods. Runtime smoke had zero manual zones in the current store, so manual-zone protection was not re-proven with a live manual zone in this task. The removal executor and Safe Apply boundaries were not changed.

## Runtime smoke result

WP-CLI/direct-service smoke passed.

Initial LocalWP state:

- `managedRegistryZoneCount=0`
- `configuredWilayas=0`
- `missingWilayas=69`
- `totalWilayas=69`
- `manualZoneCount=0`
- removal preview: `removalAvailable=false`, `managedZoneCount=0`, `manualProtectedZoneCount=0`

Controlled smoke:

- created one controlled managed wilaya `01`
- create preview: `createZones=1`, `conflicts=0`
- create apply: `applied=true`, `wooCommerceChanged=true`, `createdZones=1`, `createdMethods=2`
- partial state after create: `managedRegistryZoneCount=1`, `configuredWilayas=1`, `missingWilayas=68`, `manualZoneCount=0`
- repair preview for missing wilaya `02`: `createZones=1`, `conflicts=0`
- removal preview after create: `removalAvailable=true`, `managedZoneCount=1`, `blockedZones=0`
- removal execution: `removed=true`, `wooCommerceChanged=true`, `deletedZones=1`, `deletedMethodsEstimated=2`, `registryRecordsRemoved=1`

Final LocalWP state:

- `managedRegistryZoneCount=0`
- `configuredWilayas=0`
- `missingWilayas=69`
- `manualZoneCount=0`
- removal preview: `removalAvailable=false`

## Browser smoke result or blocker

Browser smoke was blocked by `agent-browser`.

- `agent-browser doctor --offline --quick` hung with no output and was stopped.
- `agent-browser open http://yaxii-ysz.local/wp-admin/admin.php?page=yaxii-shipping-manager&v=012i-smoke` hung and then failed with OS error `10060`.

The UI was verified through TypeScript, lint, build, source scans, and WP-CLI/direct-service runtime smoke, but not through an interactive browser click.

## Security notes

- No new REST route was added.
- No state-changing backend contract was weakened.
- Existing REST nonce/capability checks remain in the backend controllers.
- The visible `REMOVE` confirmation is only a UI simplification; the backend-required confirmation remains unchanged.

## WooCommerce safety notes

- No new WooCommerce write/delete path was added.
- Safe Apply remains the only setup/repair writer.
- Managed setup removal remains the only removal executor.
- Manual zones and methods are still not edited or deleted by the changed UI.

## WordPress.org compliance notes

- No telemetry, analytics, hidden tracking, licensing, Pro locks, remote calls, external fonts, remote scripts, remote CSS, provider dispatch, or obfuscation was added.
- No external asset dependency was introduced.
- Documentation describes implemented behavior and keeps unsupported features out of scope.

## QA guard findings

- `clean-code-guard`: scoped changes to existing components and avoided new abstractions or unsupported flows.
- `docs-guard`: updated docs to match current UI strings and backend confirmation boundary.
- `woo-guard`: no new WooCommerce writes; runtime smoke used existing Safe Apply and removal executor only.
- `wp-guard`: no new PHP, superglobal handling, or output path.
- `wp-rest-api`: no route contract changed; frontend still uses existing endpoints.
- `wp-plugin-directory-guidelines`: no remote dependency, tracking, obfuscation, licensing, or upsell surface added.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- source map scan under `assets/admin`
- restricted phrase scan over `admin-app/src`, `src`, and `assets/admin`
- raw dataset bundling scan over built JS
- targeted external asset scan
- broad URL scan over source/assets
- WooCommerce write/delete diff scan
- WP-CLI/direct-service runtime smoke
- browser smoke attempt with `agent-browser`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- TypeScript typecheck passed.
- ESLint passed with 8 existing Fast Refresh warnings in shared UI files.
- Admin build passed with the existing Vite tsconfig-paths notice and large chunk warning.
- Source map scan passed; no `.map` files under `assets/admin`.
- Restricted phrase scan over product source/assets returned no matches.
- Raw dataset bundling scan over built JS returned no matches.
- Targeted external asset scan returned no remote CSS/script/font matches.
- Broad URL scan found bundled library diagnostic/license URLs only.
- WooCommerce write/delete diff scan found no new delete path, manual-zone update path, or manual-method update path.
- WP-CLI/direct-service runtime smoke passed and returned the store to empty setup.
- Browser automation was blocked by `agent-browser` hang / OS error `10060`.
- `git diff --check` passed with line-ending warnings only.

Composer autoload and PHP lint were not run because no PHP files or autoload configuration changed. PHPCS and PHPStan were not run because no `phpcs.xml`, `phpcs.xml.dist`, or `phpstan.neon` is configured in this plugin root.

## What remains mocked/not implemented

- manual-zone adoption
- manual-zone edit/update/delete
- manual-method edit/update/delete
- CSV backend
- commune-level pricing
- provider imports
- YSF sync
- zone-name apply/update
- exportable cleanup reports
- separate registry reconciliation screen

## Known risks

- Browser UI behavior still needs manual or working automation verification.
- Current LocalWP store is empty after smoke: no managed setup and no manual zones.
- Manual-zone protection was not re-tested with a live manual zone in this task because the current store has none.
- The admin JS bundle remains above Vite's size warning threshold.
- Existing unrelated dirty files remain in the worktree.

## Blockers

- Browser automation is still blocked by `agent-browser`.

## Next recommended task

Run a manual browser smoke for TASK-012I once browser automation is healthy, then scope a small manual-zone protection smoke that creates and removes a disposable manual WooCommerce zone.
