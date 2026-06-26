# TASK-001B Admin App Stabilization + MVP Scope Pruning

Date: 2026-06-26

## Goal

Stabilize the React admin app inside WordPress admin before adding real dataset or WooCommerce logic.

## Scope

This was a foundation-hardening task. It changed only the WordPress admin React build path and generated local admin assets.

No dataset backend, WooCommerce diagnostics, WooCommerce zone reads/writes, preview planner backend, safe apply engine, CSV backend, YSF sync implementation, provider import, licensing, Pro lock, telemetry, remote call, or PHP behavior was added.

## Files Changed

- `app/src/wp-admin-main.tsx`
- `app/vite.wp-admin.config.ts`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/*`

## Files Created

- `app/src/wp-admin-app.tsx`
- `app/src/wp-admin-styles.css`
- `app/src/wp-admin-screens/Dashboard.tsx`
- `app/src/wp-admin-screens/Wizard.tsx`
- `app/src/wp-admin-screens/ShippingManager.tsx`
- `app/src/wp-admin-screens/Preview.tsx`
- `app/src/wp-admin-screens/Diagnostics.tsx`
- `app/src/wp-admin-screens/ImportExport.tsx`
- `app/src/wp-admin-screens/YsfSync.tsx`
- `app/src/wp-admin-screens/Settings.tsx`
- `app/src/wp-admin-screens/shared.tsx`
- `.agents/progress/yaxii-shipping-manager/TASK-001B-admin-app-stabilization-scope-pruning.md`

## What Was Laggy/Conflicting Before

The TASK-001 WordPress admin entry imported `@tanstack/react-router`, `getRouter()`, and `routeTree.gen.ts`. The generated route tree eagerly imported every prototype route, including products and automations. That pulled the full prototype sidebar, Pro gating, multi-country switcher, TanStack route root, broad shadcn/Radix surface, and global Tailwind stylesheet into wp-admin.

The TASK-001 build output was:

- Entry JS: `600.49 kB`
- CSS: `94.54 kB`

The old stylesheet came from `app/src/styles.css`, which included global Tailwind/base rules for `html`, `body`, and broad selectors. That was unsafe inside wp-admin.

## What Changed

The WordPress admin mount now uses a dedicated lightweight hash-router shell in `app/src/wp-admin-app.tsx`. It does not import the TanStack generated route tree and does not import `app/src/styles.css`.

The app still fetches the real REST bootstrap before showing the admin UI. Loading and failure states are explicit and lightweight. A failed bootstrap shows an error state instead of rendering a fake successful admin app.

The Vite wp-admin build now uses only `@vitejs/plugin-react`; Tailwind and tsconfig-path plugins were removed from this build config because the new wp-admin entry does not need them.

## Routes Kept

The mounted wp-admin app exposes these hash routes:

- `/` Dashboard
- `/wizard` Wizard
- `/manager` Shipping Manager
- `/preview` Preview
- `/diagnostics` Diagnostics
- `/import-export` Import/Export
- `/ysf-sync` YSF Sync as coming-later only
- `/settings` Settings

## Routes Removed/Hidden

The mounted wp-admin app no longer exposes these prototype routes:

- `/products`
- `/automations`
- Pro/plan gate routes or unlock behavior
- Multi-country switcher behavior

Unknown hashes, including hidden prototype paths, render a "Not available in the free MVP" fallback and link back to the dashboard.

The original prototype route files remain in `app/src/routes/` for later migration safety, but they are not imported by the WordPress admin build.

## Style Containment Approach

The wp-admin build now imports `app/src/wp-admin-styles.css` instead of the prototype Tailwind stylesheet.

All admin app CSS is scoped under:

- `#yaxii-shipping-manager-admin-app`
- `.ysm-admin-app`

No `html`, `body`, `:root`, `@tailwind`, `@layer`, or global reset rules are used in the new wp-admin stylesheet. The only universal selector is scoped to `.ysm-admin-app` for `box-sizing`.

Plugin assets are still enqueued only on the plugin admin page by the existing TASK-001 PHP asset registrar.

## Bundle Size Before/After

TASK-001 build:

- Entry JS: `600.49 kB`
- CSS: `94.54 kB`

TASK-001B build:

- Entry JS: `200.97 kB`
- Total JS across entry and lazy chunks: `217,728 bytes`
- CSS: `10,173 bytes`
- Lazy route chunks: Dashboard, Wizard, Shipping Manager, Preview, Diagnostics, Import/Export, YSF Sync, Settings

No source maps were generated.

## What Remains Mocked

- Dashboard metrics still use isolated mock data.
- Wizard selection remains UI-only.
- Shipping Manager table remains UI-only.
- Preview remains a read-only placeholder and has no apply button.
- Diagnostics remain mock checks and do not read WooCommerce.
- Import/Export does not parse, validate, save, or export files.
- Settings are not persisted.
- YSF Sync is informational/coming-later only.

## Checks Run / Results

- `npm run typecheck`: passed.
- `npm run build:wp-admin`: passed.
- Focused lint: `npx eslint src/wp-admin-main.tsx src/wp-admin-app.tsx src/wp-admin-bootstrap.ts src/wp-admin-screens/*.tsx vite.wp-admin.config.ts`: passed.
- Source map check under `assets/admin/`: passed, no `.map` files found.
- Runtime-scope grep for Pro/product/automation/multi-country/TanStack route imports in the new wp-admin source and generated assets: passed.
- `php -l`: not run because no PHP files changed.
- `git diff --check`: passed; Git emitted LF-to-CRLF working-copy warnings for changed text files.
- `git status --short --untracked-files=all`: showed only expected TASK-001B source, asset, and report changes before staging.

Repo-wide `npm run lint` was not required for this task because TASK-001 documented existing CRLF/Prettier noise across the imported prototype.

## Known Risks

- React and React DOM are still bundled locally into the admin asset, so the entry is smaller but not minimal.
- The old Lovable/TanStack prototype source still exists in the repository for migration, including out-of-scope screens, but it is no longer part of the wp-admin build.
- The mock dataset source still contains wording/data issues already planned for dataset hardening.
- Runtime was not browser-smoked inside wp-admin in this task; verification was build/static focused.

## Security / WordPress.org Notes

- No remote calls were added.
- No telemetry was added.
- No Pro locks, product marketplace, or upgrade path exists in the mounted wp-admin app.
- No WooCommerce write path exists.
- Bootstrap still uses the existing REST nonce/capability-protected endpoint from TASK-001.
- CSS is scoped to the plugin mount and does not reset wp-admin globally.

## Next Recommended Task

TASK-002 Dataset hardening.

## Commit Hash

This report is included in the task commit. The exact commit hash is recorded in the final response after commit creation.
