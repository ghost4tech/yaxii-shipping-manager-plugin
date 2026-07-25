# TASK-000 Prototype Product Discovery Audit

Date: 2026-06-26

## 0. Preconditions and repository state

- Current working directory confirmed: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Plugin root Git branch/status: not available. The plugin root is not a Git repository.
- Nested prototype Git repository: `app\.git`
- Nested prototype branch: `main`
- Nested prototype status before audit: clean
- `AGENTS.md`: not found
- `CLAUDE.md`: not found
- `.agents/skills`: not found
- `.agents`: did not exist before the report directory was created
- Package scripts detected and not run: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`
- `npm install` / `bun install`: not run
- Build/lint: not run, because this task is discovery-only and the source was already inspectable

## 1. Repository / app discovery

### Prototype location

The cloned Lovable prototype app is located at:

`app\`

Important files:

- `app\package.json`
- `app\vite.config.ts`
- `app\src\start.ts`
- `app\src\server.ts`
- `app\src\router.tsx`
- `app\src\routes\__root.tsx`
- `app\src\routeTree.gen.ts`
- `app\src\styles.css`
- `app\src\lib\mock-data.ts`

### Framework and build tools detected

- React 19
- TypeScript
- Vite 8
- TanStack Router
- TanStack Start
- TanStack React Query
- Bun lockfile and `bunfig.toml`
- Lovable template/config package: `@lovable.dev/vite-tanstack-config`
- Tailwind CSS 4 via `@tailwindcss/vite`
- ESLint and Prettier

`.lovable\project.json` identifies the template as:

`tanstack_start_ts_2026-06-08-vite-8`

### Main entry files

- `src\start.ts`: TanStack Start setup with server request middleware.
- `src\server.ts`: custom server entry wrapper around `@tanstack/react-start/server-entry`.
- `src\router.tsx`: creates the TanStack Router and React Query client.
- `src\routes\__root.tsx`: document shell, sidebar layout, global styles, toaster, error/not-found states.
- `src\routeTree.gen.ts`: generated route map.

### Routing approach

The app uses TanStack Router file-based routes. Route files are under `src\routes`.

Detected routes:

- `/`
- `/wizard`
- `/communes`
- `/manager`
- `/preview`
- `/diagnostics`
- `/import-export`
- `/ysf-sync`
- `/settings`
- `/products`
- `/automations`

The root layout renders the sidebar for normal routes and switches to a full-screen layout for `/wizard`.

### UI library/components used

- shadcn-style local component set under `src\components\ui`
- Radix UI primitives
- Lucide React icons
- Sonner toasts
- Recharts dependency present, though no chart screen appears to use it yet
- Local shared components:
  - `AppSidebar`
  - `CountrySwitcher`
  - `PageHeader`
  - `ProBadge`
  - `ProLock`
  - `StatusBadge`

### Styling system

- Tailwind CSS 4 with `@import "tailwindcss" source(none);`
- App source registered with `@source "../src";`
- CSS variables and OKLCH color tokens in `src\styles.css`
- shadcn config in `components.json`, style `new-york`, `rtl: false`
- Uses playful onboarding background blobs in the wizard
- Some UI is card-heavy and pro/marketing heavy for the current free plugin direction

### Mock data locations

Primary mock data is in:

`app\src\lib\mock-data.ts`

It contains:

- `WILAYAS`
- `COMMUNES`
- `SETUP_STATUS`
- `DIAGNOSTICS`
- `CHECKOUT_PROTECTION`
- `PREVIEW_CHANGES`
- `YAXII_PRODUCTS`
- `COUNTRIES`
- `AUTOMATIONS`

Other mock/state logic:

- `app\src\lib\plan.ts`: stores `yaxii.plan` and `yaxii.country` in browser `localStorage`.
- Route-local state is used for wizard selections, manager edits, diagnostics loading/results, settings, import validation, and automations.

### Technical problems noticed

- The app is not currently a WordPress plugin. It is a nested TanStack Start app inside a plugin folder.
- The plugin root has no Git repository; the app folder has its own nested Git repository.
- There is no PHP plugin bootstrap, WordPress admin page, enqueue layer, REST route, nonce handling, capability checks, or WooCommerce dependency guard.
- It is SSR/server-app oriented through TanStack Start/Nitro/Lovable config, which is likely the wrong deployment shape for a WordPress.org plugin admin UI. The production plugin likely needs a static Vite build mounted inside wp-admin.
- The app includes Lovable error reporting integration through `window.__lovableEvents?.captureException`; this is not an explicit remote call by itself, but it is not appropriate for the no-telemetry/no-remote-calls product direction and should be removed or inert in the plugin build.
- `config.server.ts` mentions analytics IDs as an example. No active analytics code was found, but this placeholder language is undesirable for WordPress.org/free-plugin positioning.
- Dataset problem: `WILAYAS` has 58 rows, but codes `49` through `58` are marked `isDelegated: true`. That contradicts the requested product direction of 58 official wilayas, with optional delegated areas shown separately as delegated.
- Dataset problem: the UI offers `Algeria (extended)` as 68 wilayas, but the mock data does not contain 68 wilayas. The wizard's 68 mode just includes all 58 mock rows.
- Dataset problem: `COMMUNES` is only a small sample, not a real full commune dataset.
- Text/encoding risk: PowerShell inspection displayed mojibake for Arabic, accented French, emojis, arrows, and ellipses. This may be terminal decoding, but it must be verified before Arabic/French release work.
- Product naming is inconsistent: `Yaxii Shipping Manager`, `Yaxii Shipping Zones`, and `Yaxii Shipping` all appear in different places.
- Pro locks, upgrade cards, product cross-sells, and multi-country placeholders conflict with free-only scope.
- No real WooCommerce data access exists; all Woo version/status/zone conflicts are mocked.
- No persistence exists beyond temporary React state and localStorage.
- No accessibility audit has been run. Some overlay locking patterns blur interactive content underneath and may create focus/accessibility issues.

## 2. Product feature inventory

| Feature / screen                 | Location                                                                                         | Current behavior                                                                                                          | Classification                | Notes                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard                        | `/`, `src\routes\index.tsx`                                                                      | Shows setup progress, missing/duplicate/needs-sync counts, quick cards, Pro upsell, country footer.                       | Keep but simplify             | Keep a quiet status dashboard. Remove Pro badge, upsell, automations card, multi-country hype, and dashboard spam.                      |
| Checkout Protection              | `CHECKOUT_PROTECTION` in `mock-data.ts`; partially represented by diagnostics/checkout simulator | Mock object exists but no dedicated route.                                                                                | Keep for MVP                  | Should become read-only diagnostics focused on "will checkout show a method for Algerian addresses?"                                    |
| Wizard                           | `/wizard`, `src\routes\wizard.tsx`                                                               | Full-screen onboarding with quick/manual/csv paths, dataset selection, wilaya picker, done state.                         | Keep but simplify             | Good MVP shape, but should end in preview/dry-run, not an implied write. Remove playful excess if wp-admin tone needs to be calmer.     |
| Dataset selection                | Wizard step                                                                                      | Offers 58 official and 68 extended/delegated datasets.                                                                    | Keep but simplify             | Keep official 58. Do not claim 68 until real delegated-area data exists and labels are legally/administratively clear.                  |
| Wilaya selection                 | Wizard step                                                                                      | Search, select all/clear, toggle wilayas.                                                                                 | Keep for MVP                  | Useful. Must fix official/delegated classification and support Arabic/French names correctly.                                           |
| Shipping Manager                 | `/manager`, `src\routes\manager.tsx`                                                             | Spreadsheet-like wilaya table with prices, home/stop-desk toggles, filters, bulk selection, dirty bar. Locked behind Pro. | Keep for MVP                  | This is core, not Pro. Make it free, but initially back it with saved plugin config and read-only Woo data before writing zones.        |
| Preview / Apply                  | `/preview`, `src\routes\preview.tsx`                                                             | Shows mocked create/update/conflict/skipped plan and fake apply toast. Locked behind Pro.                                 | Keep for MVP                  | Preview/dry-run is essential. Apply engine should arrive later and remain safety-gated.                                                 |
| Diagnostics                      | `/diagnostics`, `src\routes\diagnostics.tsx`                                                     | Mock system checks and checkout simulator by wilaya.                                                                      | Keep for MVP                  | Strong MVP candidate. First implementation should be read-only WooCommerce inspection.                                                  |
| Checkout simulator               | Inside `/diagnostics`                                                                            | Select wilaya, show whether shipping methods would appear.                                                                | Keep for MVP                  | Keep as read-only test result based on real Woo zone/method matching.                                                                   |
| Import / Export                  | `/import-export`, `src\routes\import-export.tsx`                                                 | Mock CSV upload validation and Pro-locked export options.                                                                 | Keep but simplify             | CSV import can be useful if narrow. Export should not be Pro in a free plugin if included. Start with sample CSV + validation only.     |
| YSF Sync                         | `/ysf-sync`, `src\routes\ysf-sync.tsx`                                                           | Shows Yaxii Smart Form detection mock and manual/import/sync modes.                                                       | Keep as disabled/coming later | Do not implement full sync in MVP. A disabled explanation is acceptable only if quiet and not an upsell.                                |
| Settings                         | `/settings`, `src\routes\settings.tsx`                                                           | Defaults, language, auto-sync, Arabic names, manual-zone protection, danger zone.                                         | Keep but simplify             | Keep defaults and safety toggles. Remove auto-sync until write engine exists. "Reset zones" must not exist until a safe backend exists. |
| Products page                    | `/products`, `src\routes\products.tsx`                                                           | Cross-sells Yaxii products with Install/Learn More buttons.                                                               | Remove                        | Scope creep and WordPress.org compliance risk. Not needed for first release.                                                            |
| Automations                      | `/automations`, `src\routes\automations.tsx`                                                     | Hidden-ish route in Pro nav with automation templates and rules.                                                          | Remove                        | Not in free MVP. Adds background-job/scheduler/sync complexity and Pro assumptions.                                                     |
| Country switcher / multi-country | `CountrySwitcher`, `COUNTRIES`                                                                   | Algeria, Algeria extended, Morocco/Tunisia/Egypt placeholders, Pro locks.                                                 | Remove for MVP                | Product is Algeria-only for now. Keep internal architecture future-friendly, but hide multi-country UI.                                 |
| Pro plan toggle/locks            | `ProLock`, `ProBadge`, `plan.ts`, sidebar                                                        | localStorage demo Pro unlock.                                                                                             | Remove                        | Direct conflict with free-only/no-licensing/no-paid-pro scope.                                                                          |
| Lovable error capture            | `lovable-error-reporting.ts`, root error boundary                                                | Calls `window.__lovableEvents` if present.                                                                                | Remove                        | Not aligned with no telemetry/no remote calls.                                                                                          |
| Example server function          | `src\lib\api\example.functions.ts`                                                               | TanStack Start sample server function.                                                                                    | Remove                        | Not relevant to WordPress admin plugin architecture.                                                                                    |

## 3. Free plugin scope audit

### Belongs in free MVP

- Algeria dataset foundation.
- Correct 58 official wilayas.
- Clear handling for optional delegated areas only if the dataset is real and they are not mislabeled as official wilayas.
- Admin UI for reviewing and managing shipping-zone intent.
- Read-only WooCommerce diagnostics first.
- Checkout protection diagnostics: identify missing methods, fallback risk, duplicate/conflicting zones, and manual zones.
- Preview/dry-run plan before any write.
- Later safe apply engine that only writes after explicit confirmation.
- CSV import/export if it stays simple and local.
- French/Arabic support from the start, with proper RTL handling.

### Scope creep / not for MVP

- Pro locks and demo upgrade flows.
- Licensing.
- Telemetry or Lovable event reporting.
- Remote Yaxii API calls.
- Provider APIs.
- Yalidine, ZR, Maystro, or shipment sending.
- Full YSF sync implementation.
- Automations.
- Multi-country UI.
- Product marketplace/cross-sell page.
- Custom commune-level shipping engine in first release.
- Dashboard marketing nudges.
- Destructive reset actions before real backend safety exists.
- Auto-sync after edits before a preview/apply safety model exists.

## 4. WordPress/WooCommerce integration risk audit

### Routing inside wp-admin

TanStack Router can work as a client-side admin app, but current routes are web-app paths like `/manager` and `/preview`. In wp-admin, they need to run under one admin page slug, likely using hash routing or memory/history routing scoped to the admin page. Direct browser paths will not map cleanly to WordPress admin without rewrite work.

### Asset loading

Current build is TanStack Start/Lovable SSR-oriented. WordPress needs deterministic static assets enqueued with `wp_enqueue_script`, `wp_enqueue_style`, dependency/version handling, and no external CDN. The Vite base path, manifest, output directory, and asset URLs need to be adapted.

### REST API bridge

No REST bridge exists. The real app will need WordPress REST endpoints for:

- WooCommerce status and dependency checks
- Dataset reads
- Plugin settings persistence
- WooCommerce shipping zone diagnostics
- Preview plan generation
- Later apply execution
- CSV import/export

### Nonce/capability checks

All future REST endpoints must enforce nonces and capabilities. Minimum likely capability: `manage_woocommerce` for Woo reads/writes, possibly `manage_options` for plugin settings depending on scope.

### WooCommerce dependency guard

No guard exists. The plugin should:

- Detect WooCommerce active/inactive
- Show a clear admin notice or app state if missing
- Avoid fatal references to Woo classes/functions before checking availability
- Avoid loading unnecessary app actions where Woo is absent

### Data persistence

Current data is mock/localStorage/React state. Real persistence must decide what belongs in:

- Plugin options
- Versioned dataset files
- Transients/cache for diagnostics snapshots
- Import records
- Preview/apply logs

### Shipping zone read/write safety

This is the highest backend risk. WooCommerce shipping zones and methods are mutable site configuration. The plugin needs a conservative ownership model:

- Read all zones first.
- Detect manual vs Yaxii-managed zones with explicit metadata.
- Never overwrite manual zones by default.
- Generate a preview plan before writing.
- Apply idempotently.
- Log actions.
- Roll back or at least report partial failures.
- Handle duplicated region definitions and Rest of World fallbacks.

### Dataset size/performance

58 wilayas are small, but full commune/postal-code data may be larger. Avoid shipping giant JS state into every admin page. Load only on the plugin screen, and consider JSON dataset chunks or REST endpoints if commune-level views grow.

### WordPress.org compliance

Risk areas:

- No telemetry/remote calls unless opt-in and clearly disclosed. Best path: no telemetry.
- No external CDN assets.
- No aggressive upsells or disabled Pro locks in a free-only first version.
- Clear, local-only behavior.
- Proper escaping/sanitization in PHP.
- Proper capability checks.
- No misleading "Install" buttons for other products.
- Source distribution for built assets should include source, build instructions, and license-compatible dependencies.

### Translation/i18n

The React prototype has hardcoded English/French/Arabic strings. A WordPress plugin needs a real i18n strategy:

- PHP strings with WordPress translation functions.
- React strings extracted or passed through a translation layer compatible with WordPress.
- Text domain: likely `yaxii-shipping-manager`.
- Avoid translating machine keys/status slugs.

### RTL/Arabic/French support

Current `components.json` has `rtl: false`. Some Arabic names are displayed with `dir="rtl"`, which is a start, but full RTL admin support is not designed. French accents and Arabic display must be verified after encoding/build changes.

### Accessibility

Risk areas:

- Blurred locked content under `ProLock`.
- Wizard progress dots as buttons.
- Custom table/grid controls.
- Toast-only feedback.
- Dialog focus behavior once mounted inside wp-admin.
- Color-only status indicators.
- Keyboard navigation through large tables and sidebars.

### Build output and source distribution

Current app has no WordPress plugin build contract. Needs:

- A stable output folder, probably `assets/dist`.
- Manifest-based enqueue or fixed filenames.
- Source files included in distribution if required.
- No server-only TanStack Start output for WordPress admin.
- Clear build command and minimum Node/Bun decision.

## 5. Naming audit

### Yaxii Shipping Manager

Practical verdict: acceptable and flexible. It describes a broader admin tool, not only zones. Best fit if the product will eventually include diagnostics, preview, CSV, and safe apply.

Risk: "Manager" is generic. The UI and WordPress.org description must quickly say "for Algeria WooCommerce shipping zones" so the value is obvious.

### Yaxii Shipping Zones

Practical verdict: clear for the first technical job. It matches the current prototype text in several places.

Risk: too narrow if the plugin grows into diagnostics, checkout protection, import/export, and setup guidance. It also sounds like the plugin writes Woo zones immediately, which the MVP should not do at first.

### Yaxii DZ Shipping

Practical verdict: geographically clear and compact.

Risk: "DZ" is less friendly for non-technical merchants and may feel less polished in WordPress.org search/results. It also does not explain the WooCommerce zone-management angle.

### Yaxii Shipping Tools

Practical verdict: broad and safe.

Risk: too vague. It sounds like a toolbox rather than a focused setup assistant.

### Naming verdict

Keep `Yaxii Shipping Manager` for now. Do not rename in this task. The UI copy should consistently pair it with a clarifier such as "Algeria shipping setup for WooCommerce". Avoid mixing `Yaxii Shipping Zones` and `Yaxii Shipping Manager` in the app until a final name is chosen.

## 6. MVP recommendation

### Smallest useful MVP

The smallest useful free MVP is a local wp-admin tool that helps Algerian WooCommerce merchants see what shipping setup they have, select the 58 official wilayas they serve, configure intended home/stop-desk prices, and generate a safe preview plan before any write action exists.

### Must-have screens

- Dashboard: quiet setup health summary and next action.
- Setup wizard: dataset choice, wilaya selection, default prices.
- Shipping Manager: free table for wilayas, enabled state, home/stop-desk prices, and read-only Woo status.
- Diagnostics: read-only WooCommerce checks plus checkout simulator.
- Preview Plan: dry-run plan only at first.
- Settings: defaults, language/display preference, manual-zone protection.

### Must-have backend capabilities

- WordPress plugin bootstrap and admin menu page.
- React app mount inside wp-admin.
- Local asset enqueue with no CDN.
- WooCommerce dependency guard.
- REST nonce and capability checks.
- Dataset loading for 58 official wilayas.
- Settings persistence.
- Read-only WooCommerce zone/method diagnostics.
- Preview planner that computes intended create/update/skip/conflict actions without writing.

### Should stay mocked for now

- Actual apply/write engine until preview planner is proven.
- CSV import parsing beyond a UI placeholder or narrow validation.
- Full commune-level shipping logic.
- YSF detection/sync.
- Provider APIs.
- Automations.
- Multi-country datasets.
- Product marketplace actions.

### Should be deleted or hidden from first release

- Pro locks and all upgrade buttons.
- Products page.
- Automations page.
- Multi-country switcher.
- Lovable event reporting.
- Example server function.
- Pro feature registry in `plan.ts`.
- Dashboard Pro nudges.
- Dangerous reset action.
- Auto-sync after edits.

### Can remain as "coming later"

- YSF sync, as a disabled informational panel only.
- CSV export/import, if marked local and not Pro.
- Safe apply engine, after read-only diagnostics and preview planner.
- Commune-level view, if clearly read-only dataset browsing.

## 7. Implementation roadmap preview

1. `TASK-001 Plugin foundation + React mount` - Create the WordPress plugin bootstrap, admin menu page, local asset enqueue, React mount point, dependency guard, and a static Vite build target suitable for wp-admin.
2. `TASK-002 Dataset hardening` - Replace the mock Algeria data with a verified local dataset model for 58 official wilayas, correct delegated-area labeling, and clean French/Arabic encoding.
3. `TASK-003 Read-only WooCommerce diagnostics` - Add REST endpoints that inspect WooCommerce shipping zones/methods safely and return missing, duplicate, manual, fallback, and checkout-risk findings.
4. `TASK-004 Preview planner` - Generate a dry-run plan from selected wilayas/settings and current WooCommerce state, with create/update/skip/conflict results and no writes.
5. `TASK-005 Safe apply engine` - Add explicit, nonce-protected, capability-checked write actions that only apply the previewed plan, preserve manual zones by default, and log outcomes.

## 8. Final verdict

- Is the prototype usable as a base? Yes, as a UI exploration base. No, not as a direct WordPress plugin foundation yet.
- Is the product scope currently too broad? Yes. It includes Pro, automations, multi-country, YSF sync, product cross-sells, and fake write flows that should not be in the free MVP.
- Biggest risk: shipping-zone write safety. A bad apply engine can damage merchant checkout configuration. Read-only diagnostics and preview planning must come first.
- What should we do next? Start `TASK-001 Plugin foundation + React mount`, while stripping the first implementation scope down to free, local, Algeria-only, read-first behavior.
