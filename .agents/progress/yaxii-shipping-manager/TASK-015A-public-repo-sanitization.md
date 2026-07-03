# TASK-015A - Public Repository Sanitization

Date: 2026-07-03

## Goal

Prepare a clean public-ready Git state for Yaxii Shipping Manager without exposing internal agent files, prompts, audits, local paths, reference apps, development-only material, or the existing private development history.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git root: plugin root.
- Starting branch: `task/014i2-fix-remote-admin-asset-404`
- Development task branch: `task/015a-public-repo-sanitization`
- Release package folder exists: `release/yaxii-shipping-manager`
- Release zip exists: `release/yaxii-shipping-manager.zip`
- TASK-014I release prep commit `cac1c28` exists locally.
- Pre-existing unrelated dirty files were present before this task and were not staged.
- No remote branches were deleted.
- No force push was performed.

## Files Read

- `AGENTS.md`
- `CLAUDE.md`
- `.agents/skills/docs-guard/SKILL.md`
- `.agents/skills/wp-plugin-directory-guidelines/SKILL.md`
- `.distignore`
- `docs/RELEASE-PACKAGING.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014I-final-release-prep-slug-css-package.md`
- `readme.txt`
- `yaxii-shipping-manager.php`

## Backup Bundle Path

Full-history backup bundle:

`C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager\.agents\backups\pre-public-repo-20260703-164222\pre-public-repo-full-history-20260703-164222.bundle`

Backup snapshot files:

- `.agents/backups/pre-public-repo-20260703-164222/local-branches.txt`
- `.agents/backups/pre-public-repo-20260703-164222/remote-branches.txt`
- `.agents/backups/pre-public-repo-20260703-164222/head.txt`
- `.agents/backups/pre-public-repo-20260703-164222/status-short.txt`

The backup bundle and snapshot files were not committed.

## Public-Safe Inventory

Classified as public-safe runtime/source:

- `yaxii-shipping-manager.php`
- `readme.txt`
- `composer.json`
- `src/`
- `assets/admin/`
- `languages/`
- `vendor/`
- `data/algeria/`
- cleaned `admin-app/` source and build metadata:
  - `admin-app/src/`
  - `admin-app/package.json`
  - `admin-app/package-lock.json`
  - `admin-app/tsconfig.json`
  - `admin-app/vite.config.ts`
- clean public `README.md`
- clean public `.gitignore`

## Private/Internal Inventory

Classified as private/internal/dev-only and excluded from `public-main`:

- `.agents/`
- `.codex/`
- `AGENTS.md`
- `CLAUDE.md`
- root `docs/`
- root `tools/`
- `release/`
- `data/sources/`
- `.tmp/`
- `prototype-app-history.bundle`
- `skills-lock.json`
- Plugin Check reports
- internal task/progress/audit markdown
- local backup bundle and branch snapshots
- old development history and task branches
- source maps
- `node_modules/`

## Needs Decision Inventory

- `.gitattributes`: excluded from `public-main`; useful later if line-ending policy should be public.
- `.distignore`: excluded from `public-main` because the current file references internal agent filenames; create a public-safe distribution ignore only if needed later.
- `release/`: excluded; release artifacts should not be the public source branch.
- admin lint/prettier config files: excluded from `public-main`; source availability is preserved through source files, package metadata, and build config.
- `LICENSE`: not created in this task; GPL metadata remains in the plugin header and `readme.txt`. A full public license file is a useful follow-up.

## Clean Public Branch Created

Created fresh-history branch:

`public-main`

Implementation approach:

- Created a temporary isolated worktree under `.tmp/`.
- Created `public-main` as an orphan branch.
- Populated it from `release/yaxii-shipping-manager` plus clean public `README.md` and `.gitignore`.
- Removed the temporary worktree after committing.

## Public Branch Commit Hash

`f0c7268f68a69f4ef95be5c1c860676089523ac0`

Commit message:

`Initial public release source for Yaxii Shipping Manager 1.0.0`

History check:

- `git rev-list --count public-main`: `1`

## Files Included

Top-level files/directories in `public-main`:

- `.gitignore`
- `README.md`
- `admin-app/`
- `assets/`
- `composer.json`
- `data/`
- `languages/`
- `readme.txt`
- `src/`
- `vendor/`
- `yaxii-shipping-manager.php`

Required-file verification passed for:

- `yaxii-shipping-manager.php`
- `readme.txt`
- `src/`
- `assets/admin/manifest.json`
- `src/WooCommerce/YaxiiCodCompatibilityDetector.php`
- `languages/yaxii-shipping-manager.pot`
- `admin-app/src`
- `composer.json`

## Files Excluded

Confirmed excluded from `public-main`:

- `.agents`
- `AGENTS.md`
- `CLAUDE.md`
- `docs`
- `tools`
- `release`
- `data/sources`
- `prototype-app-history.bundle`
- `skills-lock.json`
- `node_modules`
- `.map`
- Plugin Check report markdown
- internal task report filenames
- local SSH/server paths
- local Windows paths
- `.agents/references`

## Scan Results

Passed:

- `composer validate --no-check-publish` in the public worktree.
- `git rev-list --count public-main`: `1`.
- Required file scan.
- Forbidden path scan.
- `node_modules` scan.
- source-map scan.
- Plugin Check/report markdown scan.
- restricted phrase scan for:
  - `CLAUDE`
  - `.agents`
  - `ssh -p`
  - `u538716307`
  - `Local Sites`
  - `prototype-app-history`
  - `skills-lock`
  - `internal audit`
  - `Codex said`
  - `Claude said`
  - `C:\Users\`
  - `/home/u538716307`

One initial scan false-positive matched `admin-app/src/components/ui/progress.tsx` on the word `progress`; this is a public UI component, not an internal progress report. The committed-tree scan was rerun with a narrower internal-report path pattern and passed.

## Branch Cleanup Plan

Do not delete anything until the user explicitly approves.

Local branches to keep for now:

- `main`
- `public-main`
- `task/015a-public-repo-sanitization`
- recent release/fix branches until user confirms no further review is needed:
  - `task/014i-final-release-prep-slug-css-package`
  - `task/014i2-fix-remote-admin-asset-404`

Local branches safe to delete later after confirming the bundle backup and public branch:

- Most historical `task/*` branches from TASK-001 through TASK-014.
- Exact local branch inventory is saved in `.agents/backups/pre-public-repo-20260703-164222/local-branches.txt`.

Remote branches to keep until publishing strategy is confirmed:

- `origin/main`

Remote branches that should be deleted before making the existing GitHub repo public:

- `origin/task/006a-safe-apply-confirmation-contract`
- `origin/task/007b-generator-wizard-reference-integration`
- `origin/task/008c-update-managed-methods`

Do not make the existing GitHub repository public while old private-history branches remain reachable.

## Recommended GitHub Publishing Approach

Recommended safest approach:

1. Keep the existing development repository private.
2. Create a new clean public GitHub repository.
3. Push only `public-main` to the new repository as `main`.

This avoids exposing private history, old task branches, internal reports, and deleted files that still exist in the development repository history.

Riskier alternate approach:

- Replace the current remote `main` with `public-main` only after explicit approval, backup verification, and remote task branch deletion. This requires a force push and should be treated as a separate task.

## Commands for Manual Publishing

Preferred new public repository flow:

```powershell
git remote add public <NEW_PUBLIC_REPO_URL>
git push public public-main:main
```

If the existing GitHub repository must become public later, do not run these without explicit approval:

```powershell
git push origin public-main:main --force-with-lease
git push origin --delete task/006a-safe-apply-confirmation-contract task/007b-generator-wizard-reference-integration task/008c-update-managed-methods
```

Optional local cleanup after approval and after verifying the bundle backup:

```powershell
git branch --format='%(refname:short)' |
  Where-Object { $_ -like 'task/*' -and $_ -notin @('task/015a-public-repo-sanitization','task/014i-final-release-prep-slug-css-package','task/014i2-fix-remote-admin-asset-404') } |
  ForEach-Object { git branch -D $_ }
```

## What Was Not Changed

- No product behavior changed.
- No runtime plugin files were modified on the development branch.
- No release package behavior was changed.
- No remote branch was deleted.
- No history rewrite was performed on the development branch.
- No force push was performed.

## Risks

- The existing development Git history still contains internal files and should remain private.
- Making the current GitHub repository public without replacing history or deleting remote task branches would expose private history.
- `public-main` intentionally excludes development docs and packaging internals; if public developer documentation is needed, create new public-safe docs from source-verified claims.
- A full `LICENSE` file was not added and should be considered before publishing.

## Blockers

None for creating the clean public branch.

## Next Recommended Task

Create a new clean public GitHub repository and push `public-main` as `main`, or explicitly approve a separate task to replace the current remote after backup verification and branch cleanup.

## Commit Hash, If Committed

Development report commit pending at report write time.
