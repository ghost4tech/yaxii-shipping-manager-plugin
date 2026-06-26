# TASK-001E - Runtime Bootstrap Smoke Fix

Date: 2026-06-26

## Goal

Fix the WordPress admin runtime bootstrap so the canonical `admin-app/` receives `window.yaxiiShippingManagerAdmin`, can call the REST bootstrap endpoint, and can render the mock/read-only UI instead of showing the missing bootstrap config error.

## Scope

- Investigated the WordPress admin asset enqueue path.
- Verified the expected frontend global object name is `window.yaxiiShippingManagerAdmin`.
- Verified the React mount target remains `#yaxii-shipping-manager-admin-app`.
- Verified the manifest entry remains `src/main.tsx`.
- Verified the REST route source registration remains `yaxii-shipping-manager/v1/bootstrap`.
- Fixed only the script tag filter that was stripping WordPress inline script output.
- Did not change product behavior or implement backend features.

## Root Cause

`AssetRegistrar::add_module_type()` used the `script_loader_tag` filter to replace the entire script tag HTML with a new `<script type="module">` tag.

In WordPress, the `$tag` passed to `script_loader_tag` includes more than the main script tag. It can already include:

- translations,
- inline scripts registered for `before`,
- the main script tag,
- inline scripts registered for `after`.

The previous implementation discarded that whole `$tag` and returned only the module script. That removed the `wp_add_inline_script( ..., 'before' )` output that defines `window.yaxiiShippingManagerAdmin`, so the new React app loaded but saw no bootstrap config.

## Files Changed

- `src/Admin/AssetRegistrar.php`

## Files Created

- `.agents/progress/yaxii-shipping-manager/TASK-001E-runtime-bootstrap-smoke-fix.md`

## What Was Broken

- The admin app bundle loaded.
- The inline config attached to `yaxii-shipping-manager-admin` was stripped by the module-tag filter.
- `admin-app/src/bootstrap.ts` correctly looked for `window.yaxiiShippingManagerAdmin`, but the global was absent at runtime.
- The app therefore rendered: `Admin app could not load` / `Missing Yaxii Shipping Manager bootstrap config.`

## What Changed

`AssetRegistrar::add_module_type()` now preserves the full WordPress-generated `$tag` and modifies only the main script tag with ID `yaxii-shipping-manager-admin-js`.

This keeps the inline-before config in place while still adding `type="module"` to the Vite entry bundle.

## Runtime Verification Result

Full authenticated browser smoke could not be completed from this session because the admin page request without cookies returns the WordPress login screen.

Verification performed:

- `Invoke-WebRequest http://yaxii-ysz.local/wp-admin/admin.php?page=yaxii-shipping-manager` returned HTTP `200`, but the content was the login page and did not include the plugin admin root or app assets.
- WP-CLI runtime checks were blocked by `Error establishing a database connection`, so WP-CLI could not render the admin page or call the route with an authenticated session.
- Source verification confirmed the plugin admin page still renders `<div id="yaxii-shipping-manager-admin-app">`.
- Source verification confirmed `admin-app/src/main.tsx` mounts to `yaxii-shipping-manager-admin-app`.
- Source verification confirmed `admin-app/src/bootstrap.ts` reads `window.yaxiiShippingManagerAdmin` and sends `X-WP-Nonce`.
- WordPress core source inspection confirmed `script_loader_tag` receives inline-before script output inside `$tag`, which explains the missing config.
- Regex simulation confirmed the fixed filter preserves the inline config script and only changes the main script tag to `type="module"`.

## REST Bootstrap Result

- Source verification confirmed `Routes::NAMESPACE` is `yaxii-shipping-manager/v1`.
- Source verification confirmed `/bootstrap` is registered on `rest_api_init`.
- Unauthenticated request to `http://yaxii-ysz.local/wp-json/yaxii-shipping-manager/v1/bootstrap` returned HTTP `401 Unauthorized`, which confirms the route exists and is permission-protected.
- Authenticated REST success could not be verified from this session because no authenticated browser/session cookie was available.

## What Remains Mocked

- Dataset data remains local mock data in `admin-app/`.
- Shipping Zones editing remains local UI state only.
- Diagnostics and Checkout Protection remain local simulators only.
- Import/export remains mock UI only.
- Settings remain local UI state only.
- Smart Form Sync remains disabled/coming-later only.
- No WooCommerce zone reads/writes, diagnostics backend, preview planner, safe apply engine, CSV backend, provider imports, or YSF sync were implemented.

## Security Notes

- The fix preserves WordPress asset APIs and does not echo custom scripts manually.
- Inline config still uses `wp_add_inline_script()` and `wp_json_encode()`.
- REST bootstrap still uses the existing permission callback.
- The frontend still uses same-origin REST with `X-WP-Nonce`.
- No telemetry, external CDN assets, remote calls, or destructive actions were added.

## WooCommerce Safety Notes

- No WooCommerce APIs were added.
- No store shipping configuration is read or written.
- No preview/apply behavior was introduced.

## WordPress.org Compliance Notes

- No licensing, pro locks, upsells, telemetry, obfuscation, or external dependencies were added.
- Assets remain local.
- The fix is limited to preserving WordPress-generated inline config while loading the local module bundle.

## Checks Run

- `php -l src\Admin\AssetRegistrar.php`
- `Get-ChildItem -Recurse assets\admin -Filter *.map`
- `Invoke-WebRequest -UseBasicParsing -Uri "http://yaxii-ysz.local/wp-admin/admin.php?page=yaxii-shipping-manager"`
- `Invoke-WebRequest -UseBasicParsing -Uri "http://yaxii-ysz.local/wp-json/yaxii-shipping-manager/v1/bootstrap"`
- `wp --path="C:\Users\Aymen\Local Sites\yaxii-ysz\app\public" option get siteurl`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- `php -l`: passed.
- Source map check: passed; no `.map` files found under `assets/admin/`.
- Admin page HTTP check: returned login page, so authenticated UI rendering could not be confirmed from this session.
- REST endpoint HTTP check: returned `401 Unauthorized`, confirming route presence and permission protection.
- WP-CLI site check: blocked by `Error establishing a database connection`.
- `git diff --check`: passed.
- `git status --short --untracked-files=all`: passed; showed expected task changes plus pre-existing untracked `.agents/references/lovable-admin-v2/` files, which were intentionally left unstaged.
- `admin-app` typecheck/build: not run because no frontend source or built assets changed.

## Known Risks

- The exact authenticated wp-admin visual smoke still needs to be confirmed in a browser session that is logged into WordPress.
- WP-CLI cannot currently connect to the database from this shell, even though the local site responds over HTTP.
- The fix relies on matching the WordPress-generated main script tag by ID, which is stable for the enqueued handle.

## Blockers

- Authenticated browser smoke was not possible from this session because the direct admin request returned the login screen and no authenticated browser connector was available.
- WP-CLI verification was blocked by a database connection error.

## Next Recommended Task

Open the Yaxii Shipping Manager admin page in an authenticated browser session and confirm:

- the missing bootstrap config error is gone,
- the mock/read-only UI renders,
- hash tab navigation works,
- REST bootstrap succeeds with the localized nonce,
- no obvious wp-admin style conflict appears.

After that runtime smoke passes, continue with TASK-002 dataset hardening.

## Commit Hash

Committed after final checks; final immutable hash is recorded in the task closeout response.
