# TASK-014I - Final Release Prep: Slug, CSS Firewall, Version, Package

Date: 2026-07-03

## Goal

Prepare Yaxii Shipping Manager for final owner-led WordPress.org release testing by setting first public release metadata, avoiding the Yaxii Smart Form Shipping Manager admin slug collision, tightening scoped wp-admin CSS containment, rebuilding runtime assets, deploying runtime files, rebuilding the clean release package, and documenting remaining manual submission work.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git repository: yes, root is the plugin root.
- Starting branch: `task/014h-rebuild-release-package-plugin-check`
- Task branch: `task/014i-final-release-prep-slug-css-package`
- Starting HEAD: `e2d4e95 TASK-014H: rebuild release package and rerun plugin check`
- TASK-014H commit `e2d4e95` exists locally.
- No nested `app/.git` repository was found.
- Pre-existing unrelated dirty files were present before this task and were not staged.

## Docs and Audits Read

- `AGENTS.md`
- `CLAUDE.md`
- `.agents/skills/clean-code-guard/SKILL.md`
- `.agents/skills/clean-code-guard/references/ai-failure-modes.md`
- `.agents/skills/docs-guard/SKILL.md`
- `.agents/skills/wp-guard/SKILL.md`
- `.agents/skills/woo-guard/SKILL.md`
- `.agents/skills/wp-plugin-directory-guidelines/SKILL.md`
- `.agents/skills/wp-plugin-directory-guidelines/references/guideline-review-checklist.md`
- `readme.txt`
- `yaxii-shipping-manager.php`
- `.distignore`
- `docs/RELEASE-PACKAGING.md`
- `docs/WPORG-RELEASE-COPY-SCREENSHOT-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014G-wporg-release-copy-screenshot-audit.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014H-rebuild-release-package-plugin-check.md`
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/RUNTIME-SMOKE.md`
- Local Yaxii Smart Form source under `C:\Users\Aymen\Local Sites\ysf-pro-plugin\app\public\wp-content\plugins\yaxii-smart-form-refactored`

## Scope

Included:

- Version metadata update to `1.0.0`.
- WordPress admin page slug/menu label audit and scoped fix.
- Scoped admin CSS firewall and modal portal containment.
- Admin asset rebuild.
- Local static/build checks.
- Server runtime deployment.
- Clean release folder and zip rebuild.
- Package hygiene scans.
- Plugin Check attempt if WP-CLI environment permits it.

Excluded:

- WordPress.org submission.
- Screenshots.
- Destructive WooCommerce actions.
- Remove Yaxii setup execution.
- Generator apply execution.
- Yaxii COD Theme changes.
- Manual-zone adoption/editing/conversion.
- Yaxii COD bridge or `yaxii_zone_map` writes.
- CSV backend, commune-level pricing, provider imports, YSF sync.
- Telemetry, licensing, Pro locks, remote assets, external fonts, or hidden calls.

## Files Changed

- `yaxii-shipping-manager.php`
- `readme.txt`
- `src/Admin/AdminPage.php`
- `admin-app/src/styles.css`
- `admin-app/src/components/ui/alert-dialog.tsx`
- `admin-app/src/components/ui/sheet.tsx`
- `admin-app/src/components/ui/drawer.tsx`
- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `assets/admin/manifest.json`
- `assets/admin/assets/main-BoOGZ-gx.js`
- `assets/admin/assets/main-Rog5wkY2.css`
- `docs/RELEASE-PACKAGING.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/WPORG-RELEASE-COPY-SCREENSHOT-AUDIT.md`
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014I-final-release-prep-slug-css-package.md`

## Files Created

- `assets/admin/assets/main-BoOGZ-gx.js`
- `assets/admin/assets/main-Rog5wkY2.css`
- `.agents/progress/yaxii-shipping-manager/TASK-014I-final-release-prep-slug-css-package.md`

## What Was Before

- Plugin header version, internal version constant, readme stable tag, changelog, and upgrade notice were `0.1.0`.
- This plugin used the admin page slug `yaxii-shipping-manager`.
- Local Yaxii Smart Form source also used `yaxii-shipping-manager` for its Shipping Manager page, creating a real admin slug collision.
- The WooCommerce submenu label was `Yaxii Shipping`.
- The React app had some root-scoped reset rules, but alert dialogs, sheets, and drawers could portal outside the app scope, and the full-screen generator used `z-[100000]`.
- Built assets pointed to `assets/main-BxHh_ano.js` and `assets/main-BvJEBEQL.css`.

## What Changed

- Set release-facing version metadata to `1.0.0` in the plugin header, internal constant, readme stable tag, changelog, and upgrade notice.
- Changed only the WordPress admin page/menu slug to `yaxii-wc-shipping-manager`.
- Changed the visible WooCommerce and Tools submenu label to `Shipping Manager`.
- Kept WordPress.org plugin slug, text domain, REST namespace, option names, database keys, React mount ID, and asset handles unchanged.
- Did not add an old-slug redirect because the old slug belongs to Yaxii Smart Form in the local source and redirecting could hijack that page.
- Added/expanded scoped CSS firewall rules under the plugin admin app/root for box sizing, form controls, SVG sizing, focus rings, modal/dialog layers, tab overflow, and visually hidden text.
- Routed alert-dialog, sheet, and drawer portals into the plugin admin portal container.
- Reduced the Generator wizard full-screen layer from `z-[100000]` to `z-[1000]`.
- Rebuilt admin assets to `assets/main-BoOGZ-gx.js` and `assets/main-Rog5wkY2.css`.
- Updated runtime smoke and release audit docs to use `wp-admin/admin.php?page=yaxii-wc-shipping-manager`.
- Updated release packaging docs to state that ignored generated `vendor/` runtime files must be copied into the package and verified when Composer autoload is required.

## Version Result

- Plugin header version: `1.0.0`
- `YAXII_SHIPPING_MANAGER_VERSION`: `1.0.0`
- Readme stable tag: `1.0.0`
- Readme changelog: `1.0.0`
- Readme upgrade notice: `1.0.0`
- Header/stable tag check: passed.

## Admin Slug/Menu Result

- New admin URL: `wp-admin/admin.php?page=yaxii-wc-shipping-manager`
- Old slug `yaxii-shipping-manager` is no longer used for this plugin's main menu.
- Visible submenu label: `Shipping Manager`
- Page title: `Yaxii Shipping Manager`
- Local Yaxii Smart Form audit found its Shipping Manager controller and menu still use `yaxii-shipping-manager`, so this task avoids that collision.
- No REST namespace, option name, text domain, or database key changed.

## CSS Firewall Result

- CSS remains scoped under `#yaxii-shipping-manager-admin-app .yaxii-shipping-manager-app` and the existing `.yaxii-shipping-manager-admin` wrapper.
- Form/control reset, SVG sizing, focus, dialog, popper, and tab overflow rules were added only inside the plugin admin root.
- Alert dialog, sheet, and drawer portals now use the plugin admin portal container.
- No global wp-admin reset was added.

## Local QA Result

- `php -l yaxii-shipping-manager.php`: passed.
- `php -l src/Admin/AdminPage.php`: passed.
- `composer validate --no-check-publish`: passed.
- `composer dump-autoload`: passed.
- `npm run typecheck`: passed.
- Initial `npm run lint`: failed only on Prettier CRLF normalization in touched files.
- `npx prettier --write` on touched admin-app files: passed.
- `npm run lint`: passed with 8 pre-existing Fast Refresh warnings.
- `npm run build`: passed, with Vite's existing large chunk warning.
- Source map scan under `assets/admin`: passed, no `.map` files.
- Header/stable tag check: passed.
- `git diff --check`: passed, with line-ending warnings for pre-existing unrelated dirty files.

## Local/Browser Smoke Result

Blocked locally.

Evidence:

- `wp core version` returned `7.0`.
- `wp plugin status yaxii-shipping-manager` failed with `Error establishing a database connection`.
- `wp eval` for the admin URL failed with the same database connection error.

Because the local WordPress database is unavailable, authenticated browser smoke could not honestly verify the new admin URL, menu label, modals, tabs, console, or notice flash. Manual browser verification remains required on a working site.

## Server Backup Path

`/home/u538716307/backups/yaxii-shipping-manager/task-014i-20260703-154130`

## Files Deployed

- `yaxii-shipping-manager.php`
- `readme.txt`
- `src/Admin/AdminPage.php`
- `assets/admin/`

## Remote Verification Result

- Remote manifest points to `assets/main-BoOGZ-gx.js` and `assets/main-Rog5wkY2.css`.
- Remote `assets/admin` contains no `.map` files.
- Remote plugin header and `YAXII_SHIPPING_MANAGER_VERSION` are `1.0.0`.
- Remote `AdminPage::MENU_SLUG` is `yaxii-wc-shipping-manager`.
- Remote visible submenu label is `Shipping Manager`.
- Remote page title is `Yaxii Shipping Manager`.
- `wp plugin is-active yaxii-shipping-manager`: active.
- No remote database writes, Generator apply action, Remove setup action, or Yaxii COD Theme changes were performed.

## Release Folder Path

`release/yaxii-shipping-manager`

## Release Zip Path

`release/yaxii-shipping-manager.zip`

## Package Hygiene Result

- Rebuilt `release/yaxii-shipping-manager` and `release/yaxii-shipping-manager.zip`.
- Zip extraction root: `yaxii-shipping-manager/`.
- Required files/directories present: `yaxii-shipping-manager.php`, `readme.txt`, `languages/`, `assets/`, `src/`, `vendor/`, `data/`, `composer.json`, and cleaned `admin-app/`.
- Manifest verification passed for `assets/main-BoOGZ-gx.js` and `assets/main-Rog5wkY2.css`.
- Hidden file scan: passed, 0 dotfiles/dotdirs in package and extracted zip check.
- Markdown scan: passed, 0 markdown files in package and extracted zip check.
- Source map scan: passed, 0 source maps.
- `node_modules` scan: passed, 0 directories.
- `.agents` scan: passed, 0 items.
- Exclusion checks passed for root `docs/`, `data/sources/`, nested `release/`, and archives.
- Version metadata check passed: header, constant, and stable tag are `1.0.0`.
- Release-facing `0.1.0` scan passed for plugin header/readme/composer metadata. Non-runtime `admin-app/package-lock.json` still contains dependency metadata with registry URLs and dependency versions, which is not plugin release metadata.
- Runtime external asset scan passed: no Google Fonts and no remote CSS/script enqueue or import.
- Runtime restricted phrase scan passed for `CSV imported successfully`, `commune-level pricing is available`, `__lovable`, `captureException`, and `0.1.0`.
- Runtime `telemetry`/`analytics` matches are only the readme FAQ that says the plugin does not send telemetry or analytics.

## Plugin Check Result or Blocker

Blocked locally.

Command:

`wp plugin check "release/yaxii-shipping-manager"`

Result:

`Error: Error establishing a database connection.`

Plugin Check did not pass in this task because the local WordPress database is unavailable. The owner still needs to run Plugin Check on a working WordPress test site before submission.

## What Was Not Changed

- No WooCommerce zones, methods, settings, registry records, or database rows were changed locally.
- No Generator apply action was run.
- No Remove Yaxii setup action was run.
- No Yaxii COD Theme file was modified.
- No manual-zone adoption/editing/conversion was added.
- No Yaxii COD bridge or `yaxii_zone_map` write was added.
- No CSV backend, commune-level pricing, provider import, or YSF sync was added.
- No telemetry, licensing, Pro lock, remote asset, external font, or hidden call was added.

## Security Notes

- The admin slug change is a WordPress admin routing change only.
- Permission handling remains through the existing capability helper.
- REST endpoints and permission callbacks were not changed.
- No new request inputs, option writes, nonces, or external calls were added.
- CSS changes are scoped to the plugin admin root and do not reset all wp-admin.

## WooCommerce Safety Notes

- WooCommerce write behavior was not changed.
- Existing safe apply and managed setup removal paths remain the only write/delete paths found by scan.
- No new `yaxii_zone_map` write was added; the only `yaxii_zone_map` source match remains the read-only compatibility detector.

## WordPress.org Compliance Notes

- Version metadata now uses an explicit `1.0.0` stable tag matching the plugin header.
- The WordPress.org plugin slug and text domain remain `yaxii-shipping-manager`.
- No trialware, telemetry, remote executable assets, external fonts, forced links, obfuscation, or license gates were added.
- Built runtime assets remain local under `assets/admin`.
- Final Plugin Check still needs a working WordPress database/test site.

## Checks Run

- Repo preflight: cwd, Git repo, branch, status, recent graph, TASK-014H commit existence.
- Local skill inspection under `.agents/skills`.
- Yaxii Smart Form slug audit from local source.
- `php -l` on changed PHP files.
- `composer validate --no-check-publish`.
- `composer dump-autoload`.
- `npm run typecheck`.
- `npm run lint`.
- `npm run build`.
- Source map scan.
- Restricted phrase scans.
- External asset scan.
- WooCommerce write/delete and `yaxii_zone_map` write scans.
- Header/stable tag comparison.
- `git diff --check`.
- Server runtime backup/deploy over SSH.
- Remote manifest/source-map/version/admin-slug/plugin-active verification.
- Release folder and zip rebuild.
- Package hygiene scans against the release folder and extracted zip.
- `wp plugin check "release/yaxii-shipping-manager"`.
- `git status --short --untracked-files=all`.

## Check Results

- Preflight passed, with pre-existing unrelated dirty files preserved.
- YSF local source confirmed a real admin slug collision with `yaxii-shipping-manager`.
- PHP lint passed.
- Composer validation passed.
- TypeScript passed.
- ESLint passed after Prettier line-ending normalization; remaining warnings are pre-existing Fast Refresh warnings.
- Build passed and generated current admin assets.
- No source maps under `assets/admin`.
- Restricted phrase scan found only expected negative `telemetry`/`analytics` statements in readme/docs.
- External asset scan found no Google Fonts, remote CSS, or runtime PHP remote script/style enqueue. Built JS contains bundled React diagnostic URLs; those are not enqueued external assets.
- WooCommerce write/delete scan found no new write path beyond existing safe apply/removal code.
- Header version equals readme stable tag.
- `git diff --check` passed.
- Remote deployment completed after a timestamped backup.
- Remote plugin remains active and points to the rebuilt admin assets.
- Package hygiene scans passed after rebuilding the release folder and zip.
- Plugin Check is blocked by local database connection failure, not passed.

## Known Risks

- Local and remote browser verification remain manual because the local DB is unavailable and remote login automation may loop.
- `Tested up to: 7.0` still needs final owner confidence before WordPress.org submission.
- `Contributors: yaxii` still needs owner confirmation as the WordPress.org username.
- CSS firewall is scoped and build-verified, but visual confirmation of modal layering still requires a browser session.
- Existing unrelated dirty files remain in the worktree and were not staged.

## Blockers

- Local WordPress database connection failure blocks local browser smoke and local Plugin Check.
- WordPress.org submission remains blocked until owner/manual screenshots and official Plugin Check pass on a working test site.

## Remaining Manual Tasks Before Submission

- Open `wp-admin/admin.php?page=yaxii-wc-shipping-manager` on a working test site.
- Confirm menu label/page title, tabs, modals, settings notice behavior, console, and screenshots.
- Capture WordPress.org screenshots.
- Run official Plugin Check on the rebuilt clean package.
- Confirm `Contributors: yaxii` and `Tested up to: 7.0`.

## Next Recommended Task

Use a working WordPress test site to run official Plugin Check against `release/yaxii-shipping-manager`, complete manual browser smoke on the new admin URL, and capture final screenshots for WordPress.org.

## Commit Hash, If Committed

Initial task commit pending at first report write; final commit hash is reported in the closeout because adding the hash to this tracked report would change the hash again.
