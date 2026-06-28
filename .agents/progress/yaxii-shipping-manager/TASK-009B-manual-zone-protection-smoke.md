# TASK-009B - Disposable Manual-Zone Protection Smoke

Date: 2026-06-28

## Goal

Prove that Yaxii Shipping Manager does not adopt, update, or otherwise change a manual WooCommerce shipping zone that overlaps a Yaxii-managed wilaya, then remove the temporary manual zone from the disposable LocalWP store.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Started from `task/009a-stabilization-browser-smoke-cleanup` with a clean worktree.
- Confirmed `main`, `origin/main`, and the task branch contain TASK-009A commit `d18ffd7`.
- Fast-forwarded local `main` to `d18ffd7` and pushed `origin/main` before creating this task branch.
- Task branch: `task/009b-manual-zone-protection-smoke`
- `.agents/references/yaxii-shipping-hub-03/` remains ignored and was not staged.

## Test Wilaya Selected

- Wilaya: `02`
- Existing managed zone ID before test: `4`
- Existing managed zone name: `Yaxii - 02 Chlef - الشلف`
- Existing managed methods before test:
  - `home_delivery`, instance `7`, title `Home delivery`, cost `700`
  - `office_delivery`, instance `8`, title `Office delivery`, cost `400`

## Temporary Manual Zone Created

- Zone ID: `70`
- Zone name: `Manual Smoke Test - DZ:02`
- Location: `state:DZ:02`
- Manual method instance ID: `140`
- Manual method title: `Manual Smoke Method`
- Manual method cost: `999`
- Registry status: not recorded in `yaxii_shipping_manager_managed_zones`

## Diagnostics Result

- WooCommerce diagnostics detected a duplicate direct-zone conflict for wilaya `02`.
- Diagnostics summary while the temporary zone existed:
  - `configuredWilayas`: `68`
  - `missingWilayas`: `0`
  - `duplicateConflictCount`: `1`
  - `checkoutFallbackRisk`: `medium`
- Wilaya `02` status was `conflict` with zone IDs `4` and `70`.
- The temporary zone was classified as manual or unknown, not Yaxii-owned.

## Preview Result

- Preview was run for selected wilaya `02` with current managed labels and prices.
- Preview summary:
  - `createZones`: `0`
  - `addMethods`: `0`
  - `updateMethods`: `0`
  - `conflicts`: `1`
  - `warnings`: `2`
- Apply readiness was blocked with state `conflicts_detected`.
- Conflict type: `duplicate_zone`
- Conflict reason: multiple direct WooCommerce zones match the same wilaya.
- Ownership sources: `managed_registry` and `manual_unknown`

## Apply Result Or Blocked Result

- Apply was attempted only through the normal preview confirmation contract.
- Result: blocked with `yaxii_shipping_manager_apply_blocked`, HTTP status `409`.
- Message: `Apply readiness is blocked. Resolve the blocking reason before applying.`
- No create, add, update, adoption, or delete work was performed by the apply engine.

## Registry Verification

- The temporary manual zone ID `70` was not present in the managed registry before apply.
- The temporary manual zone ID `70` was not present in the managed registry after the blocked apply attempt.
- The existing Yaxii-managed zone ID `4` remained present in the managed registry.
- Managed method registry records for zone `4` stayed aligned with the existing WooCommerce methods.

## Manual Zone Protection Verification

- Manual zone name stayed `Manual Smoke Test - DZ:02`.
- Manual method title stayed `Manual Smoke Method`.
- Manual method cost stayed `999`.
- Manual method stayed enabled.
- Yaxii did not update the manual zone or manual method.
- Yaxii did not adopt the manual zone into the registry.
- No duplicate Yaxii-managed methods were created.

## Cleanup Result

- Cleanup deleted only the temporary zone after verifying the exact expected zone ID and zone name.
- Temporary zone ID `70` no longer exists after cleanup.
- Post-cleanup diagnostics:
  - `configuredWilayas`: `69`
  - `missingWilayas`: `0`
  - `duplicateConflictCount`: `0`
  - `checkoutFallbackRisk`: `low`
  - wilaya `02` status: `configured`
  - wilaya `02` zone IDs: `4`
- The Yaxii-managed zone and methods for wilaya `02` remained intact.

## Browser Smoke Result Or Blocker

- Browser automation was available through `agent-browser`.
- A local administrator cookie was generated through WP-CLI for the disposable LocalWP site.
- The Yaxii Shipping Manager admin page loaded at `wp-admin/admin.php?page=yaxii-shipping-manager#/diagnostics`.
- Diagnostics rendered in wp-admin after cleanup and showed wilaya `02` configured with only the Yaxii-managed zone.
- The Generator tab opened and showed the guided setup entry screen.
- Conflict UI during the temporary-zone window was verified through WP-CLI/REST payloads rather than a second browser pass, so the temporary conflict was not left active longer than necessary.

## Files Changed

- `docs/RUNTIME-SMOKE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-009B-manual-zone-protection-smoke.md`

## Files Created

- `.agents/progress/yaxii-shipping-manager/TASK-009B-manual-zone-protection-smoke.md`

## What Was Before

- TASK-009A had verified the main admin and apply flow, but manual-zone protection had not been tested with a disposable overlapping manual WooCommerce zone.

## What Changed

- No product code changed.
- The runtime smoke documentation now records the manual-zone protection result.
- This report records the disposable manual-zone create, blocked apply, registry verification, and cleanup evidence.

## What Still Remains Mocked

- CSV import/export backend remains unimplemented.
- Commune-specific pricing remains unimplemented.
- Provider imports remain unimplemented.
- YSF sync remains informational only.

## What Remains Not Implemented

- Zone-name updates are still not applied.
- Reset or wipe tooling is not implemented.
- Manual zone adoption is intentionally not implemented.
- Manual method updates are intentionally not implemented.

## Security Notes

- The only temporary write outside plugin code was a controlled WooCommerce zone create/delete in the disposable LocalWP smoke script.
- The smoke script verified the exact temporary zone name before deleting it.
- No secrets, external calls, telemetry, licensing, or remote assets were added.

## WooCommerce Safety Notes

- Product apply code was not changed.
- Apply engine blocked on duplicate-zone conflict.
- Manual zone and manual method were unchanged after the blocked apply attempt.
- Cleanup deleted only the temporary manual smoke zone, not any Yaxii-managed or unrelated zone.

## WordPress.org Compliance Notes

- No upsells, tracking, external dependencies, or obfuscated code were added.
- Documentation describes observed local smoke behavior only.

## QA Guard Findings

- `woo-guard`: Manual zone protection held; apply blocked instead of adopting or updating the manual zone.
- `wp-guard`: No product code changed; temporary auth and smoke scripts were local runtime-only.
- `wp-rest-api`: Preview/apply contract was exercised through the existing guarded flow.
- `clean-code-guard`: No production code changes were needed.
- `docs-guard`: Documentation now matches the observed TASK-009B smoke evidence.
- `wp-plugin-directory-guidelines`: No WordPress.org-sensitive product behavior was added.
- Note: `AGENTS.md` references `.agent/skills/`, but this repo has `.agents/skills/`; the available repo-local skills were used.

## Checks Run

- `git status --short --untracked-files=all`
- `git log --oneline --decorate --graph --max-count=8 --all`
- `wp eval-file` disposable manual-zone smoke script
- `wp eval-file` post-cleanup diagnostics verification
- `agent-browser` authenticated wp-admin Diagnostics load
- `agent-browser` Generator tab load
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Git preflight passed after fast-forwarding/pushing `main`.
- Manual-zone smoke passed.
- Apply blocked correctly on duplicate-zone conflict.
- Post-cleanup diagnostics passed with no duplicate conflicts.
- Browser admin load passed after local WP-CLI auth cookie generation.
- `git diff --check` passed.
- Final git status was clean after commit.
- PHP lint, Composer autoload, npm typecheck, npm lint, and npm build were not run because no PHP or frontend code changed.

## Known Risks

- Browser verification covered the cleaned-up admin state, not the temporary conflict state, because the temporary manual zone was cleaned immediately after the WP-CLI smoke proved protection.
- The smoke used a disposable LocalWP store; it should not be repeated on a production store without explicit approval and backup.

## Blockers

- None.

## Next Recommended Task

TASK-009C should address the next stabilization gap before new write features: either add automated smoke helpers for repeatable LocalWP verification or scope zone-name updates with the same registry-only safety model.

## Commit Hash

Pending until commit.
