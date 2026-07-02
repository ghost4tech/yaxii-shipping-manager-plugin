# TASK-012M: Shorten Disabled Status Label

Date: 2026-07-02

## Goal

Shorten the Shipping Editor row status shown when all Yaxii-managed methods are disabled so the badge does not wrap each word onto a separate line.

## Scope

- Frontend/admin status copy only.
- Update the runtime smoke checklist to match the new visible label.
- Rebuild the admin bundle.

Out of scope:

- SafeApplyEngine behavior.
- WooCommerce writes, deletes, or setup/removal behavior.
- Manual-zone adoption or editing.
- Shipping status enum or diagnostics semantics.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/012m-shorten-disabled-status`
- Baseline included TASK-012L at `099ea66` and earlier TASK-012J at `69eb754`.
- Pre-existing unrelated dirty files were present before this task and were not staged.

## Files Changed

- `admin-app/src/components/shipping-zones/StatusBadge.tsx`
- `admin-app/src/lib/shipping-zones/status.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-oBPj8BrD.js`
- `assets/admin/assets/main-B-jGeXvN.js` removed by Vite rebuild
- `docs/RUNTIME-SMOKE.md`

## Files Created

- `.agents/progress/yaxii-shipping-manager/TASK-012M-shorten-disabled-status.md`

## What Was Before

- The disabled row status label was `Methods disabled`.
- In the fixed-width status column, the phrase could wrap awkwardly with each word on its own line.

## What Changed

- The visible disabled status label is now `Disabled`.
- The shared Shipping Editor row status label map now also uses `Disabled`.
- The underlying `disabled` status key and diagnostic message `Managed methods are disabled` remain unchanged.
- The runtime smoke checklist now expects `Disabled`, not `Methods disabled`.
- The built admin JS manifest was refreshed.

## What Still Remains Mocked

- Existing current limitations remain unchanged:
  - CSV import/export backend is not implemented.
  - Commune-level pricing is not implemented.
  - Provider imports and YSF sync are not implemented.
  - Zone-name updates are not applied.

## Security Notes

- No PHP, REST, nonce, capability, or persistence code changed.
- No external assets, telemetry, analytics, remote scripts, or hidden calls were added.

## WooCommerce Safety Notes

- No WooCommerce write path changed.
- No delete path changed.
- Safe apply remains the only setup/repair writer.
- Managed setup removal behavior was not touched.
- Manual and unknown zones remain protected by existing code.

## WordPress.org Compliance Notes

- Local-only admin asset rebuild.
- No CDN fonts, remote CSS, or remote scripts added.
- Merchant-facing copy is shorter and clearer.

## QA Guard Findings

- `clean-code-guard`: narrow copy-only frontend change; no unnecessary abstraction added.
- `docs-guard`: smoke checklist updated to match the changed UI label.
- `wp-guard`: no WordPress/PHP surface changed.
- `woo-guard`: no WooCommerce API or write/delete behavior changed.

## Checks Run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- No source maps under `assets/admin`
- Restricted phrase scan
- Raw dataset bundling scan over built JS
- External asset scan
- WooCommerce write/delete diff scan
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Typecheck: passed.
- Lint: passed with existing Fast Refresh warnings in shared UI files outside this task.
- Build: passed; Vite reported the existing large chunk warning.
- Source maps: none found.
- Restricted phrase scan: no matches.
- Raw dataset bundling scan: no matches.
- External asset scan: no matches.
- WooCommerce write/delete diff scan: no matches.
- `git diff --check`: passed; Git reported line-ending normalization warnings only.
- Browser/runtime smoke: not run for this narrow copy change.

## Known Risks

- Browser visual smoke was not run, so the exact wp-admin rendering was not captured in this task.
- The repository still contains unrelated dirty files that predate this task.

## Blockers

- None for the requested status-label cleanup.

## Next Recommended Task

Run a quick wp-admin visual pass over Shipping Editor at desktop and narrow widths to confirm the shortened badge renders as intended beside the method columns.

## Commit Hash

Pending at report write time; final response records the commit created from this report and the scoped task diff.
