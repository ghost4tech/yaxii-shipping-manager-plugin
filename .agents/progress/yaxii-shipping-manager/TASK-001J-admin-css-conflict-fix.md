# TASK-001J - Admin CSS Conflict Fix

Date: 2026-06-26

## Goal

Fix the remaining WordPress admin styling conflict after TASK-001I where the app still showed native/wp-admin-looking black borders, boxed tabs, default button chrome, and oversized inputs despite Tailwind utilities being generated.

## Scope

Frontend CSS/runtime foundation only. No product features, backend endpoints, WooCommerce reads/writes, dataset work, settings persistence, telemetry, remote calls, or UI redesign were added.

## Files Changed

- `admin-app/src/styles.css`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-B9zjV8TX.css`
- `assets/admin/assets/main-Brw6ZjQB.js`
- Removed stale rebuilt assets:
  - `assets/admin/assets/main-KZElqGRJ.css`
  - `assets/admin/assets/main-CSkpbaxz.js`

## Files Created

- `.agents/progress/yaxii-shipping-manager/TASK-001J-admin-css-conflict-fix.md`

## What Was Before

TASK-001I fixed root utility matching and restored shadcn animation utilities, but Tailwind theme/utilities were still imported into CSS cascade layers:

```css
@import "tailwindcss/theme" layer(theme) source(none);
@import "tailwindcss/utilities" layer(utilities) source(none);
```

In wp-admin, WordPress styles are unlayered author CSS. Unlayered WordPress admin rules can outrank layered Tailwind utilities regardless of selector specificity. That allowed native/wp-admin `button`, `input`, and table border styles to show through.

The custom scoped reset also missed key Tailwind Preflight-equivalent defaults:

- `border-width: 0`
- `border-style: solid`
- default token border color
- form-control `background-image`
- form-control `box-shadow`
- form-control `min-height`

## What Changed

- Removed Tailwind `layer(theme)` and `layer(utilities)` import wrapping for the WordPress admin build.
- Kept all Tailwind/shadcn CSS scoped through the existing PostCSS prefix strategy.
- Added scoped Preflight-equivalent defaults under `#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app`:
  - `border-color: var(--border)`
  - `border-style: solid`
  - `border-width: 0`
  - form control transparent background reset
  - form control `box-shadow: none`
  - form control `min-height: 0`
  - form control inherited font/color/line-height
- Rebuilt `assets/admin/`.

## What Still Remains Mocked

- Dataset backend is not implemented.
- Settings persistence is not implemented.
- WooCommerce diagnostics backend is not implemented.
- WooCommerce zone reads/writes are not implemented.
- Preview planner and safe apply engine are not implemented.
- CSV backend is not implemented.
- YSF sync remains disabled/coming later only.

## Security Notes

- No PHP or REST code changed.
- No new remote calls, telemetry, tracking, external CDN assets, or credentials were added.
- Temporary smoke testing used a local server and local mocked bootstrap only.

## WooCommerce Safety Notes

- No WooCommerce reads or writes were added.
- The UI still states that no WooCommerce changes are made yet.

## WordPress.org Compliance Notes

- The fix keeps CSS scoped to the plugin mount.
- No global `html`, `body`, `:root`, unscoped `*`, wp-admin selector overrides, telemetry, or external assets were added.
- Built source maps remain disabled.

## Checks Run

- `npm run typecheck` in `admin-app`
- `npm run build` in `admin-app`
- `npm run lint` in `admin-app`
- Source map scan under `assets/admin`
- Forbidden string scan in `admin-app/src` and `assets/admin`
- Unsafe global selector scan in `admin-app/src/styles.css` and built CSS
- Built CSS cascade-layer scan for `@layer theme`, `@layer base`, `@layer components`, and `@layer utilities`
- `git diff --check`
- `git status --short --untracked-files=all`
- Browser smoke with `agent-browser` against a temporary local WordPress-like CSS harness

## Check Results

- TypeScript: passed.
- Build: passed. Manifest now points to:
  - JS: `assets/main-Brw6ZjQB.js`
  - CSS: `assets/main-B9zjV8TX.css`
- Lint: passed with the same existing Fast Refresh warnings in shadcn-style component files and `src/main.tsx`; no lint errors.
- Source maps: passed; none found under `assets/admin`.
- Forbidden strings: passed; no matches for Lovable telemetry/tracking or forbidden product wording.
- Unsafe selector scan: passed; no global `body`, `html`, `:root`, unscoped `*`, or wp-admin selector overrides found.
- Built CSS layer scan: passed; no `@layer theme`, `@layer base`, `@layer components`, or `@layer utilities` wrapping remains in built app CSS.
- `git diff --check`: passed.
- Browser smoke: passed in the temporary local harness.

## Browser Smoke Evidence

The temporary smoke harness loaded the actual built JS/CSS with intentionally hostile WordPress-like CSS for `button`, `input`, `table`, `tr`, `td`, and `th`.

Computed-style checks confirmed:

- App rendered: `true`
- Hostile black borders still applied: `false`
- Hostile form chrome still applied: `false`
- Launch button background: `oklch(0.52 0.19 277)`
- Launch button height: `36px`
- Input height: `32px`
- Card/table borders: token border color, `1px`, not black `3px`

Screenshot was captured at:

`C:\Users\Aymen\AppData\Local\Temp\ysm-css-smoke-fixed.png`

## Known Risks

- The smoke harness is not the real authenticated wp-admin page, but it deliberately reproduced the kind of unlayered WordPress admin CSS conflict shown in the user's screenshot.
- `tw-animate-css` still emits global `@keyframes`/`@property` at-rules; no global selectors are added by this task.
- Fast Refresh lint warnings remain from the imported shadcn component export pattern.

## Blockers

None for this CSS/runtime fix.

## Next Recommended Task

Verify the plugin page in the real logged-in wp-admin screen. If it now matches the smoke result, continue with the next planned frontend foundation or TASK-002 dataset hardening only after the mount and styling are accepted.

## Commit Hash

Pending at report creation; final commit hash is recorded in the closeout response.
