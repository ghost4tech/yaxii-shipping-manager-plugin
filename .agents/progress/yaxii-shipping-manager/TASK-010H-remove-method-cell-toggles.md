# TASK-010H - Remove Method Cell Toggles

Date: 2026-06-29

## Goal

Remove Home/Office method-cell enable/disable toggles from the Shipping Zones page while keeping enable/disable available through selected-row quick tools and the row-level wilaya active control.

## Scope

- Remove active method status switches from `ShippingPriceCell`.
- Keep pending method status display and undo behavior.
- Keep selected-row `Enable` and `Disable` quick tools.
- Keep the row-level wilaya active switch because it uses the shared switch at its default size and remained visually stable in browser smoke.
- Update docs and rebuilt admin assets.
- Do not change backend preview/apply or WooCommerce write behavior.

## Git state

- Starting branch: `task/010g-enable-disable-managed-methods`
- TASK-010G commit `a7e3d7a` was present locally.
- Local `main` and `origin/main` were behind TASK-010G at preflight, then safely fast-forwarded to `a7e3d7a`.
- Working branch: `task/010h-remove-method-cell-toggles`
- Commit hash: pending at report creation; final hash reported in task closeout.

## Files changed

- `admin-app/src/components/shipping-zones/ShippingPriceCell.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneRow.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesTable.tsx`
- `assets/admin/.vite/manifest.json`
- `docs/RUNTIME-SMOKE.md`
- `docs/SHIPPING-ZONES-TABLE.md`

Build output replaced:

- Removed old built assets:
  - `assets/admin/assets/main-CWYIE_GA.css`
  - `assets/admin/assets/main-CYa6dRL1.js`
- Added current built assets:
  - `assets/admin/assets/main-D4jbCsws.css`
  - `assets/admin/assets/main-B3WcCCvf.js`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-010H-remove-method-cell-toggles.md`

## What was before

- Each Home/Office method cell rendered a compact enable/disable switch.
- The switch was forced to a smaller `h-4 w-7` size while the shared switch thumb transform was built for the default size, causing visual drift.
- Merchants could enable/disable from both method cells and selected-row quick tools, which added noise.

## What changed

- Removed the method-cell switch and its `onStatusChange` prop chain from `ShippingPriceCell`, `ShippingZoneRow`, `ShippingZonesTable`, and `ShippingZonesPage`.
- Method cells now focus on method label, price input, live price, pending price state, and pending status state.
- Disabled methods show a small `Disabled` badge and muted cell styling.
- Unknown or not-managed methods no longer get mislabeled as `Disabled`; the badge appears only for explicit disabled or pending-disabled methods.
- Pending status changes still show `Enabled -> Disabled` or `Disabled -> Enabled` with undo.
- Selected-row quick tools remain the primary method-level enable/disable workflow.

## Method-cell toggle removal

Method-cell toggles were fully removed. `ShippingPriceCell.tsx` no longer imports or renders `Switch`, and no method-level status change callback is passed into the cell.

## Quick tools behavior

Selected-row quick tools still show:

- `Home`
- `Office`
- `Both`
- `Enable`
- `Disable`
- `Review changes`

Browser smoke verified that selecting Adrar exposes the quick tools and that Office can be disabled and restored through review/apply.

## Disabled method visual state

Disabled methods keep the method label visible, show a `Disabled` badge, and keep the price visible in a muted state. Re-enable remains available through selected-row quick tools.

## Browser smoke result

Authenticated browser smoke passed using a temporary administrator user that was deleted after the test.

Verified:

- Shipping Zones page renders in `wp-admin`.
- Home/Office method cells no longer expose method-cell switches.
- Row-level wilaya switches remain visible and aligned.
- Adrar showed Home `700` and Office `400` after restore.
- Selecting Adrar showed selected-row quick tools including `Enable` and `Disable`.
- Office-only `Disable` from quick tools created one pending status change.
- The review dialog opened and applied the disable through safe preview/apply.
- Office-only `Enable` from quick tools restored Office through safe preview/apply.
- Final browser state showed pending changes `0`, Home `700`, Office `400`, and the row-level Adrar switch enabled.

Browser notes:

- A first post-login app load displayed a bootstrap HTTP 502, then a clean reload of the plugin page succeeded with localized admin config available.
- One browser wait command timed out at the local connection layer after clicking `Save changes`; reopening the page showed the success dialog `Shipping changes updated`.
- PowerShell reported intermittent local CLR startup failures during browser text extraction. These did not affect the browser page state or the runtime smoke result.

## Runtime smoke result

WP-CLI/REST smoke passed using the normal preview/apply REST controllers in-process with an administrator user and REST nonce.

```text
before zone=73 flat_rates=2 enabled=Home delivery:|Office delivery:
disabled zone=73 flat_rates=2 enabled=Home delivery:
after zone=73 flat_rates=2 enabled=Home delivery:|Office delivery:
Success: TASK-010H status smoke passed; DZ:01 Office restored and no duplicate methods were created.
```

Verified:

- DZ:01 Office disable produced one safe method status update.
- Office disappeared from enabled rate output while Home stayed enabled.
- Office restore produced one safe method status update.
- DZ:01 finished restored with Home and Office enabled.
- Managed flat-rate method count stayed `2`.

## What remains not implemented

- Zone-name updates.
- Deletes/reset/wipe tooling.
- Manual-zone adoption.
- Manual or unknown method updates.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.

## Security notes

- No new REST routes were added.
- No backend write path was changed.
- Status writes still go through the existing nonce and capability-protected preview/apply flow.
- No telemetry, licensing, Pro locks, external assets, or remote calls were added.

## WooCommerce safety notes

- No PHP files were changed.
- `SafeApplyEngine` behavior was not changed.
- No delete calls, manual-zone update path, manual-method update path, or unsafe direct table write path was added.
- Browser and runtime smoke restored DZ:01 after status changes.

## WordPress.org compliance notes

- No external CDN assets, Google Fonts, remote scripts, or remote CSS were added.
- No hidden tracking, telemetry, licensing, or upsell behavior was added.
- Built assets are local.
- Reference app files were not staged.

## QA guard findings

- `clean-code-guard`: removed an unnecessary UI control and prop chain without introducing a new abstraction or behavior path.
- `docs-guard`: docs now describe the actual UI: method-cell switches are absent; selected-row tools handle method enable/disable.
- `woo-guard`: no WooCommerce code changed; existing safe status update path was smoke-tested and restored.
- `wp-guard`: no WordPress route, capability, nonce, output, or option behavior changed.
- `wp-rest-api`: existing preview/apply REST routes were exercised without route changes.
- `wp-plugin-directory-guidelines`: no remote assets, telemetry, licensing, or Pro-lock behavior was introduced.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- restricted phrase scan over `admin-app/src`, `src`, and `assets/admin`
- raw dataset marker scan over built JS/CSS
- external asset scan for Google Fonts, remote CSS, and remote scripts
- WooCommerce write scan
- WP-CLI/REST runtime smoke
- authenticated browser smoke
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- TypeScript typecheck: passed.
- Lint: passed with existing Fast Refresh warnings in shared UI files.
- Build: passed.
- Source maps: none found under `assets/admin`.
- Restricted phrase scan: no hits in production source/assets.
- Raw dataset marker scan: no hits in built JS/CSS.
- External asset scan: no Google Fonts, remote CSS, or remote scripts.
- WooCommerce write scan: existing writes remain in settings, registry, and `SafeApplyEngine`; no delete or manual update path was added.
- Runtime smoke: passed and restored DZ:01.
- Browser smoke: passed and restored Adrar.
- `git diff --check`: passed with CRLF warnings only.

## Known risks

- The row-level wilaya switch remains visible. It was kept because it is visually stable at the shared default switch size and provides a convenient whole-wilaya action.
- The browser environment showed intermittent local transport issues, but page state and runtime verification were both completed.
- The table still reports the current dataset count as `69`, which is existing product/data behavior outside this narrow UI task.

## Blockers

None.

## Next recommended task

TASK-010I: focused browser polish for the row-level active switch label and selected-toolbar copy, especially how whole-wilaya disable differs from Office/Home-only quick tools.
