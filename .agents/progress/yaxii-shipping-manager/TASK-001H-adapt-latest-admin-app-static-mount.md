# TASK-001H - Adapt Latest admin-app Source for WordPress Static Mount

Date: 2026-06-26

## Goal

Adapt the replaced latest Lovable `admin-app/` source into a static WordPress-admin-compatible React app while preserving the Lovable UI direction.

## Root Issue

The latest `admin-app/` source was visually useful but still shaped as a TanStack Start prototype. It assumed generated routes and SSR/runtime files, had global Tailwind/Lovable CSS behavior, contained Lovable error reporting code, and showed fake WooCommerce write/diagnostic success states that the plugin backend does not yet support.

## Scope

- Worked only in the current `admin-app/` source, `assets/admin/` build output, and the existing admin asset registrar.
- Did not work in old `app/`.
- Did not implement dataset backend, settings persistence, WooCommerce reads/writes, diagnostics backend, preview planner, apply engine, CSV backend, or YSF sync.
- Restored the previously deleted TASK-001E report.

## Files Changed, Created, Restored

Changed:

- `admin-app/package.json`
- `admin-app/package-lock.json`
- `admin-app/tsconfig.json`
- `admin-app/vite.config.ts`
- `admin-app/src/bootstrap.ts`
- `admin-app/src/main.tsx`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/styles.css`
- `admin-app/src/components/ui/dialog.tsx`
- `admin-app/src/components/ui/popover.tsx`
- `admin-app/src/components/ui/select.tsx`
- `src/Admin/AssetRegistrar.php`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-D7SFVoaB.css`
- `assets/admin/assets/main-DhYq6o1r.js`

Created:

- `admin-app/src/lib/admin-portal.ts`
- `admin-app/src/types/postcss-prefix-selector.d.ts`
- `.agents/progress/yaxii-shipping-manager/TASK-001H-adapt-latest-admin-app-static-mount.md`

Restored:

- `.agents/progress/yaxii-shipping-manager/TASK-001E-runtime-bootstrap-smoke-fix.md`

Removed from WordPress runtime source:

- TanStack Start server/router files.
- Lovable telemetry/error capture files.
- Bun lock/config files.
- Old TASK-001D admin-app source files replaced by the latest Lovable app.
- Misleading TanStack routes README.

## What Was Unsafe Before

- The WordPress build path still depended on TanStack Start prototype files.
- The app included route/document-shell assumptions that do not belong in wp-admin.
- CSS used global Tailwind base behavior and global app tokens.
- Lovable error reporting code referenced `window.__lovableEvents` and `captureException`.
- The UI claimed WooCommerce zones could be generated, live, or updated even though no backend write engine exists.
- Diagnostics claimed real WooCommerce status and checkout safety from mock timers.
- Dataset copy used unverified count wording.
- Advanced roadmap/provider features were visible in runtime navigation.
- AssetRegistrar rebuilt the script tag and risked stripping the inline bootstrap global.

## What Changed

- Restored a static Vite WordPress entry at `admin-app/src/main.tsx`.
- Added `admin-app/src/bootstrap.ts` to read `window.yaxiiShippingManagerAdmin`, fetch `GET yaxii-shipping-manager/v1/bootstrap`, and send `X-WP-Nonce`.
- Added loading and useful bootstrap error states.
- Added WooCommerce inactive notice based on bootstrap response.
- Converted `admin-app/src/routes/index.tsx` from a TanStack route export into the mounted admin app component.
- Preserved the Lovable shell: top header, sticky top nav, centered layout, cards, wizard, table, settings, diagnostics, import/export, and Smart Form Sync screen.
- Removed Advanced from runtime navigation.
- Reworded actions to local draft, preview, and backend-not-connected states.
- Scoped CSS under `#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app`.
- Added PostCSS selector prefixing so built Tailwind utilities are scoped to the plugin app.
- Moved Dialog, Select, and Popover portals into an in-app portal root so scoped CSS still applies.
- Removed TanStack Start/Lovable runtime dependencies from the WordPress build path.
- Switched package management to npm/package-lock only.
- Rebuilt `assets/admin/`.
- Restored TASK-001E-safe AssetRegistrar behavior by adding `type="module"` without replacing the full script tag.

## Latest Lovable UI Structure Preserved

- Header with plugin identity and launch action.
- Top navigation layout.
- Shipping Zones table with row selection and method controls.
- Generator/setup wizard with dataset, methods, import, prices, and review steps.
- Diagnostics/Checkout Protection view.
- Import / Export screen.
- Settings screen.
- Smart Form Sync screen as disabled/coming later.
- Card-based Lovable/shadcn visual language and icon usage.

## Intentionally Removed Or Reworded

- Removed fake WooCommerce zone generation, live-success, and apply-success copy.
- Removed fake timers that implied backend work.
- Removed fake live WooCommerce diagnostics.
- Removed JSON import path from active setup flow.
- Removed provider imports, scheduled changes, commune-level pricing, multi-store presets, and Advanced runtime navigation.
- Replaced dataset count claims with:
  - `Current Algeria dataset`
  - `Legacy 58-compatible dataset`
  - `Full dataset will be verified in TASK-002`
- Kept Smart Form Sync visible only as coming later with no active sync.

## Bootstrap Behavior

- `main.tsx` mounts only into `#yaxii-shipping-manager-admin-app`.
- Reads `window.yaxiiShippingManagerAdmin`.
- Fetches `bootstrap` from the localized REST namespace URL.
- Sends `X-WP-Nonce`.
- Shows loading, error, local-draft, and WooCommerce inactive states.
- Does not fake backend feature availability.

## CSS Scoping Approach

- Source CSS no longer defines global `body`, `html`, `:root`, or unscoped wildcard styling.
- Tailwind base reset is not imported.
- Built CSS is post-processed through `postcss-prefix-selector` under `#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app`.
- Radix portals used by current screens render into `#yaxii-shipping-manager-admin-portal` inside the app shell.
- No external fonts or CDN assets were added.

## Build Pipeline Changes

- Vite config now uses a static app input: `src/main.tsx`.
- Build output is `../assets/admin`.
- Manifest is enabled.
- Source maps are disabled.
- Package scripts now include:
  - `typecheck`
  - `build`
  - `lint`
  - `format`
- npm/package-lock is the chosen package manager. Bun files were removed.

## Asset Manifest Result

`assets/admin/.vite/manifest.json` now contains:

```json
{
  "src/main.tsx": {
    "file": "assets/main-DhYq6o1r.js",
    "name": "main",
    "src": "src/main.tsx",
    "isEntry": true,
    "css": ["assets/main-D7SFVoaB.css"]
  }
}
```

## Checks Run And Results

- `npm install` in `admin-app`: passed, 0 vulnerabilities. Warning: local Node is `22.12.0`; `eslint-visitor-keys@5.0.1` requests `^20.19.0 || ^22.13.0 || >=24`.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run lint`: passed with 8 warnings, all `react-refresh/only-export-components` warnings from shadcn-style component exports and `main.tsx`.
- `php -l src/Admin/AssetRegistrar.php`: passed.
- Source map check under `assets/admin`: passed, no `.map` files found.
- Forbidden string scan over `admin-app/src` and `assets/admin`: passed for `__lovable`, `captureException`, `lovable`, `telemetry`, `analytics`, `posthog`, `sentry`, `gtag`, `69 wilayas`, `68 wilayas`, `WooCommerce zones generated`, `applied successfully`, and `Generating WooCommerce zones`.
- TanStack/document-shell scan: passed for `<html>`, `<head>`, `<body>`, `Scripts`, `HeadContent`, `tanstack`, `createFileRoute`, `react-start`, `__root`, `routeTree`, and `server-entry`.
- CSS unsafe selector scan: passed for unscoped `body`, `html`, `:root`, and wildcard rules.
- `git diff --check`: passed with Windows line-ending warnings only.
- `git status --short --untracked-files=all`: run before report creation and again before commit.

## Browser Smoke Result Or Blocker

Browser smoke was not possible from this shell because WP-CLI could not connect to the LocalWP database:

```text
Error: Error establishing a database connection.
```

This blocks confirming a logged-in wp-admin render, REST bootstrap success in-browser, and navigation visually on the plugin page.

## What Remains Mocked Or Not Implemented

- Dataset is still inline mock/reference data only.
- Algeria dataset verification remains TASK-002.
- No settings persistence.
- No WooCommerce zone reads or writes.
- No WooCommerce diagnostics backend.
- No checkout protection backend.
- No preview planner.
- No safe apply engine.
- No CSV import/export backend.
- No Smart Form Sync.

## Known Risks

- Built CSS is scoped through PostCSS prefixing. This should be verified visually in wp-admin once the LocalWP database is available.
- The copied shadcn component set is broader than the active UI and should be trimmed later if bundle size matters.
- Lint warnings are development fast-refresh warnings, not production runtime errors.
- Dataset labels intentionally use placeholder Arabic text until TASK-002 fixes verified data and encoding.

## Security Notes

- No telemetry or remote reporting remains in `admin-app/src`.
- No external CDN fonts or assets were added.
- REST bootstrap uses the localized nonce and sends `X-WP-Nonce`.
- No state-changing REST calls were added.

## WooCommerce Safety Notes

- The UI now states that no WooCommerce changes are made.
- WooCommerce inactive state is surfaced from bootstrap.
- All write-like UI actions are local draft only.
- Smart Form Sync is disabled/coming later.

## WordPress.org Compliance Notes

- No licensing/pro locks were added.
- No telemetry, tracking, remote Yaxii calls, provider dispatch, or external assets were added.
- Misleading paid/pro and fake backend-success behavior was avoided.
- Asset enqueue preserves WordPress-generated inline bootstrap data.

## Next Recommended Task

Run a logged-in wp-admin smoke once LocalWP database access is restored. Then continue with TASK-002 Dataset Hardening only after confirming the adapted static admin app renders correctly in wp-admin.

## Commit Hash

Pending commit.
