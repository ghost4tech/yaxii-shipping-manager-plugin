# TASK-001 Plugin Foundation + React Mount

Date: 2026-06-26

## Goal

Create the first WordPress plugin foundation for Yaxii Shipping Manager and mount the existing React prototype inside a WordPress admin page using local built assets.

## Scope

Completed foundation-only work:

- Main WordPress plugin file and constants.
- PSR-4 PHP source structure under `src/`.
- Admin page registration with WooCommerce active/inactive placement.
- Local Vite admin asset enqueue, scoped to the plugin admin page.
- Read-only REST bootstrap endpoint at `yaxii-shipping-manager/v1/bootstrap`.
- WordPress admin React entry using hash routing.
- Lovable error reporting disabled in the prototype source.

Explicitly not implemented:

- WooCommerce shipping-zone reads or writes.
- WooCommerce diagnostics.
- Preview planner.
- Safe apply engine.
- CSV backend.
- YSF sync.
- Provider imports.
- Licensing, telemetry, remote Yaxii calls, or Pro logic.

## Files Changed

- `app/package.json`
- `app/package-lock.json`
- `app/src/lib/lovable-error-reporting.ts`
- `app/src/router.tsx`
- `app/tsconfig.json`

## Files Created

- `yaxii-shipping-manager.php`
- `composer.json`
- `src/Plugin.php`
- `src/Admin/AdminPage.php`
- `src/Admin/AssetRegistrar.php`
- `src/Rest/Routes.php`
- `src/Rest/BootstrapController.php`
- `src/Support/Capabilities.php`
- `src/Support/JsonResponse.php`
- `app/vite.wp-admin.config.ts`
- `app/src/wp-admin-bootstrap.ts`
- `app/src/wp-admin-main.tsx`
- `.gitattributes`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/styles-DrrTE0kH.css`
- `assets/admin/assets/wp-admin-main-DNqvkEQ4.js`
- `.agents/progress/yaxii-shipping-manager/TASK-001-plugin-foundation-react-mount.md`

## What Was Before

The repository contained the normalized prototype app under `app/`, product docs, and agent harness files. There was no WordPress plugin bootstrap, no PHP source tree, no REST route, no admin page, and no local WordPress-ready React build output.

The prototype build was still TanStack Start/Lovable oriented and depended on SSR/server assumptions unsuitable for direct wp-admin runtime use.

## What Changed

The plugin now has a valid WordPress entry file with plugin headers, GPL-compatible license metadata, constants, a Composer PSR-4 mapping, and a fallback local autoloader so the plugin can load even without committed `vendor/`.

The PHP bootstrap now registers hooks through `Yaxii\ShippingManager\Plugin`, keeps WooCommerce detection guarded, registers a single admin page, enqueues built assets only on that page, and registers a read-only REST bootstrap endpoint.

The React prototype now has a separate `build:wp-admin` Vite config that outputs static assets to `assets/admin/`. The WordPress admin entry uses hash routing and fetches the real REST bootstrap endpoint while leaving the prototype screens mocked.

Lovable error capture is disabled by turning `reportLovableError()` into a local no-op.

## What Still Remains Mocked

- Dashboard status cards still use prototype mock data.
- Dataset, wilaya, commune, diagnostics, preview, import/export, products, YSF sync, and automation screens remain prototype/mock UI.
- Feature flags in the real bootstrap endpoint are all `false`.
- Dataset status in the real bootstrap endpoint is all unavailable.
- No WooCommerce shipping-zone state is read or written.

## REST Endpoint Added

- Namespace: `yaxii-shipping-manager/v1`
- Route: `GET /bootstrap`
- Permission callback: real capability check.
- Capability when WooCommerce is active: `manage_woocommerce`.
- Capability when WooCommerce is inactive: `manage_options`.

The endpoint returns plugin version, REST namespace, REST URL, REST nonce, capability booleans, WooCommerce active state, admin URLs, disabled feature flags, and unavailable dataset status flags.

## Admin Page Behavior

When WooCommerce is active, the page is registered under the WooCommerce menu:

- Page title: `Yaxii Shipping Manager`
- Menu title: `Yaxii Shipping`
- Capability: `manage_woocommerce`

When WooCommerce is inactive, the page is registered under Tools:

- Page title: `Yaxii Shipping Manager`
- Menu title: `Yaxii Shipping`
- Capability: `manage_options`

The page renders the React root div and a no-JS fallback. The inactive state also renders a scoped warning notice on the plugin page.

## WooCommerce Inactive Behavior

WooCommerce inactive state does not fatal. The plugin does not call WooCommerce APIs before checking availability. The admin app can still load from Tools, and the bootstrap payload reports `woocommerceActive: false`.

## Security Notes

- Direct access guards were added to PHP files.
- REST route uses `register_rest_route()` with a real `permission_callback`.
- No writing REST endpoint exists.
- Admin page output is escaped.
- Inline JavaScript config is emitted through `wp_add_inline_script()` with `wp_json_encode()`.
- No direct `$_GET`, `$_POST`, or `$_REQUEST` access was added.
- No SQL was added.

## WooCommerce Safety Notes

- WooCommerce is only detected through guarded availability checks.
- No WooCommerce shipping APIs are called in this task.
- No zone creation, update, deletion, diagnostics, preview, or apply behavior was implemented.

## WordPress.org Compliance Notes

- Main plugin file includes `License: GPL-2.0-or-later` and GPL license URI.
- Assets are built locally and loaded from the plugin package.
- No external CDN assets were added.
- No telemetry, tracking, licensing, remote Yaxii API calls, or Pro locks were added.
- `app/node_modules/`, `vendor/`, and `app/.git-prototype-backup/` remain ignored and untracked.
- No source maps were generated in `assets/admin/`.

## Checks Run

- `composer dump-autoload`
- `php -l` on all changed PHP files.
- `npm install` because `app/node_modules/` was missing and a local Vite build was required.
- `npm run typecheck`
- `npm run build:wp-admin`
- `npm run lint`
- `npx eslint src/wp-admin-main.tsx src/wp-admin-bootstrap.ts src/router.tsx src/lib/lovable-error-reporting.ts vite.wp-admin.config.ts`
- Source map check under `assets/admin/`
- Ignored-directory check for `app/node_modules/`, `vendor/`, and `app/.git-prototype-backup/`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- `composer dump-autoload`: passed.
- `php -l`: passed for all changed PHP files.
- `npm install`: passed with engine/deprecation warnings from existing dependencies; npm reported zero vulnerabilities.
- `npm run typecheck`: passed.
- `npm run build:wp-admin`: passed and generated local admin assets. Vite warned that the JS chunk is larger than 500 kB.
- `npm run lint`: failed on pre-existing CRLF/Prettier issues across the prototype source tree.
- Focused `npx eslint` on files changed/created for this task: passed.
- Source map check: passed; no `.map` files found under `assets/admin/`.
- Ignored-directory check: passed; `app/node_modules/`, `vendor/`, and `app/.git-prototype-backup/` are ignored.
- Final `git diff --check`: passed. Git printed line-ending normalization warnings for app files touched by this task. A narrow `.gitattributes` rule excludes generated admin JS bundles from whitespace checks because the Vite output contains whitespace-only lines inside generated template literals.
- Final `git status --short --untracked-files=all`: showed only task-related modified and untracked files before staging.

## Risks

- The mounted React bundle is still the full prototype and is large for an admin screen.
- Existing prototype screens still contain scope-creep UI such as Pro/product/automation concepts.
- The repo-wide lint command is not clean because the imported prototype has line-ending/Prettier drift.
- The REST bootstrap endpoint proves the bridge but does not yet expose real dataset or WooCommerce state.
- Runtime WordPress activation was not smoke-tested through WP-CLI to avoid changing the local site database during this foundation task.

## Blockers

No blocker stopped the foundation implementation. The repo-wide lint failure should be normalized in a separate tooling/formatting task, not mixed into this product foundation task.

## Next Recommended Task

TASK-002 Dataset hardening.

## Commit Hash

This report is included in the task commit. The exact commit hash is recorded in the final response after commit creation.
