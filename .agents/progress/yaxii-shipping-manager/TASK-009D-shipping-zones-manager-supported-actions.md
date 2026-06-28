# TASK-009D: Shipping Zones Manager UX and Supported Actions

Date: 2026-06-28

## Goal

Turn the Shipping Zones tab into a clean management center for live WooCommerce status, supported pending price changes, and safe review/apply.

## Scope

- Frontend UX only for the Shipping Zones tab.
- Documentation updates for the table, generator handoff, and runtime smoke checklist.
- Runtime smoke for one controlled Yaxii-managed method price update and restoration.

## Git state

- Started from `task/009c-shipping-zones-table-status-ux`.
- Confirmed TASK-009C commit `9f70b79` was local.
- Fast-forwarded local `main` to `9f70b79` and pushed `origin/main`.
- Created and worked on `task/009d-shipping-zones-manager-supported-actions`.
- `.agents/references/yaxii-shipping-hub-03/` stayed ignored and was not staged.

## Files changed

- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-CZrHGeKE.js`
- `assets/admin/assets/main-CtYPykdq.css`
- `docs/GENERATOR-WIZARD.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SHIPPING-ZONES-TABLE.md`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-009D-shipping-zones-manager-supported-actions.md`

## What was before

- The Shipping Zones table showed live status but still felt like a local draft playground.
- The top of the page had repeated notices and duplicate routes into the generator.
- The table exposed noisy live-zone details by default.
- Price/free controls did not clearly communicate that supported changes must go through review/apply.
- Enable/disable controls were still too prominent even though that write path is not implemented.

## What changed

- The tab now presents one compact status card with one `Open Generator` action, secondary `Check diagnostics`, and `Open WooCommerce zones`.
- `Open WooCommerce zones` opens the WooCommerce shipping settings screen in a new browser tab.
- The table is simplified to checkbox, code, wilaya, status, Home price, Office price, and actions.
- Technical zone/method details are hidden behind `Show details`.
- Status copy now uses merchant-facing labels such as `Active`, `Managed by Yaxii`, `Missing setup`, `Manual conflict`, and `Protected`.
- Price edits create pending changes and mark cells with `Changed`.
- A pending-change action bar provides `Set price`, `Make free`, `Review changes`, `Clear changes`, and `Clear selection`.
- Row free actions are explicit: `Home free` and `Office free`.
- `Review changes` calls the existing preview endpoint and renders the same safe final preview/apply panel used by the generator.

## Supported actions

- Edit Home delivery price for Yaxii-managed methods.
- Edit Office delivery price for Yaxii-managed methods.
- Set a supported managed method price to `0` through row or bulk controls.
- Bulk-set a selected managed method price.
- Review pending changes through the preview/apply safety flow.
- Apply supported method price changes through the existing safe apply engine only.

## Unsupported actions disabled or hidden

- Enable/disable method writes remain inactive and are shown as future work.
- Manual or unknown method updates are blocked in the table.
- Manual-zone adoption is not added.
- Zone-name updates are not added.
- Deletes and reset/wipe tooling are not added.
- The table does not write directly to WooCommerce.

## Review/apply integration

`Review changes` builds a preview request for the changed wilayas and renders `PreviewPlanPanel` in place. The apply request still reuses the existing SafeApplyEngine path, including preview revalidation and managed-registry ownership checks.

## Browser smoke result

Passed with `agent-browser` against the authenticated LocalWP admin page.

- Opened the Shipping Zones tab.
- Confirmed noisy notices were reduced.
- Confirmed one in-page `Open Generator` button.
- Confirmed `Open WooCommerce zones` is a new-tab action.
- Confirmed details are hidden by default.
- Confirmed DZ:01 showed live Home `700` and Office `400`.
- Changed DZ:01 Home to `701`.
- Confirmed the row showed `Changed` and the pending action bar showed `Review changes`.
- Reviewed and applied through the safe preview/apply panel.
- Restored DZ:01 Home to `700` through the same safe flow.

## Runtime smoke result

Passed with WP-CLI verification after browser apply.

- After the first apply, DZ:01 Home delivery changed to `701`.
- After restoration, DZ:01 methods were:
  - `Home delivery: 700`
  - `Office delivery: 400`
- Checkout-style rate calculation for destination `DZ:01` returned:
  - `Home delivery: 700`
  - `Office delivery: 400`
- No duplicate methods were observed for DZ:01.

## What remains mocked or not implemented

- Enable/disable method writes.
- Zone-name updates.
- Manual-zone adoption.
- Manual/unknown zone or method updates.
- Deletes and reset/wipe tooling.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.

## Security notes

- No new remote calls were added.
- No direct unsafe WooCommerce write path was added from the table.
- Apply remains behind the existing REST nonce/capability flow.
- Manual/unknown rows remain protected by UI gating and backend ownership checks.

## WooCommerce safety notes

- WooCommerce writes still go through `SafeApplyEngine`.
- The table creates pending changes only.
- Registry-owned method price changes are the only supported write path used by this task.
- No product delete path was added.
- No manual-zone or manual-method update path was added.

## WordPress.org compliance notes

- No licensing gate, external dependency, hidden remote call, or public-site injection was added.
- Built admin assets remain local plugin assets.
- User-facing copy avoids claiming unsupported features are available.

## QA guard findings

- `clean-code-guard`: Changes are scoped to one frontend route and docs; the larger route file remains a known complexity risk, but this task did not widen it further beyond the existing pattern.
- `docs-guard`: Docs now describe live status plus pending supported changes and list unsupported actions as not implemented.
- `wp-guard`: No PHP or REST endpoint changes were made.
- `wp-rest-api`: Frontend reuses existing preview/apply endpoints.
- `woo-guard`: No new WooCommerce write path was introduced; supported writes remain in `SafeApplyEngine`.
- `wp-plugin-directory-guidelines`: No directory-policy risk was introduced.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Browser smoke with `agent-browser`
- WP-CLI DZ:01 method inspection
- WP-CLI DZ:01 rate calculation
- No source maps scan
- Restricted phrase scan
- Built JS raw dataset scan
- WooCommerce write scan
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- Typecheck: passed.
- Lint: passed with 8 pre-existing Fast Refresh warnings in UI helper files.
- Build: passed. Built asset: `assets/admin/assets/main-CZrHGeKE.js`.
- Browser smoke: passed.
- Runtime smoke: passed and restored the controlled local price.
- Source maps: passed; no source map files were found under `assets/admin`.
- Restricted phrase scan: changed files and rebuilt assets were clean. A broader docs scan still finds pre-existing policy-only references in old architecture/PRD documentation; this task did not add them.
- Built JS raw dataset scan: passed; no raw dataset identifiers were found.
- WooCommerce write scan: passed for this task; product writes remain in `SafeApplyEngine`, with settings/registry option saves unchanged.
- Delete scan: passed; no delete calls were found in product source.
- `git diff --check`: passed.
- Git status: expected modified/new task files only before commit.

## Known risks

- `admin-app/src/routes/index.tsx` is still a large route module; a future cleanup should split the Shipping Zones manager into smaller components.
- Browser automation required DOM event dispatch for controlled number inputs, while the UI itself behaved correctly after the event was dispatched.
- The table preview is rendered in place rather than deep-linking directly to a dedicated generator final-step route.

## Blockers

None.

## Next recommended task

TASK-009E: add a small, explicit method enable/disable preview/apply task if that action is still desired; otherwise proceed to the next planned safe write feature.

## Commit hash

Pending.
