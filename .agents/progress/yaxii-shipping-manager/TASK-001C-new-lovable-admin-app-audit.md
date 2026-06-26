# TASK-001C New Lovable Admin App Audit and Replacement Plan

Date: 2026-06-26

## Goal

Audit the new Lovable admin app candidate and decide whether it should replace the current mounted `app/` frontend, what migration work is needed, and whether the roadmap should change.

## Scope

Audit and planning only.

No product source, WordPress PHP foundation, build config, dataset backend, WooCommerce diagnostics, preview planner, safe apply engine, CSV backend, or YSF sync implementation was changed.

## Branch/status

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git repository: yes
- Branch created for this task: `task/001c-new-lovable-admin-app-audit`
- Nested `app/.git`: not present
- Preserved nested prototype backup: `app/.git-prototype-backup` exists and remains untouched/ignored
- Pre-audit status: candidate reference app was untracked under `.agents/references/lovable-admin-v2/`

## Skills used

Existing local skills inspected and applied:

- `.agents/skills/clean-code-guard/SKILL.md`
- `.agents/skills/wp-guard/SKILL.md`
- `.agents/skills/wp-plugin-development/SKILL.md`
- `.agents/skills/wp-plugin-directory-guidelines/SKILL.md`
- `.agents/skills/docs-guard/SKILL.md`
- `.agents/skills/woo-guard/SKILL.md`

Relevant references read:

- `clean-code-guard/references/ai-failure-modes.md`
- `clean-code-guard/references/review-checklist.md`
- `wp-guard/references/review-checklist.md`
- `wp-plugin-directory-guidelines/references/guideline-review-checklist.md`
- `docs-guard/references/verification.md`

## Sources inspected

- `AGENTS.md`
- `CLAUDE.md`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-000-prototype-product-discovery-audit.md`
- `.agents/progress/yaxii-shipping-manager/TASK-ENV-004-repository-initialization-and-history-preservation.md`
- `.agents/progress/yaxii-shipping-manager/TASK-001-plugin-foundation-react-mount.md`
- `.agents/progress/yaxii-shipping-manager/TASK-001B-admin-app-stabilization-scope-pruning.md`
- `app/`
- `.agents/references/lovable-admin-v2/`

## Candidate app location

`.agents/references/lovable-admin-v2/`

## Existing app location

`app/`

The current production-mounted WordPress admin source is the TASK-001B path:

- `app/src/wp-admin-main.tsx`
- `app/src/wp-admin-app.tsx`
- `app/src/wp-admin-bootstrap.ts`
- `app/src/wp-admin-styles.css`
- `app/src/wp-admin-screens/*`
- `app/vite.wp-admin.config.ts`

The older Lovable/TanStack prototype routes still exist under `app/src/routes/`, but TASK-001B removed them from the wp-admin build path.

## Candidate app technical inventory

### Framework

- React 19
- TypeScript
- TanStack Router
- TanStack Start
- TanStack React Query

### Package manager

- Candidate includes `bun.lock` and `bunfig.toml`.
- Candidate has no `package-lock.json`.
- Existing `app/` currently has both `package-lock.json` and Bun files; TASK-001 used npm for the WordPress build.

### Build tool

- Candidate uses Vite 8 through `@lovable.dev/vite-tanstack-config`.
- Candidate `vite.config.ts` is TanStack Start/Lovable oriented and points to `src/server.ts` for SSR/server entry behavior.
- Candidate does not include `build:wp-admin`.
- Candidate does not include a WordPress-specific Vite config or static wp-admin entry.

### UI library

- Candidate uses a local shadcn-style component set under `src/components/ui/`.
- Underlying primitives include Radix UI packages.
- Icons use `lucide-react`.
- Utility styling uses Tailwind CSS 4, `class-variance-authority`, `clsx`, and `tailwind-merge`.

### HeroUI usage confirmation

No HeroUI usage was found.

Searches for `HeroUI`, `@heroui`, `heroui`, and `hero-ui` returned no matches in the candidate or existing app.

### Routing approach

- Candidate has one real TanStack file route: `/`.
- `src/routeTree.gen.ts` only registers the root route and index route.
- Candidate app section navigation is handled by local React state (`tab`) inside `src/routes/index.tsx`, not by separate URLs.
- This top-navigation state model is easier to adapt to a single wp-admin page than the original multi-route prototype, but it still needs either hash routing or explicit state persistence for deep links.

### Styling approach

- Candidate imports `src/styles.css` through the TanStack root route.
- CSS uses Tailwind 4 with global `@layer base` rules for `*` and `body`.
- CSS variables are written globally on `:root` and `.dark`.
- Primary/accent tokens lean purple (`oklch(... 277)`), so the migrated UI should be recolored toward a quieter WordPress/admin palette.
- Candidate styling is not yet scoped to the plugin mount and would conflict with wp-admin if imported directly.

### Main entry files

- `src/start.ts`
- `src/server.ts`
- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routeTree.gen.ts`
- `src/styles.css`

### Mock data locations

Candidate mock data is mostly inline in one large file:

- `src/routes/index.tsx`

Important inline mock/state areas:

- `SEED`
- `INITIAL_WILAYAS`
- `WILAYA_58`
- `WILAYA_EXTRA_69`
- `DEFAULT_METHOD_DEFS`
- Diagnostics results generated with `setTimeout`
- Generate/apply flow generated with `setTimeout`
- Import/export UI with no backend parser
- Settings held only in uncontrolled inputs/switches

This is easier to inspect than the original prototype, but it is not production structure. Migration should split data, screen components, and WordPress API clients before the app becomes canonical.

### External dependencies

Candidate package dependencies include broad Lovable template dependencies:

- TanStack Start/Router/React Query
- Radix UI primitives
- Tailwind CSS 4
- Lucide React
- Recharts
- React Hook Form
- Zod
- React Day Picker
- Embla Carousel
- Vaul
- Sonner
- Input OTP

Searches did not find candidate screen imports for heavier unused widgets such as chart, carousel, calendar, command, context menu, drawer, hover card, menubar, navigation menu, pagination, resizable, sidebar, slider, or input OTP. These should not be carried into a new canonical frontend unless actually used.

### Telemetry or external calls

No direct `fetch()` calls to external URLs, `axios`, `XMLHttpRequest`, `sendBeacon`, analytics SDKs, PostHog, or Sentry were found in the candidate.

However, the candidate still includes Lovable error capture:

- `src/lib/lovable-error-reporting.ts` calls `window.__lovableEvents?.captureException?.(...)`
- `src/routes/__root.tsx` calls `reportLovableError()` from the error boundary

This must be removed or converted to a local no-op before any migration into the plugin.

### SSR/server assumptions

Candidate keeps TanStack Start SSR/server files:

- `src/start.ts`
- `src/server.ts`
- `src/routes/__root.tsx` renders `<html>`, `<head>`, `<body>`, `<HeadContent />`, and `<Scripts />`
- `vite.config.ts` references the server entry

These are not suitable as-is for a static WordPress admin mount.

### WordPress-hostile assumptions

- Global Tailwind/base CSS targets `body` and broad selectors.
- Root route owns document shell and meta tags instead of mounting inside an existing wp-admin page.
- Root metadata still contains Lovable defaults: `Lovable App`, `Lovable Generated Project`, and `@Lovable`.
- Error links use home-style navigation assumptions.
- Fake generate/apply actions imply WooCommerce writes without a backend.
- Current dataset wording includes `69 wilayas`, which conflicts with project dataset rules.

## Product fit findings

| Area | Candidate status | Classification | Required action |
| --- | --- | --- | --- |
| Setup / generator | Present and visually clearer than current mounted placeholders, but it has fake generation and fake completion. | Free MVP | Keep UI direction, remove fake writes, end at preview intent until backend exists. |
| Shipping Zones manager | Present as the main tab with wilaya rows, enabled state, home/office methods, status, and bulk controls. | Free MVP | Keep, but wire to real dataset/settings later and remove any direct apply behavior until preview planner exists. |
| Diagnostics / Checkout Protection | Present with checkout simulator, but results are generated from local mock state after a timer. | Free MVP | Keep screen concept, replace with real read-only WooCommerce diagnostics in the diagnostics task. |
| Import / Export | Present for CSV and JSON. Backend is absent. | Free MVP for CSV; coming later for JSON | Keep CSV direction. Hide JSON until scoped. |
| Settings | Present with dataset mode, currency label, manual-zone protection, confirmation toggles, Arabic/French display toggles. | Free MVP | Keep safety/default settings, but persist through WordPress options later. Replace `69 wilayas` with current/legacy dataset labels. |
| Smart Form Sync | Present as coming-later informational UI. | Coming later | Acceptable if quiet and disabled. Do not implement in MVP. |
| Advanced / roadmap | Present as roadmap cards. | Remove/hide for first MVP | Hide from first release UI. Keep roadmap only in docs/task planning. |
| Current dataset mode | Candidate offers `58` and `69`; no verified current dataset mode. | Missing but required | Replace with verified current Algeria dataset and legacy 58 compatibility model after migration. |
| Legacy 58 compatibility | Candidate treats `58` as one dataset option. | Missing but required | Rework labels so legacy/current are accurate and not confused with unverified counts. |
| No `68 wilayas` wording | Candidate has no `68` wording in searched source. | Pass | Continue avoiding `68`. |
| No unsupported `69 wilayas` wording | Candidate uses `58 or 69`, `69 wilayas`, and `WILAYA_EXTRA_69`. | Remove/hide | Remove before migration. This is a blocking dataset/compliance issue. |
| No fake Pro locks | No `Pro`, `Premium`, upgrade lock, or license gating found in candidate source. | Pass | Keep this direction. |
| No aggressive product upsells | Candidate has no product marketplace or upgrade cards. | Pass | Keep this direction. Hide advanced roadmap tab from release UI. |
| No telemetry | Lovable capture hook remains. | Remove/hide | Must remove/no-op before migration. |
| No external API calls | No runtime external API calls found. | Pass with caveat | Preserve local-only runtime; remove Lovable reporting hook. |

## UX/design findings

Candidate is directionally better than the original Lovable prototype and closer to the requested admin product:

- Uses top navigation instead of the old dashboard/sidebar structure.
- Uses a centered `max-w-5xl` plugin-page layout.
- Removes Pro locks, product marketplace cards, multi-country switcher, and dashboard upsells.
- Keeps screens practical for merchants and agencies: zones, generator, diagnostics, import/export, settings.
- Feels less childish and less overloaded than the original prototype.
- The one-screen/tab model should feel faster than the old route tree if trimmed.

Design issues to fix before migration:

- Purple primary/accent palette is still dominant; shift toward a WordPress-compatible restrained palette with a clearer 60/30/10 balance.
- Global Tailwind/base styles must be scoped or replaced with a wp-admin-safe stylesheet.
- The large single route file will become hard to maintain; split into screen modules before it becomes canonical.
- Buttons are over-present in places where backend actions do not exist yet.
- Fake success states (`Generating WooCommerce zones`, `Your WooCommerce zones are live`) must be removed.
- Advanced roadmap tab risks making the first MVP feel broader than it is.
- `Prototype build` footer should not ship.

## WordPress admin integration risks

### Easier than current `app/`?

The candidate is easier to reason about as a product UI, but not easier to mount technically than the TASK-001B mounted app.

TASK-001B already solved important wp-admin problems:

- Dedicated static wp-admin entry
- REST bootstrap fetch
- Hash routing
- Scoped CSS
- Lazy screen chunks
- No import of the generated TanStack route tree
- No global Tailwind stylesheet in wp-admin

The candidate does not yet have those adaptations.

### Static Vite compatibility

Feasible, but not direct.

Use the TASK-001/TASK-001B static build pattern:

- Create a WordPress-specific entry.
- Avoid TanStack Start SSR entry.
- Build with plain Vite + React.
- Output to `assets/admin/`.
- Keep manifest-based PHP enqueue.

### Hash routing feasibility

Feasible.

Candidate currently uses local `tab` state. Migration can either:

- Keep local tab state and add hash synchronization for deep links, or
- Convert tabs into the existing TASK-001B lightweight hash route map.

The second option better preserves existing wp-admin behavior.

### CSS scoping needs

High.

Do not import candidate `src/styles.css` directly into wp-admin. It contains global `:root`, `.dark`, `body`, and `*` rules. Either:

- Rebuild the candidate UI with the existing scoped `ysm-*` CSS approach, or
- Generate Tailwind under a strict mount selector and verify no global base reset leaks.

### Global style conflict risk

High if copied as-is.

The candidate root stylesheet would affect wp-admin body background/text and broad element borders.

### Bundle size risk

Medium to high if copied wholesale.

Candidate imports fewer screens than the original prototype, but its package contains many unused template dependencies. The route itself imports only a subset of UI components. Migration should trim dependencies and avoid carrying unused Radix/template components.

### HeroUI impact on bundle size

None found. HeroUI is not used.

### Reuse of current `wp-admin-main.tsx` and `vite.wp-admin.config.ts`

Recommended.

The current WordPress build entry and Vite config are the safest starting point. They should be adapted to import the new canonical frontend from `admin-app/` or a new `app/src/admin` entry, not replaced by the candidate TanStack Start entry.

### REST bootstrap wiring preservation

Recommended.

Keep `app/src/wp-admin-bootstrap.ts` behavior or move equivalent code into the new canonical frontend. Preserve:

- Localized `window.yaxiiShippingManagerAdmin`
- `X-WP-Nonce`
- same-origin REST request
- bootstrap loading/error states
- capability and WooCommerce active flags

### Required changes to use candidate in WordPress

1. Remove Lovable error capture.
2. Remove TanStack Start server/root document shell for wp-admin.
3. Add a WordPress static admin entry.
4. Reuse or port the TASK-001B REST bootstrap client.
5. Replace global Tailwind/base CSS with scoped wp-admin-safe styles.
6. Remove fake generate/apply success states.
7. Remove `69 wilayas` wording and placeholder extra dataset.
8. Hide advanced roadmap UI from first MVP runtime.
9. Split monolithic `src/routes/index.tsx` into maintainable screen modules.
10. Trim unused dependencies and unused generated UI components.

## Migration options

### Option A - Replace current `app/` with candidate app after preserving current app backup

Pros:

- Direct mental model: `app/` remains the frontend source.
- Existing PHP asset registrar path can stay mostly unchanged.
- Less directory naming churn.

Cons:

- Higher risk of losing TASK-001B wp-admin adaptations.
- The candidate is still TanStack Start/SSR oriented.
- Harder to preserve the working mounted app while migration is in progress.
- Requires careful backup rules to avoid mixing current source, candidate source, and generated assets.

Risks:

- Reintroducing global CSS conflicts.
- Reintroducing Lovable error capture.
- Reintroducing fake WooCommerce write states.
- Accidentally breaking the current mounted app before the replacement is verified.

Recommended usage:

- Use only if the migration is very small and done in one reviewed pass. Not preferred here.

### Option B - Create `admin-app/` as new canonical frontend and update build pipeline to use it

Pros:

- Keeps current `app/` mounted source intact as a reference until the new app is verified.
- Lets the new app be designed for WordPress admin from the start.
- Avoids carrying TanStack Start server assumptions into the canonical frontend.
- Provides a clean place to split candidate screens, remove fake data, remove telemetry hooks, trim dependencies, and scope CSS.
- Makes future dataset/diagnostics work easier because the production admin app boundary is clear.

Cons:

- Requires build pipeline update after the new folder is ready.
- Requires a deliberate dependency/package-manager decision.
- Temporary duplication between `app/`, `admin-app/`, and `.agents/references/lovable-admin-v2/`.

Risks:

- Build path churn if not staged carefully.
- Need to ensure source distribution and WordPress.org packaging rules account for the new folder.
- Need to prevent old `app/` prototype source from being packaged indefinitely.

Recommended usage:

- Preferred. Use for the next migration task.

### Option C - Gradually port candidate UI components into existing `app/`

Pros:

- Preserves TASK-001B build pipeline and REST bootstrap without directory migration.
- Lowest initial build/config risk.
- Can improve the current mounted app incrementally.

Cons:

- Existing `app/` still contains the old Lovable/TanStack prototype routes, Pro/product/automation remnants, and mixed history.
- Increases chance of carrying stale prototype baggage forward.
- Less clean for future contributors.

Risks:

- Long-lived hybrid frontend with unclear source of truth.
- Hidden imports can accidentally pull old route tree/global CSS back into wp-admin.

Recommended usage:

- Acceptable for a tiny visual patch, but not for making the candidate the new product UI.

## Recommended option

Recommend Option B.

Create `admin-app/` as the new canonical frontend source, migrate the candidate app there, and update the WordPress build pipeline to use `admin-app/` only after the new source is scoped, telemetry-free, dataset-safe, and free of fake writes.

Keep current `app/` temporarily as archived/reference source until the new `admin-app/` build is verified inside wp-admin. Do not delete `app/` in the migration task unless a separate cleanup task is approved.

## Recommended migration sequence

1. Create `admin-app/` with a plain static Vite + React entry, not TanStack Start SSR.
2. Port candidate layout and screens into split modules.
3. Reuse the TASK-001B bootstrap client pattern.
4. Use hash routing or the existing TASK-001B lightweight route map for deep links.
5. Replace global Tailwind/base CSS with scoped wp-admin-safe CSS.
6. Remove Lovable reporting, Lovable meta, server entry, and document shell.
7. Remove all fake apply/generate success states.
8. Replace `69 wilayas` with PRD-safe dataset labels and keep dataset content mocked/isolated until dataset hardening.
9. Hide Advanced from runtime navigation for MVP; leave Smart Form Sync as quiet coming-later only.
10. Update `vite.wp-admin.config.ts` and `AssetRegistrar::ENTRY_FILE` only when the new app is ready.
11. Run typecheck/build/focused lint and verify no source maps, no external URLs, and no global CSS leakage.

## Roadmap impact

Product roadmap does not change.

Frontend migration becomes the next task before dataset hardening. Dataset hardening remains the next product/backend task after the UI source is stabilized.

Updated near-term order:

1. `TASK-001D` - Create `admin-app/` canonical frontend from candidate and wire WordPress build to it.
2. `TASK-002` - Dataset hardening.
3. `TASK-003` - Settings persistence or read-only WooCommerce diagnostics, depending on final sequencing.

## Files changed

None before this report.

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-001C-new-lovable-admin-app-audit.md`

## What was before

The plugin had a working TASK-001B mounted admin app under `app/` with a lightweight scoped wp-admin shell and mock screens. The new Lovable candidate app existed as an untracked reference under `.agents/references/lovable-admin-v2/`.

## What changed

Only this audit report was added.

## What still remains mocked

No product behavior changed.

The current mounted app still has mocked:

- Dashboard metrics
- Wizard selection
- Shipping Manager table
- Preview plan
- Diagnostics
- CSV import/export
- Settings persistence
- YSF Sync informational screen

The candidate app is also mock/local-state only and includes fake generate/apply states that must not ship.

## Security notes

- No source code or runtime behavior changed.
- Candidate includes Lovable error capture via `window.__lovableEvents?.captureException?.(...)`; this must be removed before migration.
- Candidate has no direct external fetch/analytics calls found in source inspection.
- Candidate fake apply/generate actions must not be wired to real state changes without nonce/capability-protected backend endpoints and preview confirmation.

## WooCommerce safety notes

- No WooCommerce reads or writes were added.
- Candidate UI currently implies generation and update of WooCommerce zones through local state and timers. Those states must be removed or changed to preview-only language before migration.
- Safe apply remains out of scope until read-only diagnostics and preview planner are implemented.

## WordPress.org compliance notes

- Candidate direction is better than the old prototype because it removes Pro locks, product marketplace UI, aggressive upsells, and multi-country switcher UI.
- Candidate still has WordPress.org risks if copied directly:
  - Lovable error capture hook
  - Global CSS that can affect wp-admin
  - Lovable metadata
  - Fake WooCommerce write success claims
  - Unsupported `69 wilayas` wording
  - Advanced roadmap tab that may look like unimplemented feature advertising
- No HeroUI dependency was found.

## Checks run

- `git status --short --untracked-files=all`
- `git diff --check`

Additional read-only inspection commands were run with `rg` and `Get-Content`. No install/build was run.

## Check results

- `git status --short --untracked-files=all`: passed; showed this new report plus the pre-existing untracked candidate reference app under `.agents/references/lovable-admin-v2/`.
- `git diff --check`: passed with no output.
- No install/build/lint/typecheck was run because this task was audit-only and source inspection was sufficient.

## Known risks

- Candidate source is untracked, so it must be intentionally staged or preserved in a later task if it is meant to become part of repository history.
- Candidate is cleaner visually but technically not WordPress-ready.
- Candidate's monolithic 1371-line route file should not become production structure unchanged.
- Dataset labels/content remain unverified and must be fixed before dataset hardening can build on them.
- The old `app/` folder will remain confusing until a deliberate archive/removal task runs after `admin-app/` is verified.

## Blockers

None for audit/report completion.

Blocking issues before candidate migration:

- Remove Lovable error capture.
- Remove `69 wilayas` wording and placeholder dataset.
- Remove fake write success states.
- Scope or replace global CSS.
- Add a static WordPress admin entry and preserve REST bootstrap wiring.

## Next recommended task

`TASK-001D: create canonical admin-app frontend from candidate`

Recommended scope:

- Create `admin-app/` as the canonical frontend.
- Port the candidate top-nav layout and MVP screens.
- Preserve the current `app/` folder as reference.
- Reuse TASK-001B bootstrap/hash-routing/scoped-style lessons.
- Keep all backend feature screens mocked/read-only until dataset and diagnostics tasks land.

## Commit hash, if committed

See final task response.
