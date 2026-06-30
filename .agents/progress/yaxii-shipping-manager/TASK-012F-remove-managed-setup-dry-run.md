# TASK-012F: Remove Yaxii-Managed Setup Dry-run

## Date

2026-06-30

## Goal

Add a safe, read-only dry-run contract and Settings UI for the future `Remove Yaxii-managed setup` tool. The dry-run must show what Yaxii owns, what would be candidates later, and which manual WooCommerce zones stay protected.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git root: plugin root.
- Branch: `task/012f-remove-managed-setup-dry-run`
- TASK-012E commit `2fbeb86` was present locally before implementation.
- Pre-existing unrelated dirty files were present before this task and were not staged.
- Commit hash: pending at report creation; final response reports the committed hash.

## Scope

- Read-only backend dry-run service.
- Read-only REST endpoint.
- Settings `Advanced tools` UI.
- Reset/tooling documentation.
- Runtime smoke documentation.
- Rebuilt admin bundle.

No destructive removal behavior was implemented.

## Dry-run endpoint behavior

Added:

```text
GET /wp-json/yaxii-shipping-manager/v1/managed-setup/removal-preview
```

The endpoint:

- reads `yaxii_shipping_manager_managed_zones`
- reads WooCommerce shipping zones through the existing read-only zone reader
- lists registry-owned zones and matching method instances as future candidates
- lists non-registry WooCommerce zones only as protected manual zones
- reports missing registry zones or methods as warnings and mismatches
- returns `removalAvailable: false`
- returns `dryRunOnly: true`
- performs no writes

If WooCommerce is inactive, the endpoint returns a clear inactive dry-run payload with empty candidate lists and no fatal references.

## Dry-run response shape

The response includes:

- `woocommerceActive`
- `removalAvailable`
- `dryRunOnly`
- `managedZoneCount`
- `managedMethodCount`
- `missingManagedZoneCount`
- `missingManagedMethodCount`
- `manualProtectedZoneCount`
- `registryMismatchCount`
- `zonesToRemoveLater`
- `methodsToRemoveLater`
- `manualZonesProtected`
- `registryWarnings`
- `blockingReasons`
- `requiredConfirmationText`
- `message`
- `generatedAt`

The required confirmation text is:

```text
REMOVE YAXII SETUP
```

This is exposed for the future destructive task only. TASK-012F does not accept confirmation input and cannot remove anything.

## Settings Advanced Tools UI

Settings now includes an `Advanced tools` card with:

- title: `Remove Yaxii-managed setup`
- copy: `Preview what Yaxii would remove later. Manual WooCommerce zones are always protected.`
- button: `Preview removal`

After preview, the UI shows:

- `This is a dry run. Nothing was deleted.`
- Yaxii-managed zones found
- Yaxii-managed methods found
- Manual zones protected
- Registry warnings when present
- Candidate zone/method lists for future review

No working remove/delete/reset button is shown.

## Manual-zone protection behavior

Manual or unknown WooCommerce zones are never added to `zonesToRemoveLater`.

The local runtime smoke found one manual/protected zone. It appeared only in `manualZonesProtected`; `manualCandidateOverlap` was an empty array.

## Runtime smoke result

Backend REST smoke was run in-process as an administrator with `wp eval-file`.

Result:

```json
{
  "status": 200,
  "removalAvailable": false,
  "dryRunOnly": true,
  "managedZoneCount": 68,
  "managedMethodCount": 204,
  "manualProtectedZoneCount": 1,
  "registryMismatchCount": 4,
  "beforeZones": 69,
  "afterZones": 69,
  "beforeMethods": 205,
  "afterMethods": 205,
  "manualCandidateOverlap": [],
  "message": "This is a dry run. Nothing was deleted."
}
```

Browser smoke used temporary administrator user `ysm_smoke_012f`, which was deleted after the smoke.

Observed:

- Settings showed `Advanced tools`.
- Settings showed `Remove Yaxii-managed setup`.
- `Preview removal` rendered the dry-run result after keyboard activation.
- The result showed `This is a dry run. Nothing was deleted.`
- The result showed `Yaxii-managed zones found`, `Yaxii-managed methods found`, and `Manual zones protected`.
- Button extraction found no active `Remove setup` or `Remove Yaxii` button.
- Final post-browser count readback remained `69` zones and `205` methods.

Pointer click on the button did not activate reliably in agent-browser; keyboard focus plus Enter worked, matching prior browser-smoke behavior in this admin UI.

## Files changed

- `admin-app/src/api/managed-setup-api.ts`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/types/managed-setup.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-B0ufSAlB.js`
- `assets/admin/assets/main-C9Q6OHlL.css`
- `assets/admin/assets/main-DcterzTy.css`
- `assets/admin/assets/main-DnRashLd.js`
- `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SETTINGS-CONTRACT.md`
- `src/Plugin.php`
- `src/Rest/Routes.php`

## Files created

- `admin-app/src/api/managed-setup-api.ts`
- `admin-app/src/types/managed-setup.ts`
- `src/Rest/ManagedSetupController.php`
- `src/Tools/ManagedSetupRemovalPreview.php`
- `.agents/progress/yaxii-shipping-manager/TASK-012F-remove-managed-setup-dry-run.md`

## What was before

- The reset/removal tool existed only as a plan.
- Settings had no Advanced tools section.
- There was no endpoint to inspect managed setup removal candidates.
- Repeated local testing still required manual inspection before any future cleanup work could be scoped.

## What changed

- A read-only dry-run service now classifies managed registry records against live WooCommerce zone snapshots.
- A protected read-only REST route exposes the dry-run.
- Settings can preview the result.
- Docs now distinguish the implemented dry-run endpoint from the future destructive removal endpoint.
- Runtime smoke proves the endpoint and UI do not change WooCommerce zone or method counts.

## What remains mocked/not implemented

- Actual removal/deletion of Yaxii-managed zones.
- Actual removal/deletion of Yaxii-managed methods.
- Registry clearing or reconciliation.
- Conflict resolution.
- Dry-run hash/stale-preview protection for a future destructive endpoint.
- Diagnostics shortcut link to this tool.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Manual-zone adoption.
- Zone-name updates.

## Security notes

- The endpoint uses a real permission callback.
- WooCommerce active requires `manage_woocommerce`; WooCommerce inactive requires `manage_options`.
- The endpoint is `GET` and does not read request bodies or direct superglobals.
- No nonce-only or public access route was added.
- No file writes or external calls were added.

## WooCommerce safety notes

- The dry-run uses the existing read-only WooCommerce zone reader.
- It does not instantiate a write engine.
- It does not call WooCommerce delete APIs.
- It does not update method options.
- It does not clear or update the managed registry.
- Manual zones are listed only as protected.

## WordPress.org compliance notes

- No telemetry, licensing, Pro locks, remote calls, external fonts, external scripts, or hidden tracking were added.
- The UI labels the tool as a dry run and does not expose a disabled paid feature or upsell.
- Documentation describes actual TASK-012F behavior and keeps destructive removal as future work.

## QA guard findings

- `clean-code-guard`: the dry-run service is query-only and separate from the REST controller; no hidden success fixture or execution path was added.
- `docs-guard`: endpoint names, Settings UI text, and response fields were verified against the code changed in this task.
- `woo-guard`: no WooCommerce writes, deletes, direct database writes, or registry clearing were introduced.
- `wp-guard`: route has a permission callback, project namespace/prefix conventions are preserved, and user-facing PHP strings are translation-ready.
- `wp-rest-api`: route uses `WP_REST_Server::READABLE`, returns a response through the existing JSON response helper, and avoids request superglobals.
- `wp-plugin-directory-guidelines`: no remote dependency, obfuscation, licensing, tracking, or upsell surface was added.

## Checks run

- `composer dump-autoload`
- `php -l src/Tools/ManagedSetupRemovalPreview.php`
- `php -l src/Rest/ManagedSetupController.php`
- `php -l src/Plugin.php`
- `php -l src/Rest/Routes.php`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- source map scan under `assets/admin`
- restricted phrase scan over `admin-app/src`, `src`, and `assets/admin`
- raw dataset bundling scan over built JS
- targeted external asset scans for Google Fonts, remote CSS, remote scripts, and remote `@import`
- WooCommerce write/delete diff scan
- in-process REST runtime smoke
- browser Settings smoke with agent-browser
- post-browser WooCommerce zone/method count readback
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- Composer autoload: passed.
- PHP lint: passed for all changed PHP files.
- TypeScript typecheck: passed.
- ESLint: passed with 8 existing Fast Refresh warnings.
- Admin build: passed with existing Vite tsconfig-paths notice and chunk-size warning.
- Source map scan: passed, no `.map` files found.
- Restricted phrase scan: passed.
- Raw dataset bundling scan: passed.
- Targeted external asset scans: passed.
- WooCommerce write/delete scan: no new delete/write path found; the diff only adds registry reads, protected REST routing, UI copy, and Settings preview client code.
- Runtime smoke: passed; zone/method counts stayed unchanged.
- Browser smoke: passed with keyboard activation.

## Known risks

- Local registry has 4 mismatches; the dry-run reports them but does not reconcile them.
- The future destructive tool must re-read WooCommerce immediately before deleting and must block on mismatches unless a reconcile flow exists.
- The built JS chunk remains above Vite's warning threshold.
- The Settings button required keyboard activation in agent-browser; this matches prior local smoke behavior but should be checked manually in a normal browser.

## Blockers

- No implementation blocker.
- Destructive removal remains intentionally blocked by scope.

## Next recommended task

Implement a read-only registry reconcile/repair design for the 4 local mismatches, or define the future destructive removal contract with dry-run hash, typed confirmation, and pre-delete revalidation before adding any removal execution.
