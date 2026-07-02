# TASK-012K - Generator Removal Tabs Polish

## Date

2026-07-02

## Goal

Clean up Generator Coverage labels and copy, remove duplicate coverage actions, simplify the Remove Yaxii setup modal, and remove unwanted vertical overflow from the top tabs without changing backend behavior.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/012k-generator-removal-tabs-polish`
- Base checkpoint confirmed locally: `69eb754` (`TASK-012J: polish shipping editor status and layout`)
- Pre-existing unrelated dirty files were present before this task and were left unstaged.

## Scope

- Generator Coverage dataset labels, selected-count summary, legacy-mode copy, repair copy, and coverage actions.
- Settings Advanced tools Remove Yaxii setup modal copy only.
- Top navigation horizontal/vertical overflow classes and focus styling.
- Matching docs and rebuilt admin assets.

No SafeApplyEngine behavior, WooCommerce write/delete path, manual-zone adoption, CSV backend, commune-level pricing, provider import, YSF sync, zone-name apply, telemetry, licensing, Pro lock, remote asset, or external font behavior was added.

## Files changed

- `admin-app/src/components/generator/GeneratorStartStep.tsx`
- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/data/default-settings.ts`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-B_fTu-Go.css` removed by rebuild
- `assets/admin/assets/main-DWU-8Emt.js` removed by rebuild
- `assets/admin/assets/main-B9fh4DN5.css`
- `assets/admin/assets/main-DVMcxBtU.js`
- `docs/GENERATOR-WIZARD.md`
- `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SETTINGS-CONTRACT.md`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-012K-generator-removal-tabs-polish.md`

## What was before

- Coverage dataset options showed the currently loaded dataset count on both options, which made both options read as `69 wilayas` or both read as `58 wilayas`.
- Legacy mode displayed developer-facing provenance copy.
- Repair copy used technical wording around managed zones and methods.
- Coverage had both `Select all` and `All wilayas` controls that selected every wilaya.
- The removal modal led with scary/testing copy.
- Top navigation allowed vertical overflow inside the tabs wrapper.

## Dataset label fix

- Generator Coverage option labels are now stable:
  - `Current dataset`
  - `Legacy 58-compatible dataset`
- Loaded dataset count moved out of the option labels into the selected dataset summary:
  - `69 wilayas available`
  - `58 wilayas available`
- The selected count remains separate as `{selected}/{available} selected`.

## Generator copy cleanup

- Removed the visible copy `Derived from the user-verified first 58 records of the current normalized dataset. Additional current dataset wilayas are not included in this mode.`
- Legacy mode now says: `Use this if your store still works with the older 58-wilaya setup.`
- Repair copy now says: `Recreate missing Yaxii zones or methods. Manual zones stay protected.`

## Coverage action cleanup

- Kept `Select all`.
- Kept `Clear all`.
- Removed the duplicate `All wilayas` checkbox from Generator Coverage.

## Removal modal copy cleanup

- Modal title remains `Remove Yaxii setup?`.
- Main copy remains focused on scope: `This removes only Yaxii-managed WooCommerce shipping zones and methods. Manual WooCommerce zones will not be touched.`
- Added softer recovery copy: `You can generate a new Yaxii setup again later.`
- Confirmation still asks the merchant to type `REMOVE`.
- Button remains `Confirm removal`.
- Technical removal candidates, blockers, warnings, and protected manual-zone details remain behind `View technical details`.
- Backend-required confirmation remains `REMOVE YAXII SETUP`.

## Tabs overflow fix

- Top navigation now uses horizontal overflow with vertical overflow hidden.
- Nav buttons have rounded focus rings and padding so keyboard focus remains visible.
- Active tab underline no longer relies on a negative bottom offset that could be clipped by vertical overflow handling.

## Browser/runtime smoke result or blocker

- Browser automation was blocked: `agent-browser doctor --offline --quick` hung past 30 seconds and had to be stopped.
- WP-CLI reached LocalWP:
  - `wp option get siteurl` returned `http://yaxii-ysz.local`
  - administrator user `dev` exists
- Read-only REST smoke passed through WP-CLI:
  - `GET /wp-json/yaxii-shipping-manager/v1/managed-setup/removal-preview` returned `status=200`
  - `removalAvailable=true`
  - `managedZoneCount=58`
  - `manualProtectedZoneCount=0`
  - `requiredConfirmationText=REMOVE YAXII SETUP`
- No browser click smoke was completed. No removal or apply request was executed.

## What changed

- Generator Coverage is clearer for merchants and no longer makes both dataset options look like the active dataset.
- Legacy and repair explanations are shorter and merchant-facing.
- Coverage action buttons no longer duplicate select-all behavior.
- Removal modal copy is simpler while preserving confirmation and technical details.
- Top navigation no longer creates a vertical scrollbar inside the tabs row.

## What still remains mocked/not implemented

- CSV backend remains unimplemented.
- Commune-level pricing remains unimplemented.
- Provider imports remain unimplemented.
- YSF sync remains disabled/informational.
- Manual-zone adoption remains unimplemented.
- Zone-name apply/update remains unimplemented.
- Exportable cleanup reports remain unimplemented.

## Security notes

- No PHP files changed.
- No REST route, nonce, capability, or request-sanitization behavior changed.
- No new file write, remote call, tracking, telemetry, or hidden API behavior was added.

## WooCommerce safety notes

- No SafeApplyEngine behavior changed.
- No new WooCommerce write path was added.
- No new WooCommerce delete path was added.
- Managed setup removal remains the only removal executor.
- Safe apply remains the only setup/repair writer.
- Manual WooCommerce zones and methods remain protected.

## WordPress.org compliance notes

- No licensing, telemetry, analytics, hidden tracking, remote dependency, external CDN asset, external font, obfuscation, aggressive upsell, or Pro lock was added.
- Built admin assets contain no source maps.
- Documentation was updated only where it described changed visible UI copy.

## QA guard findings

- `clean-code-guard`: pass; changes are scoped to existing UI components and avoid new abstractions or behavior changes.
- `docs-guard`: pass; updated docs match the changed UI copy and keep unsupported features out of scope.
- `woo-guard`: pass; no new WooCommerce write/delete path and no manual-zone update path.
- `wp-guard`: pass; no PHP, request handling, output escaping, or WordPress API surface changed.
- `wp-rest-api`: pass; REST contracts unchanged; read-only smoke confirmed removal-preview still returns backend confirmation text.
- `wp-plugin-directory-guidelines`: pass; no remote assets, tracking, licensing, obfuscation, or misleading paid UI added.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- source map scan under `assets/admin`
- restricted phrase scan
- raw dataset bundling scan over built JS
- external asset scan
- WooCommerce write/delete source-diff scan
- built bundle old-copy scan
- WP-CLI read-only removal-preview smoke
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- TypeScript typecheck passed.
- ESLint passed with 8 existing Fast Refresh warnings in shared UI files.
- Admin build passed with the existing Vite tsconfig-paths notice and large chunk warning.
- Source map scan passed; no `.map` files under `assets/admin`.
- Restricted phrase scan passed; no matches for the blocked phrases.
- Raw dataset bundling scan passed; no matches for raw commune source fields in built JS.
- Targeted external asset scan passed; no Google Fonts, remote CSS, or remote JS found.
- WooCommerce write/delete source-diff scan passed; no new write/delete APIs in changed source.
- Built bundle old-copy scan passed for removed legacy/removal phrases.
- WP-CLI read-only removal-preview smoke passed.
- Browser automation was blocked by hung `agent-browser doctor`.
- `git diff --check` passed with line-ending warnings only.

Composer autoload and PHP lint were not run because no PHP files or autoload configuration changed. PHPCS and PHPStan were not run because no `phpcs.xml`, `phpcs.xml.dist`, or `phpstan.neon` is configured in this plugin root.

## Known risks

- Browser UI behavior still needs manual or working automation verification.
- The current LocalWP store has removable Yaxii-managed setup according to the read-only removal preview; removal was not executed in this task.
- The admin JS bundle remains above Vite's size warning threshold.
- Existing unrelated dirty files remain in the worktree.

## Blockers

- Browser automation is blocked by `agent-browser doctor --offline --quick` hanging.

## Next recommended task

Run a manual wp-admin browser smoke for Generator Coverage, Settings removal modal, and mobile top navigation once browser automation is healthy.

## Commit hash, if committed

Pending commit.
