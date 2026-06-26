# TASK-001G - Latest Admin App Source Audit

Date: 2026-06-26

## Goal

Audit the current `admin-app/` source after the latest Lovable replacement and decide what is usable, what violates the project rules, what breaks WordPress admin compatibility, and what must be fixed before implementation continues.

This was audit-only. No product code, PHP, REST endpoint, build output, old `app/`, `.agents/references/lovable-admin-v2/`, or `app/.git-prototype-backup/` was intentionally modified by this task.

## Scope

Audited:

- Repository state and dirty working tree.
- `admin-app/` source, package/config files, and generated-source shape.
- WordPress admin mount compatibility.
- Product scope against `docs/PRD.md`.
- Code quality using `clean-code-guard`.
- WordPress/WooCommerce safety using `wp-guard`, `wp-plugin-development`, `wp-rest-api`, and `woo-guard`.
- WordPress.org compliance using `wp-plugin-directory-guidelines`.
- Report accuracy using `docs-guard`.
- Build/bootstrap expectations against `src/Admin/AssetRegistrar.php` and `assets/admin/.vite/manifest.json`.

Not audited as frontend source:

- `app/`, except to confirm it still exists and was not touched in this task.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git repository: yes.
- Starting branch before switch: `task/001f-faithful-candidate-ui-port`
- Current branch: `task/001g-latest-admin-app-source-audit`
- Nested `admin-app/.git`: not present.
- Nested `app/.git`: not present.
- Preserved `app/.git-prototype-backup`: present.
- Preserved `.agents/references/lovable-admin-v2/`: present.
- Old `app/`: present and not shown in `git status`.

Pre-report status showed the latest admin source replacement plus unrelated dirty files:

- Deleted tracked prior admin app files such as `admin-app/src/main.tsx`, `admin-app/src/bootstrap.ts`, `admin-app/src/App.tsx`, screen modules, simple components, `admin-app/src/types.ts`, and `admin-app/package-lock.json`.
- Added new Lovable/TanStack files such as `admin-app/AGENTS.md`, `bun.lock`, `bunfig.toml`, `components.json`, `eslint.config.js`, `src/server.ts`, `src/start.ts`, `src/router.tsx`, `src/routeTree.gen.ts`, `src/routes/*`, `src/lib/*`, and many `src/components/ui/*` files.
- Modified `admin-app/package.json`, `admin-app/vite.config.ts`, `admin-app/tsconfig.json`, `admin-app/src/styles.css`, `assets/admin/.vite/manifest.json`, and `src/Admin/AssetRegistrar.php`.
- Deleted `.agents/progress/yaxii-shipping-manager/TASK-001E-runtime-bootstrap-smoke-fix.md` in the working tree. I read the report from `HEAD` for context and did not restore it.

## Repository State Findings

- `admin-app/` has been replaced. Evidence: package name changed from `yaxii-shipping-manager-admin-app` to `tanstack_start_ts`, the static Vite entry files are deleted, and new Lovable/TanStack Start files are present.
- `admin-app/package.json` exists.
- `admin-app/package-lock.json` is deleted; `admin-app/bun.lock` and `bunfig.toml` are present. The package manager is now effectively Bun-oriented, while scripts are generic npm/Vite commands.
- `admin-app` has no Git metadata.
- Old `app/` still exists and was untouched by this audit.
- Build output in `assets/admin/` is stale/out of sync with source. The manifest points to `src/main.tsx`, but `admin-app/src/main.tsx` is absent. The generated bundle contains strings from the earlier static canonical app, while current `admin-app/` source is TanStack Start/Lovable-shaped.

## App Technical Inventory

### Framework

- React `^19.2.0`.
- TypeScript.
- TanStack Router.
- TanStack Start.
- TanStack React Query.

### Package Manager

- `bun.lock` and `bunfig.toml` exist.
- `package-lock.json` is deleted.
- No committed npm lock remains for `admin-app/`.

### Build Tool

- Vite `^8.0.16`.
- `@lovable.dev/vite-tanstack-config` `^2.6.2`.
- `vite.config.ts` now delegates to Lovable's TanStack config and redirects the server entry to `src/server.ts`.
- The previous static WordPress build config was removed from `admin-app/vite.config.ts`.

### React and TypeScript

- React and React DOM are `^19.2.0`.
- TypeScript is `^5.8.3`.
- `tsconfig.json` includes `src/**/*.ts`, `src/**/*.tsx`, `vite.config.ts`, and `eslint.config.js`.
- `strict` is enabled.
- `noUnusedLocals` and `noUnusedParameters` are disabled, which makes the large template import surface harder to police.
- No `typecheck` package script exists.

### Routing

- TanStack file routing through `src/routes/__root.tsx`, `src/routes/index.tsx`, and `src/routeTree.gen.ts`.
- The visible app tabs are local React state inside `src/routes/index.tsx`.
- There is no hash synchronization for wp-admin deep links.
- Route assumptions are page-root assumptions, not `wp-admin/admin.php?page=yaxii-shipping-manager` assumptions.

### UI Library

- shadcn-style local UI components under `admin-app/src/components/ui/`.
- Radix UI primitives.
- Lucide React icons.
- Tailwind CSS 4.
- `class-variance-authority`, `clsx`, and `tailwind-merge`.

### HeroUI

- No HeroUI dependency or imports were found.

### Styling

- Tailwind CSS 4 with `@import "tailwindcss" source(none)`.
- `tw-animate-css`.
- Global design tokens in `:root` and `.dark`.
- Global base layer rules for `*` and `body`.
- Current source styling is not scoped to `#yaxii-shipping-manager-admin-app`.

### Main Entry Files Present

- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/router.tsx`
- `src/routeTree.gen.ts`
- `src/server.ts`
- `src/start.ts`
- `src/styles.css`

### Main Entry Files Missing

- `src/main.tsx`
- `src/bootstrap.ts`
- `src/App.tsx`

These missing files are a blocker because the PHP manifest contract still expects `src/main.tsx`.

### Mock Data Locations

Mock data is concentrated in `admin-app/src/routes/index.tsx`:

- `DEFAULT_METHOD_DEFS`
- `SEED`
- `INITIAL_WILAYAS`
- `WILAYA_58`
- `WILAYA_EXTRA_69`
- local tab state
- wizard draft rows
- local diagnostics generated by `setTimeout`
- local apply/generate success state
- local settings controls

The source also contains mojibake in French and Arabic names, for example `BÃ©jaÃ¯a` and Arabic text rendered as mojibake. This cannot be treated as product-grade dataset source.

### Component Structure

- One monolithic route file: `admin-app/src/routes/index.tsx` is 1274 lines.
- Large unused template components remain, including `sidebar.tsx` at 691 lines, `chart.tsx` at 296 lines, `carousel.tsx` at 211 lines, and `menubar.tsx` at 211 lines.
- Most product UI, mock data, state, and workflows live in one file.

### Screens Present

- Shipping Zones.
- Generator.
- Diagnostics / Checkout Protection.
- Import / Export.
- Settings.
- Smart Form Sync.
- Advanced / Roadmap.

### Package Scripts

- `dev`: `vite dev`
- `build`: `vite build`
- `build:dev`: `vite build --mode development`
- `preview`: `vite preview`
- `lint`: `eslint .`
- `format`: `prettier --write .`

Missing for this project:

- `typecheck`
- `build:wp-admin`
- any script proving a static WordPress admin bundle.

### External Dependencies

Major dependencies include:

- `@lovable.dev/vite-tanstack-config`
- `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-query`
- many `@radix-ui/*` primitives
- Tailwind 4 and `tw-animate-css`
- `lucide-react`
- `recharts`
- `react-hook-form`
- `zod`
- `react-day-picker`
- `embla-carousel-react`
- `vaul`
- `sonner`
- `input-otp`
- `cmdk`

Unused or currently unjustified heavy dependencies/components include charting, carousel, calendar, command palette, sidebar, input OTP, resizable panels, drawer, hover card, menubar, navigation menu, pagination, `react-hook-form`, `zod`, `sonner`, and `vaul`.

### SSR / TanStack Start Assumptions

Yes. The app assumes TanStack Start and SSR:

- `vite.config.ts` configures `tanstackStart`.
- `src/server.ts` imports `@tanstack/react-start/server-entry`.
- `src/start.ts` imports `createStart` and `createMiddleware`.
- `src/routes/__root.tsx` renders `<html>`, `<head>`, `<body>`, `<HeadContent />`, and `<Scripts />`.

### Static WordPress Admin Bundle Feasibility

Feasible only after adaptation. As-is, the current source cannot directly replace the previous static WordPress admin source because it lacks `src/main.tsx`, uses server entries, uses document shell ownership, and does not fetch the WordPress bootstrap config.

## WordPress Admin Compatibility Findings

### Must Fix: Missing WordPress Entry

`admin-app/src/main.tsx` is absent, but `src/Admin/AssetRegistrar.php` still expects manifest key `src/main.tsx`, and `assets/admin/.vite/manifest.json` still declares `src/main.tsx`.

Impact: the source and manifest cannot be trusted as a reproducible WordPress admin build.

### Must Fix: Missing Bootstrap Client

The previous `admin-app/src/bootstrap.ts` is deleted. The current `admin-app/src` has no source reference to:

- `window.yaxiiShippingManagerAdmin`
- `GET yaxii-shipping-manager/v1/bootstrap`
- `X-WP-Nonce`

Impact: current source does not consume the REST bootstrap contract, does not use the localized nonce, and does not know WooCommerce/capability state from WordPress.

### Must Fix: Regressed AssetRegistrar Inline Script Preservation

`src/Admin/AssetRegistrar.php` now returns a brand-new script tag in `add_module_type()` instead of preserving WordPress's full `$tag`. TASK-001E fixed this exact issue because replacing `$tag` strips inline-before scripts and removes `window.yaxiiShippingManagerAdmin`.

Evidence:

- `src/Admin/AssetRegistrar.php:70-72` adds `window.yaxiiShippingManagerAdmin`.
- `src/Admin/AssetRegistrar.php:80-85` replaces the whole script tag.

Impact: if this PHP change remains, the missing bootstrap config runtime error can return.

### Must Fix: Document Shell Assumptions

`admin-app/src/routes/__root.tsx:104-112` renders `<html>`, `<head>`, `<body>`, `<HeadContent />`, and `<Scripts />`.

Impact: this cannot mount inside an existing WordPress admin page as-is.

### Must Fix: Server Entry Files

`admin-app/src/server.ts` and `admin-app/src/start.ts` are TanStack Start server runtime files.

Impact: this is not the plain static Vite app required by the architecture docs.

### Must Fix: Global CSS Leakage

`admin-app/src/styles.css` defines:

- `:root` at line 64.
- `@layer base` at line 135.
- `*` at line 136.
- `body` at line 140.

Impact: importing this stylesheet in wp-admin can alter WordPress admin body/background/text and broad element borders outside the plugin mount.

### Must Fix: Routing Is Not wp-admin Safe Yet

The app uses TanStack route `/` and local tab state. It does not use hash routing or the previous lightweight hash route map.

Impact: deep linking and navigation must be adapted for `wp-admin/admin.php?page=yaxii-shipping-manager`.

### External Assets

No runtime external CDN font/script asset was found in `admin-app/src`.

Caveat: `admin-app/AGENTS.md` and `components.json` contain external documentation/schema links, and the build tool depends on Lovable packages. These are not runtime CDN assets, but they are distribution/tooling risk and should be removed or justified for WordPress.org packaging.

## Product Scope Findings

| Visible area | Classification | Finding |
| --- | --- | --- |
| Shipping Zones | Free MVP | Directionally good, but currently local mock state and claims to manage WooCommerce zones. Needs copy and behavior reset to local draft/preview-only until backend exists. |
| Generator / setup wizard | Free MVP | Good visual direction, but unsafe as written because it ends with fake generation/apply success. |
| Diagnostics / Checkout Protection | Free MVP | Required screen exists, but results are simulated from local state and hardcode `WooCommerce 8.x active`. Must not imply real diagnostics. |
| Import / Export | Free MVP for CSV | UI exists, but includes JSON import/export, which is not in MVP. JSON should be hidden unless explicitly scoped. |
| Settings | Free MVP | Basic safety controls exist, but they are local-only and contain unverified dataset labels. |
| Smart Form Sync | Coming later | Acceptable only if disabled/informational. Copy should avoid implying actual sync behavior exists. |
| Advanced / Roadmap | Remove/hide | Runtime navigation includes provider imports, scheduled price changes, backup/restore, commune-level pricing, and multi-store presets. This should not ship in first MVP UI. |
| Provider price imports | Coming later / hide | Mentioned under Advanced with Yalidine, ZR Express, and Maystro. It is roadmap-only and should be hidden from runtime MVP. |
| Custom methods beyond home/office | Should wait | Generator supports arbitrary method definitions. MVP requires home and office/stopdesk first; arbitrary methods can wait unless explicitly scoped. |
| JSON import/export | Coming later / hide | PRD free MVP specifies CSV import/export, not JSON backend. |

### Forbidden or Risky Items Found

- Lovable error capture hook remains in `admin-app/src/lib/lovable-error-reporting.ts`.
- `69 wilayas` wording appears at `admin-app/src/routes/index.tsx:424` and `1258`.
- Fake generation copy appears at `admin-app/src/routes/index.tsx:733`.
- Fake live success copy appears at `admin-app/src/routes/index.tsx:749`.
- Advanced roadmap includes provider imports at `admin-app/src/routes/index.tsx:1316`.
- Advanced roadmap includes scheduled price changes at `admin-app/src/routes/index.tsx:1317`.
- Advanced roadmap includes commune-level pricing at `admin-app/src/routes/index.tsx:1322`.
- Advanced roadmap includes multi-store presets at `admin-app/src/routes/index.tsx:1323`.
- Dataset copy calls `58 wilayas` current administrative division at `admin-app/src/routes/index.tsx:423`, which conflicts with the PRD's legacy/current framing and needs verification.

No Pro locks, premium upgrade screen, license gate, product marketplace, telemetry SDK import, direct external API call, or external CDN runtime asset was found in the source inspection.

## Code Quality Findings

Applied `clean-code-guard` review mode.

### Critical

- Hardcoded fake success path in production source: `handleApply()` waits 1200ms and then completes the generator; `ApplyingScreen` and `SuccessScreen` claim WooCommerce zones are generated/live. This violates the no hardcoded success/mock fallback rule and the WooCommerce write safety roadmap.
- Mock diagnostics present as real checks: `DiagnosticsScreen.run()` waits 900ms and returns canned WooCommerce/shipping/zone results. This should not ship without clear mock isolation and copy.

### Important

- `admin-app/src/routes/index.tsx` is a 1274-line monolith mixing data, UI, workflow state, mock diagnostics, settings, import/export, and roadmap content.
- Mock data is mixed directly into route code instead of a clearly isolated mock module.
- Large shadcn template surface is present even when unused, increasing dependency, review, and distribution burden.
- `noUnusedLocals` and `noUnusedParameters` are disabled, making dead-code cleanup harder.
- The app has no source-level WordPress API client abstraction after `bootstrap.ts` deletion.
- Price handling uses `Number(...)`, `Math.round(...)`, and hardcoded `DZD` display in UI mock paths. This is acceptable only as mock UI, not as WooCommerce money logic.
- Custom method generation uses `Math.random()` to create IDs. That is fine for transient demos but not for stable persisted shipping method IDs.
- Global comments and template comments remain from Lovable/Tailwind and TanStack route scaffolding.

### Good

- The visible product surface is closer to the PRD than the old broad prototype: no product marketplace, no Pro upgrade surface, and no multi-country switcher.
- Main free MVP areas are represented visually.
- Smart Form Sync is framed as coming later rather than implemented.

## WordPress.org Compliance Findings

Applied `wp-plugin-directory-guidelines` and `wp-guard`.

### Must Fix

- Lovable error reporting hook must be removed or made a local no-op. Even though it only calls `window.__lovableEvents` when present, the project rules explicitly ban Lovable telemetry/error capture.
- Runtime fake write/success claims must be removed because WordPress.org and project docs require documentation/UI to describe actual behavior.
- Global CSS must be scoped before enqueueing in wp-admin.
- `@lovable.dev/vite-tanstack-config` should not be part of the production WordPress admin build pipeline unless there is a strong reason and its behavior is audited. It advertises error logger plugins, dev bridge behavior, VITE env injection, and sandbox detection in `vite.config.ts` comments.
- Remove or hide runtime Advanced roadmap items from first MVP to avoid appearing as unimplemented feature advertising.

### Pass / No Evidence Found

- No licensing system.
- No Pro lock or paid unlock flow.
- No direct `fetch()` to Yaxii or third-party APIs in current source.
- No external CDN script/style import in current source.
- No obfuscated PHP/JS source was found.
- Main plugin file has a GPL-compatible license header.

### Caution

- `admin-app/package-lock.json` deletion and broad new dependency graph make license/source review harder for WordPress.org packaging.
- `components.json` references the shadcn schema URL. This is not runtime executable code, but packaging should avoid unnecessary development metadata if not needed for source distribution.

## WooCommerce Safety Findings

Applied `woo-guard` to the UI/actions because the source claims WooCommerce shipping behavior.

- No WooCommerce PHP API reads/writes were added in this audit.
- Current frontend source claims or simulates WooCommerce writes without a backend:
  - `Generate {baseList.length} zones`
  - `Generating WooCommerce zones`
  - `Your WooCommerce zones are live`
  - `Apply changes`
- Diagnostics claim WooCommerce is active and shipping is enabled from local mock state.
- UI copy says manual zones will be skipped, but there is no real read layer, preview planner, confirmation payload, or apply engine.

Verdict: safe only as a non-mounted prototype. Not safe as production wp-admin UI until copy/actions are made explicitly local draft/read-only or wired to real preview-backed endpoints in later tasks.

## REST / Bootstrap Integration Findings

Applied `wp-rest-api`.

Existing backend remains conceptually good:

- `src/Rest/Routes.php` registers `GET /yaxii-shipping-manager/v1/bootstrap`.
- Permission callback is not public.
- `src/Rest/BootstrapController.php` returns REST URL, nonce, capabilities, WooCommerce active state, admin URLs, feature flags, and dataset status.

Current frontend source no longer consumes that contract:

- No `window.yaxiiShippingManagerAdmin` lookup in `admin-app/src`.
- No REST bootstrap fetch in `admin-app/src`.
- No `X-WP-Nonce` in `admin-app/src`.
- No WooCommerce inactive state sourced from backend.

Current built assets still contain old bootstrap strings, but those assets are stale relative to source and cannot be treated as proof of current source behavior.

## Bootstrap / Build Integration Findings

Compared:

- `src/Admin/AssetRegistrar.php`
- `assets/admin/.vite/manifest.json`
- current `admin-app/`
- prior TASK-001D/TASK-001E reports

### Can Current `admin-app/` Replace Previous Source Directly?

No.

Reasons:

- Missing `admin-app/src/main.tsx`.
- Missing `admin-app/src/bootstrap.ts`.
- TanStack Start server/document-shell assumptions.
- Global Tailwind CSS leakage.
- Missing WordPress bootstrap global handling.
- Missing static Vite output config to `../assets/admin`.
- Package lock changed from npm lock to Bun lock.
- Product copy and fake actions violate the project rules.

### Files Needing Adaptation

At minimum:

- `admin-app/package.json`
- `admin-app/vite.config.ts`
- `admin-app/tsconfig.json`
- `admin-app/src/main.tsx` or a new WordPress-specific entry
- `admin-app/src/bootstrap.ts` or equivalent API client
- `admin-app/src/styles.css`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/routes/__root.tsx`
- `admin-app/src/server.ts`
- `admin-app/src/start.ts`
- `src/Admin/AssetRegistrar.php`
- `assets/admin/` after source is fixed and rebuilt

### Build Scripts Needing Changes

- Restore/add a static WordPress admin build script.
- Restore/add `typecheck`.
- Decide package manager and commit the matching lockfile.
- Ensure build output goes to `assets/admin/` with `manifest: true` and `sourcemap: false`.

### PHP `AssetRegistrar` Needs Changes

Yes, if the current PHP diff remains. It must preserve WordPress-generated inline-before scripts while adding `type="module"` to the main Vite script tag. The current implementation regresses the TASK-001E fix.

### `assets/admin/` Must Be Rebuilt

Yes, but only after the source is WordPress-safe. Current build output is stale/out of sync because it references `src/main.tsx` while that source file is absent.

### Admin Error Risk

The TASK-001E missing bootstrap config error risk returns if the current `AssetRegistrar.php` change is kept.

## Must Fix Before Build / Mount

1. Restore a WordPress-specific static entry (`src/main.tsx`) that mounts only into `#yaxii-shipping-manager-admin-app`.
2. Restore a bootstrap client that reads `window.yaxiiShippingManagerAdmin`, fetches `GET /bootstrap`, and sends `X-WP-Nonce`.
3. Remove TanStack Start SSR/server/document shell from the wp-admin build path.
4. Replace or scope global Tailwind CSS so no `body`, `html`, `:root`, `*`, or wp-admin selectors leak outside the mount.
5. Remove Lovable error capture and Lovable metadata/runtime hooks.
6. Restore the TASK-001E-safe `AssetRegistrar::add_module_type()` behavior if this PHP diff is kept.
7. Remove fake WooCommerce write/generate/live success states.
8. Hide/remove `69 wilayas` and any unverified dataset-count wording.
9. Hide/remove Advanced runtime navigation.
10. Decide npm vs Bun and commit only one appropriate lockfile for the canonical frontend.
11. Rebuild `assets/admin/` from the fixed source and verify manifest/source alignment.

## Should Fix Before Dataset Hardening

1. Split `src/routes/index.tsx` into screen modules and shared components.
2. Move mock data into clearly named mock fixtures or remove it as endpoints land.
3. Replace mojibake dataset labels with verified UTF-8 data in the dataset task; do not build backend logic on current inline data.
4. Remove unused shadcn/Radix/template components and dependencies.
5. Add `typecheck` script and keep lint/typecheck useful by enabling unused local checks or equivalent cleanup.
6. Keep MVP actions limited to setup, zones draft table, diagnostics placeholder, CSV-only import/export placeholder, settings, and disabled Smart Form Sync.
7. Make all "apply", "generate", and "preview" language match actual backend availability.
8. Keep money display/input obviously mock until WooCommerce decimal handling is wired server-side.

## Can Wait

1. Minor visual palette refinement after wp-admin mount is stable.
2. Fine-grained component extraction for small UI primitives.
3. Advanced roadmap content in documentation only.
4. Performance tuning after the dependency/template surface is trimmed.
5. Full browser smoke after the next adaptation task rebuilds a mountable bundle.

## Roadmap Impact

Product roadmap should not change.

Near-term sequencing should change:

1. Add `TASK-001H` or equivalent frontend adaptation task before TASK-002.
2. TASK-002 Dataset hardening should wait until `admin-app/` is WordPress-safe, mounted, bootstrap-aware, and source/build aligned.
3. Continue product roadmap after frontend stabilization: dataset hardening, settings persistence, read-only WooCommerce diagnostics, preview planner, safe apply engine, CSV backend.

## Recommended Next Task

`TASK-001H: adapt latest admin-app source for WordPress static mount`

Recommended scope:

- Keep `admin-app/` as the frontend source of truth.
- Preserve the latest Lovable UI direction where it fits the PRD.
- Remove TanStack Start from the wp-admin runtime path.
- Restore static Vite WordPress entry and bootstrap client.
- Scope CSS.
- Remove Lovable telemetry/error capture.
- Remove fake write/success states and forbidden dataset wording.
- Hide Advanced and JSON runtime surfaces.
- Rebuild `assets/admin/` and verify manifest/source alignment.

Do not start TASK-002 until this passes.

## Files Changed

Only this audit report was intentionally changed by this task.

Pre-existing dirty files from the source replacement remain untouched by me.

## Files Created

- `.agents/progress/yaxii-shipping-manager/TASK-001G-latest-admin-app-source-audit.md`

## What Was Before

TASK-001D created a static, scoped `admin-app/` with `src/main.tsx`, `src/bootstrap.ts`, scoped CSS, a simple package, and built assets under `assets/admin/`.

TASK-001E fixed the runtime bootstrap by preserving WordPress inline-before script output while adding `type="module"`.

The user then replaced `admin-app/` with the latest Lovable app source.

## What Changed

Only the audit report was added.

## What Still Remains Mocked

No product behavior changed.

Current `admin-app/` source remains mock/local-state only for:

- Wilaya data.
- Setup/generator.
- Shipping zones table edits.
- Diagnostics.
- Checkout simulator.
- Import/export.
- Settings.
- Smart Form Sync.

No dataset backend, WooCommerce read layer, preview planner, safe apply engine, CSV parser, provider integration, or YSF sync exists.

## Security Notes

- No source security fix was made.
- Current frontend source does not use the WordPress nonce because bootstrap handling is absent.
- Current PHP diff would strip the inline bootstrap global if kept.
- Lovable error capture must be removed before mount.
- No direct external runtime fetch was found in current source.

## WooCommerce Safety Notes

- No WooCommerce APIs were added by this audit.
- Current UI source has fake WooCommerce generation/apply/live success states and must not be mounted as production behavior.
- Safe write sequence remains: diagnostics first, preview second, apply last.

## WordPress.org Compliance Notes

- Current replacement source is not WordPress.org-ready.
- Main blockers are Lovable error capture, global CSS leakage, fake write claims, runtime roadmap/provider surfaces, unsupported dataset wording, and broad unaudited dependency/template surface.
- No licensing, Pro gate, product marketplace, external CDN runtime asset, or direct remote API call was found in source.

## Checks Run

- `Get-Location`
- `git rev-parse --show-toplevel`
- `git branch --show-current`
- `git status --short --untracked-files=all`
- `git switch -c task/001g-latest-admin-app-source-audit`
- `Get-ChildItem -Force .agent,.agents`
- `Get-ChildItem -Force .agents\skills`
- Read required skill files and relevant references.
- Read `AGENTS.md`, `CLAUDE.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`.
- Read prior reports, including TASK-001E from `HEAD` because it is deleted in the working tree.
- `rg --files admin-app`
- `Get-Content` inspections for package/config/source/PHP/manifest files.
- `rg` inspections for SSR, Lovable, telemetry, CDN, global CSS, bootstrap, nonce, forbidden wording, fake writes, WooCommerce claims, HeroUI, and dependency usage.
- `git diff --check`
- `git status --short --untracked-files=all`

No install, build, lint, or typecheck was run because this task was audit-only and the source is already structurally not mount-ready.

## Check Results

- `git status --short --untracked-files=all`: showed the expected dirty source replacement plus this report after creation.
- `git diff --check`: passed.
- Package scripts were listed from `admin-app/package.json`; no build/install was required for inspection.
- HeroUI search: no matches.
- Runtime external CDN/API search in `admin-app/src`: no direct external runtime call found.
- Bootstrap search in `admin-app/src`: no current-source usage of `window.yaxiiShippingManagerAdmin` or `X-WP-Nonce`.
- Manifest/source alignment check: failed by inspection because manifest expects `src/main.tsx` and that source file is missing.

## Known Risks

- The working tree contains source/build/PHP changes I did not make. I did not revert them.
- Current `assets/admin/` may load an older generated app while current `admin-app/` source is different, creating false confidence during runtime checks.
- The deleted TASK-001E report should be restored or intentionally re-added in a separate cleanup task.
- If someone rebuilds current `admin-app/` without adaptation, the result is unlikely to match the PHP enqueue contract.

## Blockers

Blocking issues before implementation continues:

- Current source is not WordPress admin mountable.
- Current source does not consume the REST bootstrap endpoint.
- Current source has global CSS leakage.
- Current source has Lovable error capture.
- Current source has fake WooCommerce write/success states.
- Current source has unsupported dataset wording.
- Source and build output are out of sync.
- Current `AssetRegistrar.php` diff regresses the bootstrap inline config fix.

## Commit Hash, If Committed

Pending at report creation.
