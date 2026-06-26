# TASK-001I - Tailwind and Scoped CSS Runtime Fix

Date: 2026-06-26

## Goal

Fix Tailwind/shadcn CSS rendering inside the WordPress admin mount while preserving the latest Lovable UI direction and keeping styles scoped to the plugin admin app.

## Root Cause

TASK-001H scoped generated CSS as descendant selectors under `#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app`, for example `.yaxii-shipping-manager-app .min-h-screen`.

The visible app root uses Tailwind utilities on the same element as the scope class:

```tsx
<div className="yaxii-shipping-manager-app min-h-screen bg-background text-foreground">
```

That meant root-level utilities did not match, so the page shell could render without core spacing/background/text utilities. The shadcn/Radix animation utilities were also referenced in components but absent from the generated CSS because `tw-animate-css` was not imported or installed. Finally, Tailwind Preflight was intentionally excluded for wp-admin safety, but the app still needed a small scoped reset for margins, box sizing, form controls, icons, and tables.

## Files Changed

- `admin-app/vite.config.ts`
- `admin-app/src/styles.css`
- `admin-app/package.json`
- `admin-app/package-lock.json`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-CSkpbaxz.js`
- `assets/admin/assets/main-KZElqGRJ.css`
- Removed stale rebuilt assets:
  - `assets/admin/assets/main-DhYq6o1r.js`
  - `assets/admin/assets/main-D7SFVoaB.css`

## Tailwind Config/Style Changes

- Kept Tailwind v4 source scanning with `@source "../src";`.
- Installed and imported `tw-animate-css` so shadcn/Radix classes such as `animate-in`, `animate-out`, `fade-in-0`, `zoom-in-95`, and `slide-in-from-*` exist in the built CSS.
- Updated the PostCSS prefix transform to emit both same-element and descendant selectors for class selectors:
  - Same element: `#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app.min-h-screen`
  - Descendant: `#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app .min-h-screen`

## CSS Scoping Strategy

- Styles remain scoped under `#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app`.
- No global `html`, `body`, `:root`, WordPress admin selector, or unscoped `*` reset was added.
- A small scoped reset was added for the app subtree only:
  - `box-sizing`
  - heading/paragraph margin reset
  - form control font/color/margin reset
  - button cursor behavior
  - image/SVG display
  - table border collapse

## shadcn/Radix Variable Handling

- Theme tokens remain defined on `#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app`.
- Radix portals still resolve through `#yaxii-shipping-manager-admin-portal`, which is rendered inside `.yaxii-shipping-manager-app`, so portal content inherits the same theme variables and scoped utility selectors.
- Animation utilities are now present in the built CSS for dialog, select, popover, tooltip, dropdown, and related Radix components.

## wp-admin Specificity Fixes

- No broad `!important` rules were added.
- The fix relies on higher-specificity scoped selectors and a small scoped reset rather than global Preflight.
- No WordPress admin selectors were targeted.

## What Visual Behavior Should Now Work

- Root app background and foreground color should apply.
- Root app min-height should apply.
- Tailwind spacing, grid/flex utilities, cards, badges, buttons, inputs, tables, and text colors should apply inside the app.
- shadcn/Radix dialogs, selects, popovers, dropdowns, and tooltips should have their animation utility styles available.
- WordPress admin sidebar/topbar/global styling should remain unaffected outside the plugin mount.

## What Remains Mocked/Not Implemented

- Dataset backend is not implemented.
- Settings persistence is not implemented.
- WooCommerce diagnostics backend is not implemented.
- WooCommerce zone reads/writes are not implemented.
- Preview planner and safe apply engine are not implemented.
- CSV backend is not implemented.
- YSF sync remains disabled/coming later only.

## Checks Run/Results

- `npm install tw-animate-css` in `admin-app`: passed with one engine warning for `eslint-visitor-keys` requiring Node `^20.19.0 || ^22.13.0 || >=24`; current Node is `v22.12.0`.
- `npm run typecheck` in `admin-app`: passed.
- `npm run build` in `admin-app`: passed. Vite emitted `assets/admin/.vite/manifest.json`, `assets/admin/assets/main-CSkpbaxz.js`, and `assets/admin/assets/main-KZElqGRJ.css`.
- `npm run lint` in `admin-app`: passed with existing Fast Refresh warnings in shadcn-style component files and `src/main.tsx`; no lint errors.
- Source map check under `assets/admin`: passed; no `.map` files found.
- Built/source forbidden string scan for `__lovable`, `captureException`, `lovable`, `telemetry`, `analytics`, `posthog`, `sentry`, `gtag`, `69 wilayas`, `68 wilayas`, `WooCommerce zones generated`, `applied successfully`, and `Generating WooCommerce zones`: passed; no matches in `admin-app/src` or `assets/admin`.
- Unsafe selector scan for global `body`, `html`, `:root`, unscoped `*`, and wp-admin selectors in `admin-app/src/styles.css` and built CSS: passed; no matches.
- Generated CSS selector check: passed; built CSS contains same-element scoped selectors and shadcn animation output.

## Browser Smoke Checklist

Manual wp-admin verification should confirm:

- Tailwind spacing works across the app shell.
- Cards have border, background, radius, padding, and shadow styling.
- Buttons look like shadcn/Lovable buttons.
- Inputs, selects, dialogs, popovers, and tooltips look correct.
- Top navigation looks correct and does not inherit wp-admin button/link styling.
- The zones table is readable and properly spaced.
- The WordPress admin sidebar/topbar are not visually changed.
- No global WordPress admin page styling changes outside the plugin page.

Browser smoke was not run from this agent turn because authenticated wp-admin browser access is not available here; the required visual checklist is included above for the user-side smoke.

## Known Risks

- `tw-animate-css` adds global `@keyframes`/`@property` at-rules. It does not add global element selectors, but CSS at-rule names are browser-global by nature.
- The same-element selector duplication increases CSS size. It is intentional for root utility compatibility and remains scoped to the plugin mount.
- Lint warnings remain from the imported shadcn component export pattern; they are unrelated to this CSS runtime fix.
- The local Node version is slightly below the engine range requested by one transitive lint package, although install and all checks succeeded.

## Commit Hash

Pending at report creation; final committed hash is recorded in the task closeout response.

## Next Recommended Task

Run a user-visible wp-admin browser smoke for TASK-001I. If the UI is visually correct, continue with the next frontend foundation task or TASK-002 dataset hardening only after confirming the static mount and scoped styling are stable.
