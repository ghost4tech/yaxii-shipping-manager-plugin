# TASK-012B - Release UX Cleanup: Navigation, Statuses, Actions, and Refresh States

Date: 2026-06-30

## Goal

Fix the highest-impact release UX issues identified by TASK-012A: hide unreleased top-level tabs, replace unclear manual/protected status wording, add clearer row and diagnostics actions, suppress stale `Needs update` after apply with a frontend verification state, and clarify that Settings saves defaults for future setup only.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Starting branch: `task/012a-release-ux-workflow-audit`
- Working branch: `task/012b-release-ux-cleanup-navigation-status`
- TASK-012A commit `0ce3a2c` was present locally before this task.
- Pre-existing dirty files were present before this task, including older progress reports plus `AGENTS.md`, `CLAUDE.md`, and untracked `TASK-011D-custom-method-shipping-zones-investigation.md`. They were not staged for this task.

## Scope

In scope:

- React admin navigation cleanup.
- Shipping Zones status wording and row actions.
- Frontend-only post-apply verification state.
- Settings defaults-only copy.
- Diagnostics card action copy.
- Related docs and built admin assets.

Out of scope:

- New WooCommerce write behavior.
- Zone-name updates.
- Reset/wipe tooling.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Manual-zone adoption.
- Zone or method deletion.
- Telemetry, licensing, Pro locks, external assets, remote fonts, or hidden calls.

## Navigation changes

- Primary navigation now renders only:
  - Shipping Zones
  - Generator
  - Diagnostics
  - Settings
- Import / Export and Smart Form Sync remain as internal future code paths but are not shown in the main navigation.
- No Coming Soon top-level tabs were added.

## Status wording changes

- Bare `Protected` was removed from Shipping Zones row badges.
- Manual/unknown rows now use `Manual zone`.
- Yaxii-looking rows that are not in the managed registry now use `Not managed by Yaxii`.
- Manual row details show: `Yaxii will not edit this WooCommerce zone.`
- The status summary card now says `Manual zones` instead of `Protected zones`.
- Disabled method tooltips now use merchant-facing status reasons such as `Manual zone`, `Conflict detected`, or `Not managed by Yaxii`.

## Status actions

- Missing setup rows keep `Repair setup`.
- Manual, not-managed, and conflict rows now show:
  - `Review in Diagnostics`
  - `WooCommerce zones`
- Rows with real price differences expose `Review changes`; the UI creates pending price updates from current defaults and sends them through the existing review/preview/apply flow.
- Active rows remain editable without an urgent action.
- No manual adoption, override, delete, or reset action was added.

## Post-apply refresh behavior

- After a successful apply, the frontend records affected wilaya/method keys and expected values.
- Affected rows show `Updating...` while diagnostics refreshes.
- During that verification window, stale `Needs update` is suppressed for those affected rows.
- If refreshed diagnostics confirms the expected price/status, the refreshing state clears and the row returns to its normal status.
- If diagnostics refresh fails, Shipping Zones shows: `Update sent, but verification failed. Refresh diagnostics.`
- If refreshed diagnostics still differs from the requested change, the refreshing state clears and the row can show `Needs update` again with a review action.
- No backend apply behavior changed.

## Settings copy changes

- Settings now uses the page title `Defaults for future setup`.
- Primary save action is now `Save defaults`.
- Successful saves show: `Defaults saved. Existing WooCommerce shipping zones were not changed.`
- Method settings now tell merchants to use Shipping Zones for live WooCommerce price updates.
- Naming settings now say existing WooCommerce zone names are not changed by saving settings.

## Diagnostics action changes

- Diagnostics health cards can now expose simple issue-specific actions.
- Missing setup and method issues route to `Open Shipping Zones`.
- Conflicts, manual zones, and rest-of-world warnings route to `Open WooCommerce zones`.
- The recommendation card now uses the same WooCommerce settings URL handler passed from bootstrap.
- Diagnostics remains read-only.

## Browser smoke result or blocker

Authenticated browser smoke was blocked.

Evidence:

```text
wp option get siteurl
Error: Error establishing a database connection.
```

The same database connection error blocked `wp user list`, so authenticated wp-admin and REST smoke could not be performed in this turn. Static source and built-asset verification were used for navigation/status/settings assertions.

## Runtime smoke result

Runtime smoke was blocked by the local database connection failure above. No WooCommerce write action was triggered during this task.

## Files changed

- `admin-app/src/routes/index.tsx`
- `admin-app/src/types/shipping-zones.ts`
- `admin-app/src/lib/shipping-zones/status.ts`
- `admin-app/src/lib/diagnostics/status.ts`
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesTable.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneRow.tsx`
- `admin-app/src/components/shipping-zones/StatusBadge.tsx`
- `admin-app/src/components/shipping-zones/ShippingZoneDetails.tsx`
- `admin-app/src/components/shipping-zones/ShippingZonesStatusCard.tsx`
- `admin-app/src/components/shipping-zones/ShippingPriceCell.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsPage.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsHealthSummary.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsHealthCard.tsx`
- `admin-app/src/components/diagnostics/DiagnosticsRecommendationCard.tsx`
- `docs/RELEASE-UX-WORKFLOW-AUDIT.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SETTINGS-CONTRACT.md`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-CosXStKA.css`
- `assets/admin/assets/main-DjWmosty.js`

## Files deleted

- `assets/admin/assets/main-CmRHNzhm.css`
- `assets/admin/assets/main-o4Wcro8u.js`

The deleted files were replaced by the fresh Vite build artifacts referenced by the updated manifest.

## What remains not implemented

- CSV import/export backend.
- Top-level Import / Export release UI.
- Top-level Smart Form Sync release UI.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Manual-zone adoption.
- Zone-name apply.
- Reset/delete/wipe tooling.
- Full authenticated browser/runtime smoke for this task, blocked by the local database connection.

## QA guard findings

- Clean-code guard: changes stay in existing components/helpers; no new speculative backend path or remote behavior was introduced.
- Docs guard: updated docs describe implemented behavior and the database smoke blocker.
- Woo guard: no WooCommerce PHP/API write code changed; frontend still routes writes through existing preview/apply.
- WP guard: no new REST route, nonce, capability, enqueue, or PHP output behavior changed.
- WP REST API guard: no REST endpoint contract changed.
- Plugin-directory guard: unreleased tabs are hidden from primary navigation; no telemetry, licensing, Pro lock, remote dependency, or external asset was added.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Source map scan under `assets/admin`
- Restricted phrase scan over `admin-app/src`, `assets/admin`, and `src`
- Raw dataset bundling scan over `assets/admin`
- External asset scan for Google Fonts, remote CSS, and remote scripts
- WooCommerce write-path scan over changed frontend/docs surfaces
- `wp option get siteurl`
- `wp user list --role=administrator --fields=ID,user_login,user_email --format=table`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- `npm run typecheck`: passed.
- `npm run lint`: passed with existing Fast Refresh warnings in shared UI/main files; no lint errors.
- `npm run build`: passed. Vite emitted its existing tsconfig-paths notice and chunk-size warning.
- Source map scan: passed; no `.map` files under `assets/admin`.
- Restricted phrase scan over runtime/source surfaces: passed.
- Raw dataset bundling scan: passed; no `s450r1-algeria-cities-2025`, `commune_name_arabic`, or `wilaya_name_latin` in built admin assets.
- External asset scan: passed for Google Fonts and remote CSS/script enqueues. Broad scans can match React/Tailwind internal strings in built vendor code, but no plugin remote asset load was found.
- WooCommerce write-path scan: no new PHP write path was changed; this task did not modify PHP.
- Browser/runtime smoke: blocked by local database connection failure.
- `git diff --check`: passed. Git reported LF-to-CRLF warnings, including pre-existing unrelated dirty files, but no whitespace errors.
- `git status --short --untracked-files=all`: reviewed. TASK-012B files are present alongside pre-existing unrelated dirty files that were not staged for this task.

## Risks

- Browser smoke could not verify the UI inside live wp-admin because the local database was unavailable.
- The post-apply verification state is frontend-only and depends on diagnostics refresh lifecycle; it should be smoke-tested once the local database is available.
- Import / Export and Smart Form Sync still exist as internal route code and built bundle strings, but they are hidden from top navigation.
- Existing unrelated dirty files remain in the worktree and must stay out of this task commit.

## Blockers

- Authenticated browser/runtime smoke blocked by local database connection error.

## Next recommended task

TASK-012C: Simplify the Generator MVP flow by removing future-only setup choices from the main path, moving commune coverage to informational copy, and reducing safety from a full step to final-preview copy.

## Commit hash

To be recorded in the final task response after commit.
