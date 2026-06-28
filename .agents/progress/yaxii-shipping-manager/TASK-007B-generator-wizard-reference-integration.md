# TASK-007B - Generator Wizard Reference Integration

Date: 2026-06-28

## Goal

Integrate the latest Lovable Generator Wizard visual/UX direction into the real WordPress admin app while keeping the flow wired to the existing read-only dataset, diagnostics, preview, and disabled apply contracts.

## Scope

Frontend admin UI implementation only. No PHP endpoints, WooCommerce writes, provider imports, checkout fields, YSF sync, telemetry, licensing, Pro locks, or CSV backend were added.

## Reference inspected

- `.agents/references/yaxii-shipping-hub-03`
- Reference wizard shell, stepper/progress UI, start cards, coverage grid, commune panel, method cards, pricing table, safety step, preview placement, and disabled apply copy were inspected.
- The untracked reference app contains its own nested `.git`; it was not modified or staged.

## Files changed

- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-BCo4HDco.js` removed by rebuilt asset hash
- `assets/admin/assets/main-CbyWoWLR.css` removed by rebuilt asset hash
- `assets/admin/assets/main-C1D7I7E5.js`
- `assets/admin/assets/main-CJt_0NmW.css`

## Files created

- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/components/generator/PreviewPlanPanel.tsx`
- `admin-app/src/components/generator/types.ts`
- `admin-app/src/lib/generator/methods.ts`
- `admin-app/src/lib/generator/pricing.ts`
- `.agents/progress/yaxii-shipping-manager/TASK-007B-generator-wizard-reference-integration.md`

## What was before

- The Generator Wizard lived inside `admin-app/src/routes/index.tsx`.
- The wizard used the older sequence: setup path, dataset, labels, methods, default prices, wilaya selection, review.
- Communes were not visible.
- CSV appeared as a path but not as the redesigned section.
- Home delivery and office/stopdesk behavior followed the older locked-settings wording.
- Preview worked, but the wizard did not match the latest reference UX.

## What changed

- Extracted wizard-specific UI and preview display into generator components/helpers.
- Rebuilt the wizard around the reference-style stepper shell and merchant-first flow:
  1. Start
  2. Wilayas
  3. Communes
  4. Methods
  5. Prices
  6. Names
  7. Safety
  8. Preview
- Kept `routes/index.tsx` focused on app shell, tabs, diagnostics, zones, settings, and route-level state.
- Persisted the latest preview context on the Generator screen after the wizard closes.

## Wizard changes

- Added reference-style progress bar, clickable completed steps, animated step transitions, compact top header, and footer navigation.
- Added better empty states for no selected wilayas and no enabled methods.
- Moved preview into the final wizard step as the main final action.
- Kept apply disabled with explicit copy beside the preview action and in the preview panel.

## Communes option behavior

- Added the required choice:
  - `Show communes in this setup`
  - `Skip communes for now`
- Skip mode does not load commune data and shows: all communes inside selected wilayas are covered at wilaya level.
- Show mode lists selected wilayas and lazy-loads communes only when a wilaya row is opened.
- Commune search filters loaded commune rows.
- Commune rows are informational/read-only.
- No commune exclusions, commune-level price inputs, or raw commune JSON imports were added.

## CSV section behavior

- Added an honest CSV import section in the wizard start step.
- `Import CSV` and `Download sample` buttons are disabled.
- Copy says CSV import is coming soon and sample download is UI-only until a backend exists.
- No CSV upload, parse, import, download, or fake success behavior was added.

## Delivery methods behavior

- Home delivery and Office / Stopdesk remain default method slots, but the wizard preview draft allows enabling/disabling them because the existing preview sanitizer accepts fixed method keys with `enabled: false`.
- Method labels are editable for all fixed slots.
- Custom methods are limited to the existing safe keys: `custom_1` and `custom_2`.
- The `Add method` button enables the next available custom slot and disables when both custom slots are already enabled.
- No unlimited method creation was added.

## Preview behavior

- The wizard still calls `POST /wp-json/yaxii-shipping-manager/v1/preview`.
- The preview request sends:
  - `selectedWilayaCodes`
  - `pricingRows`
  - `methods`
  - `zoneNameFormat`
  - `zonePrefix`
  - `regionLabelFormat`
- Preview output shows:
  - readiness card
  - selected wilayas count
  - commune coverage summary
  - enabled methods
  - prices summary
  - preview hash and contract version
  - plan groups
  - disabled apply state
- Copy states: `This is a preview only. No WooCommerce changes were made.`

## What remains mocked/not implemented

- Real WooCommerce apply engine.
- WooCommerce shipping zone create/update/delete.
- WooCommerce shipping method add/update.
- CSV backend and sample download route.
- Commune-level pricing.
- Checkout field changes.
- Provider imports.
- YSF sync.

## Security notes

- No PHP or REST endpoint code was changed.
- Existing REST nonce/capability behavior remains unchanged.
- The wizard uses existing admin API clients and the WordPress REST nonce from bootstrap config.
- No telemetry, analytics, remote calls, CDN assets, licensing, or Pro locks were added.

## WooCommerce safety notes

- No WooCommerce write APIs were added.
- Preview remains read-only.
- Apply remains disabled.
- Manual-zone protection copy remains visible.
- Focused changed-file write scan found no `save()`, `delete()`, `add_shipping_method`, or shipping zone create/update/delete patterns.
- Broader write scan found only the existing settings-save REST path, not WooCommerce zone writes.

## WordPress.org compliance notes

- Built assets remain local under `assets/admin/`.
- No Lovable telemetry/error capture was imported.
- CSV and apply features are clearly labeled as unavailable instead of pretending to work.
- No public-site links, hidden tracking, remote dependencies, obfuscation, or upsell/pro locks were added.

## QA guard findings

- `clean-code-guard`: wizard logic was extracted from the large route into focused generator components and helpers; unused imports from the extraction were removed.
- `docs-guard`: this report describes actual implemented behavior and labels unavailable CSV/apply behavior clearly.
- `wp-plugin-development`: plugin bootstrap and admin asset architecture were not changed; generated assets were rebuilt.
- `wp-guard`: no PHP or endpoint behavior changed; frontend continues using existing REST clients.
- `woo-guard`: no WooCommerce writes were introduced; apply remains disabled.
- `wp-rest-api`: no REST routes changed; communes use the existing `/dataset?mode=current&include=communes&wilaya_code=NN` client only when a wilaya is opened.
- `wp-plugin-directory-guidelines`: no tracking, remote dependency, external assets, licensing, obfuscation, or misleading paid-feature UI was added.

## Checks run

- `node .agents/skills/wp-project-triage/scripts/detect_wp_project.mjs`
- `node .agents/skills/wp-plugin-development/scripts/detect_plugins.mjs`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Source map scan under `assets/admin`
- Forbidden string scan over `admin-app/src`, `src`, and `assets/admin`
- Raw dataset bundling scan over built JS
- Focused WooCommerce write scan over changed frontend source
- Broader WooCommerce write scan over `src` and `admin-app/src`
- `git diff --check`
- `wp --path="C:\Users\Aymen\Local Sites\yaxii-ysz\app\public" option get siteurl`
- `wp --path="C:\Users\Aymen\Local Sites\yaxii-ysz\app\public" plugin status yaxii-shipping-manager`
- `wp --path="C:\Users\Aymen\Local Sites\yaxii-ysz\app\public" plugin status woocommerce`
- `git status --short --untracked-files=all`

## Check results

- Project detector: returned `unknown` because the checkout is plugin-root level; manual inspection confirmed `yaxii-shipping-manager.php` is the plugin bootstrap.
- Plugin detector: returned no plugins; manual header inspection confirmed the plugin file and GPL-compatible header.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 8 pre-existing Fast Refresh warnings in shared UI/main files.
- `npm run build`: passed; generated `assets/admin/assets/main-C1D7I7E5.js` and `assets/admin/assets/main-CJt_0NmW.css`.
- Source map scan: passed; no `.map` files under `assets/admin`.
- Forbidden string scan: passed.
- Raw dataset bundling scan: passed.
- Focused WooCommerce write scan: passed with no matches.
- Broader WooCommerce write scan: only existing `src/Rest/SettingsController.php` settings-save path matched.
- `git diff --check`: passed with Windows CRLF working-copy warning for `assets/admin/.vite/manifest.json`.
- PHP lint and `composer dump-autoload`: not run because no PHP files changed.

## Browser smoke result or blocker

Browser smoke was blocked because the local WordPress runtime cannot connect to the database. These WP-CLI checks failed with `Error: Error establishing a database connection.`:

- `wp option get siteurl`
- `wp plugin status yaxii-shipping-manager`
- `wp plugin status woocommerce`

Because WordPress could not bootstrap, logged-in wp-admin verification of app load, generator steps, preview, diagnostics shortcut, and disabled apply could not be performed in this task.

## Known risks

- The settings persistence contract still locks home and office methods on save. This task intentionally relaxes those defaults only in the wizard preview draft because the preview contract accepts disabled fixed keys.
- Commune counts appear after a selected wilaya's commune list is loaded; the wizard does not fetch all communes by default.
- Runtime wp-admin QA is still needed after the local database is available.
- The untracked reference app remains in `.agents/references/yaxii-shipping-hub-03/` and includes a nested `.git`; it was not staged.

## Blockers

- Local WordPress database connection failure blocked browser smoke.

## Next recommended task

Restore the local WordPress database/runtime and run a logged-in wp-admin smoke pass for TASK-007B, then address any browser-only UI issues found in a narrow follow-up task.

## Commit hash

Pending until commit; final response records the committed hash.
