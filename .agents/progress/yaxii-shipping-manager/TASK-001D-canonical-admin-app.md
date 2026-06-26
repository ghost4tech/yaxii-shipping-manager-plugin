# TASK-001D - Canonical Admin App Frontend

Date: 2026-06-26

## Goal

Create `admin-app/` as the canonical WordPress admin frontend for Yaxii Shipping Manager, using the cleaner candidate app direction while keeping the application static, local-only, WordPress-safe, and mock/read-only.

## Scope

- Created a plain React + TypeScript + Vite admin app under `admin-app/`.
- Updated the WordPress admin asset entry to the new canonical Vite manifest key.
- Rebuilt `assets/admin/` from `admin-app/`.
- Preserved the old `app/` frontend as reference source.
- Preserved `.agents/references/lovable-admin-v2/`.
- Preserved `app/.git-prototype-backup/`.
- Did not implement WooCommerce reads/writes, diagnostics backend, preview planner, safe apply engine, CSV backend, provider integrations, licensing, telemetry, or YSF sync.

## Files Changed

- `src/Admin/AssetRegistrar.php`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-C14vKoig.js`
- `assets/admin/assets/main-Chzpn-KV.css`
- Removed obsolete generated admin build chunks from the previous `app/` build output in `assets/admin/assets/`.

## Files Created

- `admin-app/package.json`
- `admin-app/package-lock.json`
- `admin-app/tsconfig.json`
- `admin-app/vite.config.ts`
- `admin-app/src/main.tsx`
- `admin-app/src/App.tsx`
- `admin-app/src/bootstrap.ts`
- `admin-app/src/styles.css`
- `admin-app/src/types.ts`
- `admin-app/src/data/mock-data.ts`
- `admin-app/src/components/Button.tsx`
- `admin-app/src/components/Notice.tsx`
- `admin-app/src/components/SectionHeader.tsx`
- `admin-app/src/components/StatusPill.tsx`
- `admin-app/src/components/TopNav.tsx`
- `admin-app/src/screens/SetupScreen.tsx`
- `admin-app/src/screens/ShippingZonesScreen.tsx`
- `admin-app/src/screens/DiagnosticsScreen.tsx`
- `admin-app/src/screens/ImportExportScreen.tsx`
- `admin-app/src/screens/SettingsScreen.tsx`
- `admin-app/src/screens/SmartFormSyncScreen.tsx`
- `.agents/progress/yaxii-shipping-manager/TASK-001D-canonical-admin-app.md`

## What Was Before

TASK-001 and TASK-001B mounted a pruned WordPress-safe frontend from the old `app/` source. That frontend worked but still carried the old prototype lineage and build source. TASK-001C audited `.agents/references/lovable-admin-v2/` and recommended creating a new canonical frontend folder instead of continuing to build from `app/`.

## Why `admin-app/` Was Created

`admin-app/` gives the plugin a clean, explicit frontend source that is separate from the old Lovable/TanStack prototype and from the candidate reference app. It avoids TanStack Start SSR assumptions, server entry files, Lovable baggage, Tailwind base resets, broad candidate dependencies, and global CSS leakage while keeping the cleaner top-navigation UX direction.

## What Changed

- Added a static React admin app with hash-based screen navigation.
- Added top navigation screens for Setup, Shipping Zones, Diagnostics, Import / Export, Settings, and Smart Form Sync.
- Added mock local state for setup path, dataset mode, wilaya pricing rows, diagnostics simulator settings, and settings form controls.
- Updated `AssetRegistrar::ENTRY_FILE` from `src/wp-admin-main.tsx` to `src/main.tsx`.
- Added `admin-app` package scripts:
  - `npm run typecheck`
  - `npm run build`
- Configured `admin-app/vite.config.ts` to output production assets to `../assets/admin/` with `sourcemap: false`.

## Candidate UX Ported

- Top navigation instead of a sidebar/dashboard shell.
- Centered plugin-page layout with a restrained header and practical merchant-focused sections.
- Setup paths for Quick Setup, Manual Setup, and CSV Import.
- Clear MVP screens instead of broad product-marketplace or advanced feature surfaces.
- Smart Form Sync as an informational coming-later screen only.

## Intentionally Not Ported

- TanStack Start routing, SSR/server entry files, and document shell files.
- Lovable error reporting, metadata, or telemetry hooks.
- shadcn/Radix/Tailwind dependency stack.
- HeroUI, because the TASK-001C audit found no real HeroUI usage and this implementation does not need it.
- Runtime Advanced or premium tab.
- Product marketplace, provider dispatch, automations, multi-country switching, pro locks, or aggressive upsells.
- Fake "WooCommerce zones generated", fake apply success, timers implying backend work, or simulated live writes.

## What Still Remains Mocked

- Wilaya dataset is local mock data only.
- Shipping Zones table edits are local UI state only.
- Diagnostics and Checkout Protection are local simulators only.
- Import/export controls are mock UI only.
- Settings controls are local UI state only.
- Smart Form Sync is disabled and informational only.
- No WooCommerce shipping zone read/write backend exists in this task.
- No preview planner, safe apply engine, CSV backend, provider import, or YSF sync exists in this task.

## WordPress Bootstrap Behavior

The new app preserves the TASK-001/TASK-001B bootstrap contract:

- Reads localized config from `window.yaxiiShippingManagerAdmin`.
- Fetches `GET yaxii-shipping-manager/v1/bootstrap` through the localized REST base URL.
- Sends `X-WP-Nonce`.
- Shows a loading state while bootstrap is checked.
- Shows an error state if config or REST bootstrap fails.
- Shows a WooCommerce inactive notice when bootstrap reports WooCommerce inactive.
- Does not fake backend availability when feature flags are unavailable.

## Styling Containment Approach

- App runtime mounts at `#yaxii-shipping-manager-admin-app`.
- Styles are scoped under `#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app`.
- No global `body`, `html`, `:root`, `*`, or wp-admin element resets were added.
- No external CDN fonts or assets were added.
- No Tailwind base reset is imported.
- The visual approach uses a calm plugin-page layout with restrained color balance and practical controls.

## Build Pipeline Changes

- `admin-app/vite.config.ts` builds `admin-app/src/main.tsx`.
- Output remains `assets/admin/`.
- Production source maps are disabled.
- The generated manifest key is now `src/main.tsx`, matching `AssetRegistrar::ENTRY_FILE`.
- The PHP enqueue path can continue to use the existing manifest-driven asset registration logic.

## Bundle / Assets Generated

`npm run build` generated:

- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-C14vKoig.js`
- `assets/admin/assets/main-Chzpn-KV.css`

Build size output:

- CSS: `9.20 kB`, gzip `1.84 kB`
- JS: `211.00 kB`, gzip `66.38 kB`

No `.map` files were generated under `assets/admin/`.

## Security Notes

- No telemetry, tracking, hidden remote calls, external CDN assets, or Lovable reporting code was added.
- The only runtime network request authored by the app is the same-origin WordPress REST bootstrap request using the localized nonce.
- Built asset URL scanning found bundled library constants for React error docs and DOM namespaces only; no CDN, telemetry, Lovable, Sentry, PostHog, analytics, or external asset-loading code was found.
- No destructive actions were added.

## WooCommerce Safety Notes

- No WooCommerce shipping zones are read or written.
- No WooCommerce diagnostics backend was added.
- UI copy explicitly says shipping edits are local UI state only.
- WooCommerce inactive bootstrap state is surfaced instead of hidden.
- Safe apply remains blocked until read-only diagnostics and preview planner are implemented.

## WordPress.org Compliance Notes

- No licensing system, pro locks, trialware, telemetry, obfuscated code, remote dependency, external CDN asset, or aggressive upsell was added.
- Smart Form Sync is informational and disabled.
- The app does not include provider sending APIs or dispatch workflows.
- The app avoids "68 wilayas" and unverified "69 wilayas" wording.
- Core functionality remains local-first and transparent.

## Checks Run

- `npm install` in `admin-app/`
- `npm install --save-dev @types/node@22.16.5` in `admin-app/`
- `npm run typecheck` in `admin-app/`
- `npm run build` in `admin-app/`
- `php -l src\Admin\AssetRegistrar.php`
- `Get-Content assets\admin\.vite\manifest.json`
- `Get-ChildItem -Recurse assets\admin -Filter *.map`
- `rg -n -o "https?://|//cdn|__lovable|captureException|lovable|telemetry|analytics|posthog|sentry|gtag" assets\admin admin-app\src`
- `rg -n "69 wilayas|68 wilayas|WooCommerce zones generated|applied successfully|Generating WooCommerce zones|Premium|upgrade|Yalidine|Maystro|ZR Express|automations|multi-country|TanStack|<html\b|<body\b|<head\b|<Scripts\b|__lovable|captureException|lovable" admin-app\src`
- `rg -n "(^|\s)(body|html|:root|\*)\s*\{" admin-app\src\styles.css`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- `npm install`: passed, `0 vulnerabilities`.
- `npm install --save-dev @types/node@22.16.5`: passed, `0 vulnerabilities`.
- Initial `npm run typecheck`: failed because Vite config needed Node typings for `node:path` and `__dirname`.
- Final `npm run typecheck`: passed after adding `@types/node`.
- `npm run build`: passed.
- `php -l src\Admin\AssetRegistrar.php`: passed.
- Manifest check: passed; entry is `src/main.tsx`.
- Source map check: passed; no `.map` files found under `assets/admin/`.
- Forbidden source wording check: passed.
- CSS global selector check: passed.
- Built URL/string check: no telemetry/CDN/Lovable strings found; React and DOM namespace URL constants are present as bundled library strings only.
- `git diff --check`: passed.
- `git status --short --untracked-files=all`: passed; showed expected task changes plus pre-existing untracked `.agents/references/lovable-admin-v2/` files, which were intentionally left unstaged.

## Known Risks

- The new app is still mock/read-only; product behavior depends on future dataset, diagnostics, preview, and apply tasks.
- Bundle size is much lower than the old split prototype shape but still includes React, React DOM, and Lucide. It should be monitored as screens grow.
- No browser smoke test was run in wp-admin during this task.
- `.agents/references/lovable-admin-v2/` remains untracked from the prior candidate import and was intentionally not staged.

## Blockers

None for this frontend foundation task.

## Next Recommended Task

TASK-002 should start dataset hardening only after a quick wp-admin runtime smoke of the new `admin-app/` mount, including bootstrap loading, REST failure state, WooCommerce inactive state, hash navigation, and scoped CSS behavior inside wp-admin.

## Commit Hash

Committed after final checks; final immutable hash is recorded in the task closeout response.
