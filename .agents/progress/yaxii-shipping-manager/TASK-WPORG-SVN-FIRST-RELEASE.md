# TASK-WPORG-SVN-FIRST-RELEASE — Prepare WordPress.org SVN Release Upload

Date: 2026-07-24 (initial pass), 2026-07-25 (polish pass, this update)

## Polish pass (2026-07-25) — summary of changes on top of the initial pass

Per user follow-up request, before any SVN commit:

1. **Plugin header updated** (`yaxii-shipping-manager.php`, repo root): `Description` changed to `Create, preview, and manage Algeria WooCommerce shipping zones with protected manual zones and diagnostics.`; `Author URI: https://yaxii.dev` added. (Note: `Plugin URI` and `Author` were subsequently adjusted directly by the user/editor to `https://yaxii.dev/product/yaxii-shipping-manager/` and `Yaxii Dev` — left as-is, not authored by this task.)
2. **`readme.txt` rewritten** (repo root) for a more professional, SEO-oriented tone: new 143-character tagline, restructured `== Description ==` with bolded sub-sections ("Built for Algerian WooCommerce stores", "Protects what you already have", "Local-first, no tracking"), added a "Current scope" note, added `wilaya` tag. Claims kept consistent with actual implemented behavior (no new features claimed).
3. **`admin-app/` inclusion re-evaluated.** The initial pass excluded `admin-app/` (raw React/TS source) from SVN as a judgment call. On reinspection, this contradicted the project's own established convention: `.distignore` and `docs/RELEASE-PACKAGING.md` (from TASK-013B) explicitly document that `admin-app/` source *should* ship (for WordPress.org/GPL source availability of the built admin JS/CSS), excluding only `node_modules`, `.gitignore`, `.prettierignore`, `.prettierrc`, `components.json`, and `eslint.config.js`. The public GitHub repo (`origin/main`, confirmed public via `gh repo view`) was checked as the alternative "point to source" option, but its current tree does **not** contain `admin-app/` — only the compiled-assets structure — so it does not qualify as "ready" per the user's own fallback rule. Decision: **include cleaned `admin-app/` source in SVN**, matching established project convention. No GitHub source-code note was added to `readme.txt` since the source ships directly.
4. **Release folder and zip rebuilt** from the updated source (see below).
5. **A packaging defect was caught and fixed during rebuild**: the release folder briefly picked up `data/sources/` (raw, non-normalized candidate dataset material — explicitly forbidden) because the top-level `data/` copy included it; corrected to ship only `data/algeria/`. Also, a first attempt to copy full `admin-app/` (including `node_modules`) timed out mid-copy; the background process kept writing files after the tool-level timeout, which caused 5 dev-config files (`.gitignore`, `.prettierignore`, `.prettierrc`, `components.json`, `eslint.config.js`) to reappear in the release folder and SVN working copy after an apparently-clean rebuild. Caught by re-running the hygiene scan a second time; the already-built `.zip` was verified clean (created before the contamination) and used as the reference; the release folder and SVN `trunk`/`tags/1.0.0` were corrected to match. Final state re-verified clean across all three locations (release folder, `trunk/`, `tags/1.0.0/`) with matching file counts (167 files each).
6. **`trunk/` and `tags/1.0.0/` fully repopulated**: previous `svn add`-staged content was `svn revert`-ed, the working directories physically cleared, and refilled from the corrected release folder.
7. Final `svn status`: **409 lines, all `A`**, `trunk/` and `tags/1.0.0/` mirrored identically.
8. **Post-approval drift caught before commit**: after approval, the root `yaxii-shipping-manager.php` `Plugin Name` header was found changed (externally, to `Yaxii Shipping Manager – WooCommerce Shipping Zones for Algeria`, an SEO-suffixed name) versus what was staged. Re-diffed all other release-relevant files (`readme.txt`, `src/`, `data/algeria/`, `assets/`, `composer.json`) — only the plugin header differed. Synced the current header into the release folder and both SVN copies, re-ran `php -l`, rebuilt `release/yaxii-shipping-manager.zip`, and re-confirmed `svn status` was still 409/`A` before committing.
9. **Committed**: `svn commit -m "Initial release 1.0.0"` → **revision 3622006**. Password was read from `.env` at runtime and never printed; `--no-auth-cache` was used so it was not cached to disk.
10. **Post-commit verification (live SVN URL)**:
    - `trunk/readme.txt` — exists (r3622006)
    - `tags/1.0.0/readme.txt` — exists (r3622006)
    - `trunk/yaxii-shipping-manager.php` — exists (r3622006)
    - `tags/1.0.0/yaxii-shipping-manager.php` — exists (r3622006)
    - `trunk/` and `tags/1.0.0/` top-level listings both show plugin files directly (no nested `yaxii-shipping-manager/` folder)

## SVN revision (final)

**3622006**

## Public URL

`https://wordpress.org/plugins/yaxii-shipping-manager`

---

# Initial pass (2026-07-24) — original report body below

## Goal

Prepare the first WordPress.org SVN upload for Yaxii Shipping Manager v1.0.0: populate `trunk/` and `tags/1.0.0/` from the clean release source, run hygiene checks, stage with `svn add`, and stop for explicit approval before any commit.

## Scope

Release/packaging task only. No plugin product code was modified. Only the SVN working copy (outside the plugin git repo) was populated and staged.

## SVN URL

`https://plugins.svn.wordpress.org/yaxii-shipping-manager`

## SVN working folder

`C:\Users\Aymen\Desktop\wporg-yaxii-shipping-manager-svn`

## Release source folder

`C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager\release\yaxii-shipping-manager`

## Version verified

- Plugin header (`yaxii-shipping-manager.php`): `Version: 1.0.0` ✅
- `readme.txt` `Stable tag: 1.0.0` ✅
- `readme.txt` `Contributors: yaxii, ghost4tech` (includes `yaxii`) ✅

## Environment blocker encountered and resolved

The `svn` CLI was not installed on this machine (not on PATH, not in any common Windows install location). This was reported as a blocker and the user was asked how to proceed. User chose to have it installed automatically.

- `choco install sliksvn` failed because the shell is not elevated (admin rights required for a normal install to `Program Files`).
- Resolved by downloading the official SlikSVN MSI directly and extracting it with `msiexec /a ... TARGETDIR=...` (an administrative/no-install extraction that does not require admin rights), to `%USERPROFILE%\tools\sliksvn-extracted\PFiles\bin\svn.exe`.
- This is a user-local, non-elevated, side-loaded copy of SlikSVN 1.14.5. It is not registered as an installed program and is not on the permanent system PATH — it was referenced by full path for every `svn` command in this task.

## Files changed

None in the plugin git repository.

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-WPORG-SVN-FIRST-RELEASE.md` (this report)
- `C:\Users\Aymen\tools\sliksvn.zip`, `C:\Users\Aymen\tools\sliksvn\`, `C:\Users\Aymen\tools\sliksvn-extracted\` — side-loaded SVN client (outside the plugin repo, user profile scratch area).
- Full SVN working copy at `C:\Users\Aymen\Desktop\wporg-yaxii-shipping-manager-svn` (checked out at r3621990, then populated).

## What was before

Fresh SVN checkout: empty `trunk/`, `tags/`, `assets/` (standard WordPress.org plugin SVN scaffold, revision 3621990).

## What changed

1. Copied all files from the clean release folder directly into `trunk/` (no nested `yaxii-shipping-manager/` subfolder).
2. **Excluded `admin-app/`** (raw Vite/React/TypeScript source: `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, 100+ `.ts`/`.tsx` files, ~1.1MB) from `trunk/`. This folder was present in the release source but is not required at runtime — the plugin loads its compiled admin UI from `trunk/assets/admin/assets/*.js` and `*.css` via `manifest.json`; the only reference to `admin-app` in PHP is an unrelated DOM element id string in `AdminPage.php`. Flagged to the user before staging; user confirmed exclusion.
3. Created `tags/1.0.0/` by copying the same finalized `trunk/` content (post `admin-app/` exclusion).
4. Top-level `assets/` (WordPress.org display assets: screenshots/banner/icon) left empty — no final marketing assets were provided/approved.
5. Ran `svn add --force trunk tags assets`.
6. Ran `svn rm --force` on `trunk/admin-app` and `tags/1.0.0/admin-app` after the initial add surfaced them (see judgment call above).

## Trunk files prepared

```
trunk/yaxii-shipping-manager.php
trunk/readme.txt
trunk/composer.json
trunk/src/            (Admin, Apply, Data, Preview, Rest, Settings, Support, Tools, WooCommerce)
trunk/assets/admin/    (compiled admin UI: manifest.json, main-*.js, main-*.css)
trunk/data/algeria/    (current + legacy-58 datasets)
trunk/languages/       (yaxii-shipping-manager.pot)
trunk/vendor/          (composer autoloader only)
```

No nested `yaxii-shipping-manager/` folder. Structure matches the task's specified correct layout.

## Tag files prepared

`tags/1.0.0/` mirrors `trunk/` exactly (same file list as above), copied after the `admin-app/` exclusion decision.

## Forbidden file scan result

Ran against both `trunk/` and `tags/1.0.0/` (final state, post `admin-app/` removal):

- `.agents`, `.git`, `.github`, `.codex`, `.env`, `.tmp`, `docs`, `release`, `node_modules` — none found
- `data/sources` — none found
- Source maps (`*.map`) — none found
- `AGENTS.md`, `CLAUDE.md` — none found
- Plugin Check reports — none found
- Task reports (`TASK-*.md`) — none found
- Zip/archive files — none found
- Hidden dotfiles/dot-dirs — none found
- `package-lock.json` / dev tooling — none found (removed with `admin-app/`)
- Nested `yaxii-shipping-manager/` folder — not present

**Result: clean.**

## SVN status before commit

151 lines, all status code `A` (added), evenly split between `trunk/` (mirrored structure) and `tags/1.0.0/` (identical mirrored structure). No modifications (`M`) or deletions (`D`) against the existing empty scaffold — this is a from-scratch first population. Full listing captured and shown to the user for review.

Top-level `assets/` (WordPress.org display assets) shows no changes — intentionally left empty.

## Checks run

- `php -l` on every `.php` file under the staged `trunk/` — **no syntax errors**.
- Manual metadata verification (version/stable tag/contributors) — **pass**.
- Forbidden-file hygiene scan (see above) — **clean**.
- `svn status` review — **151 adds, no unexpected files**.

## Whether commit was executed

**Not yet.** Per task instructions, execution stops here and awaits explicit `APPROVE SVN COMMIT` from the user before running `svn commit`.

## SVN revision if committed

N/A — not committed yet.

## Public URL

`https://wordpress.org/plugins/yaxii-shipping-manager` (will be live/updated after first commit + WordPress.org processing).

## Security notes

- `.env` was read only to extract configuration; the SVN password was never printed to output, logs, or command text visible in this session. It was passed to `svn` via a PowerShell variable parsed at runtime from `.env`, with `--no-auth-cache` set so it is not cached to disk by the SVN client.
- No secrets were copied into the SVN working copy.

## WooCommerce safety notes

Not applicable — this is a packaging/release task, no WooCommerce runtime logic was touched.

## WordPress.org compliance notes

- Trunk/tag structure matches WordPress.org SVN conventions (flat plugin files directly under `trunk/`, no nested slug folder).
- No dev-only source tree (`admin-app/`) shipped — only compiled/production assets ship, consistent with keeping the distributed package lean and avoiding unnecessary dev config (`package-lock.json`, `tsconfig.json`, etc.) in the public release.
- No telemetry, licensing, tracking, or external CDN references were introduced by this task.

## Known risks

- The SVN client used is a manually side-loaded, non-elevated install (not registered via winget/choco/installer). It works for this session but is not a permanent, discoverable system install. Future sessions/tasks needing `svn` should either reuse `C:\Users\Aymen\tools\sliksvn-extracted\PFiles\bin\svn.exe` or install it properly with admin rights.
- `vendor/` ships only the Composer autoloader files (no visible third-party runtime packages) — this looks correct for a lean production dependency set, but was not independently audited against `composer.json` requirements in this task.

## Blockers

None remaining. The original `svn`-not-installed blocker was resolved with user approval (see above).

## Next task

Await user's `APPROVE SVN COMMIT` to run `svn commit -m "Initial release 1.0.0"`, then run post-commit verification (readme.txt / plugin file presence in both `trunk` and `tags/1.0.0`, no nested folder) and report the revision number and public URL.

## Commit hash

N/A (SVN, not git; and not yet committed).
