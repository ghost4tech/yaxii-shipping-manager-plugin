# TASK-012G - Remove Yaxii-Managed Setup Execution Tool

Date: 2026-06-30

## Goal

Implement the confirmed destructive tool for removing only Yaxii-managed WooCommerce shipping setup, while protecting manual WooCommerce zones and methods.

## Scope

- Hardened the existing removal dry-run into an execution-safe preview.
- Added a confirmed removal REST endpoint.
- Added Settings Advanced tools confirmation UI.
- Updated reset/tooling documentation and runtime smoke checklist.
- Performed destructive smoke only on the disposable LocalWP store.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/012g-remove-managed-setup-execution`
- Base checkpoint confirmed locally: `9433270`
- Commit hash: recorded in final response after commit.
- Unrelated dirty files existed before the task and were left unstaged.

## Dry-run hardening

`GET /wp-json/yaxii-shipping-manager/v1/managed-setup/removal-preview` now returns per-zone execution metadata:

- zone ID and name
- wilaya code
- registry record status
- live method count
- registry-owned method count
- unmanaged method count
- `canRemove`
- zone blocking reasons

The dry-run also returns `dryRunHash`, `dryRunGeneratedAt`, accepted summary counts, `blockedZones`, orphan registry records, and orphan method records.

## Execute endpoint behavior

Added:

```text
POST /wp-json/yaxii-shipping-manager/v1/managed-setup/remove
```

The endpoint:

- requires admin capability and REST nonce
- blocks when WooCommerce is inactive
- rejects unknown request fields
- requires `confirmed: true`
- requires exact `confirmationText: REMOVE YAXII SETUP`
- requires `dryRunHash`, `dryRunGeneratedAt`, and accepted summary counts
- re-runs the dry-run immediately before deleting
- rejects stale or changed previews
- deletes only verified removable Yaxii-managed WooCommerce zones through `WC_Shipping_Zones::delete_zone()`
- re-reads WooCommerce after each delete before counting the zone as deleted

## Confirmation contract

The UI and endpoint require:

```text
REMOVE YAXII SETUP
```

The Settings UI warns:

- This removes only Yaxii-managed WooCommerce zones and methods.
- Manual WooCommerce zones will not be touched.
- This cannot be undone from Yaxii.
- Use this only for testing, cleanup, or starting over.

## Removal safety rules

A managed zone is removable only when:

- WooCommerce still returns it
- it is recorded in `yaxii_shipping_manager_managed_zones`
- it has the expected `state:DZ:NN` location
- all live methods in the zone are registry-owned Yaxii-managed methods
- it contains no unmanaged/manual methods

Manual zones are listed only under `manualZonesProtected` and are never removal candidates.

## Registry cleanup behavior

After confirmed removal:

- registry records for verified deleted zones are removed
- orphan registry records for already-missing WooCommerce zones are cleaned
- missing method records in remaining registry records can be pruned
- unrelated options, settings, datasets, and plugin files are not cleared

## Settings UI behavior

Settings -> Advanced tools -> Remove Yaxii-managed setup now supports:

- Preview removal
- dry-run counts and warnings
- blocked-zone display
- typed confirmation input
- destructive remove button only when removable candidates exist and no blockers exist
- result card with deleted zones, estimated deleted methods, registry records removed, orphan records cleaned, manual zones protected, and a Diagnostics link

## Manual-zone protection result

LocalWP destructive smoke showed the manual zone remained protected:

- before removal: `69` WooCommerce zones, `205` methods
- dry-run: `68` managed zones, `204` managed methods, `1` protected manual zone, `4` registry mismatches, `0` blocked zones
- after removal: `1` WooCommerce zone, `1` method, `0` registry records
- after dry-run: `0` managed zones, `1` protected manual zone

## Runtime smoke result

WP-CLI/REST smoke on the disposable LocalWP store:

- dry-run endpoint returned status `200`
- execute endpoint returned status `200`
- result: `removed=true`
- result: `wooCommerceChanged=true`
- deleted zones: `68`
- deleted methods estimated: `204`
- registry records removed: `68`
- orphan registry records cleaned: `1`
- manual zones protected: `1`
- blocked zones: `0`
- message: `Removed 68 Yaxii-managed zones. Manual WooCommerce zones were not touched.`
- diagnostics after removal returned `configuredWilayas=1` and `missingWilayas=68`

The generated setup was not recreated in this task.

## Browser smoke result or blocker

Browser smoke was blocked by the automation helper:

- `curl` confirmed the local admin URL responds and redirects to WordPress login.
- `agent-browser open` timed out with connection error `10060`.
- `agent-browser doctor --offline --quick` hung and was stopped.

The Settings UI was verified through TypeScript, lint, build, and REST runtime smoke, but not through an interactive browser click in this turn.

## Files changed

- `src/Tools/ManagedSetupRemovalPreview.php`
- `src/Tools/ManagedSetupRemovalExecutor.php`
- `src/Rest/ManagedSetupController.php`
- `src/Rest/Routes.php`
- `src/Apply/ManagedZoneRegistry.php`
- `src/Plugin.php`
- `admin-app/src/types/managed-setup.ts`
- `admin-app/src/api/managed-setup-api.ts`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- built admin JS/CSS assets
- `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`
- `docs/SETTINGS-CONTRACT.md`
- `docs/RUNTIME-SMOKE.md`

## Files created

- `src/Tools/ManagedSetupRemovalExecutor.php`
- `.agents/progress/yaxii-shipping-manager/TASK-012G-remove-managed-setup-execution.md`

## What remains not implemented

- partial removal of managed zones that contain unmanaged methods
- exportable cleanup report
- separate registry reconciliation screen
- automatic setup recreation after removal
- CSV backend
- commune-level pricing
- provider imports
- YSF sync

## QA guard findings

- `clean-code-guard`: added a separate executor instead of embedding destructive behavior in the dry-run service; request validation is explicit and narrow.
- `docs-guard`: updated docs to match implemented endpoints and removed dry-run-only wording.
- `woo-guard`: deletion is limited to `WC_Shipping_Zones::delete_zone()` after registry ownership and method ownership checks.
- `wp-guard`: destructive endpoint requires capability and REST nonce; no public access.
- `wp-rest-api`: added real permission callback and rejected unknown fields/stale previews.
- `wp-plugin-directory-guidelines`: no remote calls, tracking, licensing, Pro locks, or external assets were added.

## Checks run

- `composer dump-autoload`
- `php -l` on changed PHP files
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- source map scan under `assets/admin`
- restricted phrase scan over product source/assets
- raw dataset bundling scan over built JS
- external asset scan
- WooCommerce destructive scan
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- Composer autoload regenerated successfully.
- PHP lint passed for changed PHP files.
- Typecheck passed.
- Lint passed with existing Fast Refresh warnings in shared UI files.
- Build passed; Vite reported the existing large chunk warning.
- Source maps under `assets/admin`: `0`.
- Product source/assets restricted phrase scan: no matches.
- Broader docs scan still finds pre-existing documentation lines such as `No telemetry` and `Do not use "68 wilayas" wording`.
- Raw dataset bundling scan over built JS: no matches.
- Google Fonts scan: no matches.
- Remote script/style source scan: no enqueued remote assets.
- WooCommerce destructive scan: delete call exists only in `src/Tools/ManagedSetupRemovalExecutor.php`; existing writes remain in SafeApplyEngine, settings, and registry.
- `git diff --check` passed with line-ending warnings only.

## Known risks

- The LocalWP store now has the Yaxii-managed setup removed and was not recreated.
- Browser smoke could not be completed due to agent-browser connection issues.
- `deletedMethodsEstimated` is an estimate based on live methods inside deleted zones because WooCommerce deletes methods as part of zone deletion.
- Registry cleanup counts removed the missing zone registry record; missing methods inside that same missing zone were cleaned by removing the parent record.

## Blockers

- Browser automation was blocked by `agent-browser` connection timeout/hang.

## Next recommended task

TASK-012H should rebuild a clean setup on the disposable LocalWP store and smoke the full post-removal merchant flow: Settings removal preview after no setup, Generator fresh setup, Shipping Zones active state, and a second removal cycle through the browser UI if agent-browser is healthy.
