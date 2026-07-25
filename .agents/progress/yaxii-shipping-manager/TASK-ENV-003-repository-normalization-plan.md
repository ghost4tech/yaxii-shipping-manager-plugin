# TASK-ENV-003 Repository Normalization Plan

Date: 2026-06-26

## Goal

Create a safe repository normalization plan before Yaxii Shipping Manager implementation starts.

This is a planning/audit task only. No plugin features were implemented, no files were moved, no Git repository was initialized, `app/.git` was not deleted, `.lovable/project.json` was not restored or deleted, and no commit was made.

## Scope

- Read `AGENTS.md` and `CLAUDE.md`.
- Inspect local skill directories.
- Confirm current working directory.
- Confirm plugin root Git state.
- Confirm nested `app/` Git state.
- Inspect nested app remote URL, branch, latest commit, dirty files, and tracked deleted file.
- Inspect root files that are outside root Git tracking.
- Inspect folder structure to reasonable depth.
- Identify final plugin-root files versus prototype-app files.
- Identify normalization options and recommend one safe path.

## Skills found / used

Requested local path:

- `.agents/skills/`: not present.

Installed local project skills actually found:

- `.agents/skills/`
- `skills-lock.json`

Relevant local skills used:

- `.agents/skills/wp-project-triage/SKILL.md`
- `.agents/skills/docs-guard/SKILL.md`

Additional available system skill used:

- `docs-guard`, for documentation/report accuracy.

Relevant local skills present but not needed for this planning-only task:

- `wp-plugin-development`
- `wp-guard`
- `woo-guard`
- `wp-rest-api`
- `wp-plugin-directory-guidelines`
- `clean-code-guard`
- `test-guard`
- `wp-phpstan`
- `wp-performance`

No missing skill was invented.

## Current root state

Working directory:

`C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`

Plugin root Git state:

- `git rev-parse --show-toplevel`: failed with `fatal: not a git repository (or any of the parent directories): .git`
- `git branch --show-current`: failed for the same reason
- `git status --short --untracked-files=all`: failed for the same reason

WordPress project triage result:

- `node .agents\skills\wp-project-triage\scripts\detect_wp_project.mjs`
- Result: `project.primary` is `unknown`
- Reason: no WordPress plugin bootstrap, no plugin header, no root `package.json`, no `composer.json`, and no WordPress-specific project files at root yet.

Root top-level structure currently contains:

- `.agents/`
- `app/`
- `docs/`
- `AGENTS.md`
- `CLAUDE.md`
- `skills-lock.json`

Root docs/reference files currently present:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-000-prototype-product-discovery-audit.md`
- `.agents/progress/yaxii-shipping-manager/TASK-ENV-002-product-reference-docs.md`
- `.agents/progress/yaxii-shipping-manager/TASK-ENV-003-repository-normalization-plan.md`

## Current nested app repo state

Nested app path:

`C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager\app`

Nested Git root:

`C:/Users/Aymen/Local Sites/yaxii-ysz/app/public/wp-content/plugins/yaxii-shipping-manager/app`

Branch:

`main`

Remote:

```text
origin  https://github.com/ghost4tech/yaxii-shipping-manager.git (fetch)
origin  https://github.com/ghost4tech/yaxii-shipping-manager.git (push)
```

Latest commit:

```text
5752e6f980a9f3733f1fadfbeffa8cb23f892d8b
HEAD -> main, origin/main, origin/HEAD
Merge commit
Author: gpt-engineer-app[bot] <159125892+gpt-engineer-app[bot]@users.noreply.github.com>
AuthorDate: 2026-06-17 04:21:20 +0000
Commit: gpt-engineer-app[bot] <159125892+gpt-engineer-app[bot]@users.noreply.github.com>
CommitDate: 2026-06-17 04:21:20 +0000
Subject: Rebuilt free/Pro gating UX
```

Nested status:

```text
## main...origin/main
 D .lovable/project.json
```

Dirty files:

```text
D  .lovable/project.json
```

The deleted file is tracked in the nested app repo:

```text
100644 5749128f2df3aae1f11e9a99b0041ca60efcd916 0 .lovable/project.json
```

Content at `HEAD`:

```json
{
  "schemaVersion": 1,
  "template": "tanstack_start_ts_2026-06-08-vite-8"
}
```

Nested app `git diff --check`:

- Passed with no output.

## Files currently outside root Git tracking

Because the plugin root is not a Git repository, everything at the plugin root is outside root Git tracking.

Important outside-root-tracking files and directories:

- `AGENTS.md`
- `CLAUDE.md`
- `skills-lock.json`
- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `.agents/progress/yaxii-shipping-manager/*.md`
- `.agents/skills/*`
- `app/`

Inside `app/`, files are tracked by the nested app repo, not by a plugin-root repo. That means root-level docs and future plugin PHP files would not be versioned together with the React prototype unless the root becomes canonical.

## Files that belong to the final WordPress plugin root

These should belong to the canonical plugin-root repository:

- Project instructions:
  - `AGENTS.md`
  - `CLAUDE.md`
  - `skills-lock.json`
- Product and architecture docs:
  - `docs/PRD.md`
  - `docs/ARCHITECTURE.md`
- Task reports:
  - `.agents/progress/yaxii-shipping-manager/*.md`
- Local project skills, if this repo intentionally vendors agent skills:
  - `.agents/skills/*`
- Future WordPress plugin files:
  - Main plugin bootstrap, likely `yaxii-shipping-manager.php`
  - PHP source under a future `includes/` or `src/` namespace path
  - Admin/react mount assets under future `assets/` or equivalent
  - Dataset files under future `data/` or equivalent
  - WordPress.org readme, license, build config, and release docs
- Prototype app source after normalization decision:
  - `app/` as source input for the admin UI, or a renamed frontend source directory in a later task if explicitly approved

## Files that belong to the prototype app

These currently belong to the Lovable/TanStack prototype app:

- `app/.git/`
- `app/.gitignore`
- `app/.prettierignore`
- `app/.prettierrc`
- `app/.lovable/project.json` at `HEAD`, currently deleted in working tree
- `app/package.json`
- `app/bun.lock`
- `app/bunfig.toml`
- `app/vite.config.ts`
- `app/tsconfig.json`
- `app/eslint.config.js`
- `app/components.json`
- `app/src/**`

Prototype-app code is not yet production WordPress plugin code. It is currently a TanStack Start/Lovable React app that will need adaptation before being mounted in wp-admin.

## Risk of keeping a nested Git repo

Keeping `app/.git` while later initializing root Git creates real operational risks:

- Root Git will treat `app/` as an embedded repository boundary, not as normal source files.
- Root commits may record only a gitlink/submodule-like entry or skip nested files, depending on staging behavior.
- Future agents may falsely believe app source is committed in the plugin root when only the nested repo tracks it.
- Root-level docs and app source will have different history, branches, remotes, and dirty states.
- Release packaging can accidentally include `app/.git`, which is not wanted in WordPress.org packages.
- `git status` from different directories will tell different stories.
- Branching and rollback become ambiguous.
- CI/build tooling may run from the wrong root.

## Risk of deleting `app/.git`

Deleting `app/.git` without an explicit preservation decision is also risky:

- It destroys local access to the prototype's commit history.
- It loses the direct relationship to `origin/main` unless documented elsewhere.
- It can hide the pre-existing `.lovable/project.json` deletion before deciding whether it was intentional.
- It makes later provenance review harder.
- If the nested repo has unpushed or hidden refs, they could be lost.
- It violates the current task restriction and project rule unless the user explicitly approves it.

## `.lovable/project.json` decision

Current finding:

- `.lovable/project.json` is tracked by the nested app repo.
- It is currently deleted in the nested app working tree.
- The file is small template metadata:

```json
{
  "schemaVersion": 1,
  "template": "tanstack_start_ts_2026-06-08-vite-8"
}
```

Recommendation:

- Leave it untouched during this planning task.
- Before normalization, decide explicitly:
  - Restore it if the goal is to preserve the nested app exactly as cloned from `origin/main`.
  - Remove it in a deliberate root-repo commit later if the goal is to strip Lovable metadata from the final WordPress plugin source.
  - Do not ignore it silently while it is tracked and deleted, because that leaves the nested repo dirty and makes normalization less auditable.

Practical preference:

- Restore it first to make the nested app clean before creating any history bundle or absorbing the app into root Git.
- Later, remove `.lovable/` from the final plugin source only in an explicit cleanup task if product/release policy requires it.

No restore was performed in this task.

## Normalization options

### Option 1: Root canonical repository, preserve prototype history with a bundle, then absorb app source

Summary:

- Make the plugin root the canonical Git repository.
- Preserve the nested app history before removing or disabling `app/.git`.
- Commit root docs, reports, instructions, and app source together going forward.

Pros:

- Best fit for a final WordPress plugin.
- Keeps docs, PHP, assets, datasets, and React app in one repo.
- Preserves the Lovable prototype history in a bundle/archive before absorption.
- Avoids future nested-repo confusion.
- Supports normal WordPress.org packaging from the plugin root.

Cons:

- Requires explicit user approval before touching `app/.git`.
- Requires a decision on `.lovable/project.json`.
- Requires careful staging so `app/.git` is not committed or packaged.

### Option 2: Root canonical repository with `app/` as a proper Git submodule

Summary:

- Initialize root Git.
- Keep `app` as a separate Git repository/submodule pointing to `https://github.com/ghost4tech/yaxii-shipping-manager.git`.

Pros:

- Preserves prototype history and remote relationship cleanly.
- Avoids deleting `app/.git`.

Cons:

- Adds submodule complexity for future agents.
- Poor fit if the React app must be modified heavily for WordPress admin.
- WordPress.org packaging needs extra care to include source and exclude nested Git metadata.
- Root and app changes remain split across repos.
- The current dirty deletion must still be resolved in the nested repo.

### Option 3: Defer root Git initialization and keep current state temporarily

Summary:

- Keep plugin root unversioned for now.
- Keep `app/.git`.
- Continue writing reports/docs at root.

Pros:

- No immediate risk to nested app history.
- No repository operations needed now.

Cons:

- Root docs and future plugin files remain outside Git tracking.
- Implementation work should not start in this state.
- Agents will continue to hit ambiguous Git state.
- Commit/branch workflow from `AGENTS.md` cannot be followed.

## Recommended option

Recommend Option 1:

The plugin root should become the canonical repository for the final WordPress plugin. The prototype app should be absorbed as source code inside the plugin repo only after deciding whether to preserve or discard its nested Git history. No deletion or movement of `app/.git` should happen without explicit user approval.

Recommended safe policy:

1. Preserve the nested app history first.
2. Clean or explicitly document the `.lovable/project.json` state.
3. Initialize the plugin root as the canonical repo.
4. Exclude nested Git internals from root tracking.
5. Add root docs/instructions and app source as normal plugin-root files.
6. Commit from the plugin root only after the root repo is valid and status is understood.

## Exact commands for recommended option

Do not run these commands until explicitly approved.

### Phase 0: Reconfirm state

```powershell
Set-Location 'C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager'
Get-Location
git rev-parse --show-toplevel
git status --short --untracked-files=all

Set-Location '.\app'
git status -sb --untracked-files=all
git remote -v
git log -1 --pretty=fuller --decorate
git diff --name-status
git diff --check
Set-Location '..'
```

Expected root Git commands still fail until `git init` is approved.

### Phase 1: Decide `.lovable/project.json`

Preferred if the deletion was accidental and the goal is a clean prototype snapshot:

```powershell
Set-Location 'C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager\app'
git restore -- .lovable/project.json
git status -sb --untracked-files=all
Set-Location '..'
```

Alternative if the deletion is intentional:

```powershell
Set-Location 'C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager\app'
git diff -- .lovable/project.json
git status -sb --untracked-files=all
Set-Location '..'
```

Do not leave this ambiguous before absorption.

### Phase 2: Preserve nested app history

Create a Git bundle from the nested app before disabling nested Git:

```powershell
Set-Location 'C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager\app'
git bundle create ..\prototype-app-history.bundle --all
git bundle verify ..\prototype-app-history.bundle
git log -1 --pretty=oneline
Set-Location '..'
```

### Phase 3: Initialize plugin-root repository

```powershell
Set-Location 'C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager'
git init
git checkout -b task/env-003-repository-normalization
```

### Phase 4: Add root ignore rules before staging

Create a root `.gitignore` that excludes nested Git internals and future generated/vendor output. Exact contents should be reviewed before use.

```powershell
Set-Location 'C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager'
New-Item -ItemType File -Path .gitignore
```

Proposed root `.gitignore` content:

```gitignore
# Nested Git internals must never be packaged or tracked by root Git.
app/.git/

# Dependencies and build output.
node_modules/
app/node_modules/
vendor/
dist/
build/
assets/dist/
app/.output/
app/.vinxi/

# Local environment files.
.env
.env.*

# OS/editor noise.
.DS_Store
Thumbs.db
```

### Phase 5: Disable nested Git only after explicit approval

Do not delete `app/.git`. If approved, move it aside as an audit-preserving backup first:

```powershell
Set-Location 'C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager'
Rename-Item -LiteralPath '.\app\.git' -NewName '.git-prototype-backup'
```

This changes the nested Git directory to:

`app/.git-prototype-backup/`

Only after verifying the root repo tracks app source correctly and the bundle is valid should anyone consider deleting that backup. Deletion requires a separate explicit approval.

### Phase 6: Stage and inspect root files

```powershell
Set-Location 'C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager'
git status --short --untracked-files=all
git add .gitignore AGENTS.md CLAUDE.md skills-lock.json docs .agents app prototype-app-history.bundle
git status --short --untracked-files=all
git diff --cached --stat
git diff --cached --check
```

Before committing, verify that neither `app/.git/` nor `app/.git-prototype-backup/` is staged.

```powershell
git diff --cached --name-only | Select-String -Pattern 'app/\.git'
```

Expected result:

- No matches.

### Phase 7: Commit only after review

```powershell
git commit -m "TASK-ENV-003: normalize repository root"
git status --short --untracked-files=all
```

Do not push until a remote strategy for the canonical plugin repository is chosen.

## Risks

- If root Git is initialized while `app/.git` remains active, app source may not be tracked as expected.
- If `app/.git` is deleted without preserving history, prototype provenance is lost.
- If `.lovable/project.json` remains deleted accidentally, the first root snapshot may encode an unreviewed deletion.
- If `.agents/skills` is committed, the repo may become large/noisy; if not committed, future agents may lack the same local guardrails. This needs a deliberate project policy.
- If the root repo is pushed to the same remote as the nested app without planning, history may be rewritten or confused.
- WordPress.org packaging must later exclude Git internals, generated caches, `node_modules`, and any development-only artifacts not intended for source distribution.

## Blockers

- Plugin root is not a Git repository.
- Nested `app/.git` exists and creates repository-boundary ambiguity.
- Nested app repo is dirty due to deleted `.lovable/project.json`.
- No canonical remote has been selected for the final plugin-root repository.
- No decision has been made on whether to preserve nested history as a bundle, submodule, or not at all.

## Checks run

- `Get-Content AGENTS.md`
- `Get-Content CLAUDE.md`
- `Get-Location`
- `Get-ChildItem -Force -Recurse .agent\skills`
- `Get-ChildItem -Force .agents\skills`
- `Get-Content .agents\skills\wp-project-triage\SKILL.md`
- `Get-Content .agents\skills\docs-guard\SKILL.md`
- `node .agents\skills\wp-project-triage\scripts\detect_wp_project.mjs`
- `git rev-parse --show-toplevel` in plugin root
- `git branch --show-current` in plugin root
- `git status --short --untracked-files=all` in plugin root
- `git rev-parse --show-toplevel` in nested `app`
- `git branch --show-current` in nested `app`
- `git status --short --untracked-files=all` in nested `app`
- `git status -sb --untracked-files=all` in nested `app`
- `git remote -v` in nested `app`
- `git log -1 --pretty=fuller --decorate --stat` in nested `app`
- `git diff --name-status` in nested `app`
- `git diff --check` in nested `app`
- `git ls-files --stage .lovable/project.json` in nested `app`
- `git show HEAD:.lovable/project.json` in nested `app`
- `Get-ChildItem -Force -Depth 2`
- `rg --files -g '!app/.git/**'`
- `git ls-files` in nested `app`

## Check results

- Plugin root Git commands failed because root is not a Git repository.
- Nested app Git commands succeeded.
- Nested app branch is `main`.
- Nested app remote is `https://github.com/ghost4tech/yaxii-shipping-manager.git`.
- Nested app latest commit is `5752e6f980a9f3733f1fadfbeffa8cb23f892d8b`.
- Nested app dirty status is only `D .lovable/project.json`.
- Nested app `git diff --check` passed with no output.
- WordPress project triage classified the root as `unknown`, which is expected before plugin bootstrap exists.

## Files changed

- `.agents/progress/yaxii-shipping-manager/TASK-ENV-003-repository-normalization-plan.md`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-ENV-003-repository-normalization-plan.md`

## What remains mocked / not implemented

- No WordPress plugin bootstrap exists.
- No React app mount exists.
- No root Git repository exists.
- No repository normalization was performed.
- No WooCommerce integration exists.
- The prototype app remains mock-driven.

## Security notes

- No executable plugin code was added.
- No filesystem moves/deletes were performed.
- No Git history was altered.
- No remote calls, telemetry, or external assets were added.

## WooCommerce safety notes

- No WooCommerce code was added.
- No shipping-zone reads or writes were performed.
- The plan preserves the project rule: read first, preview second, write last.

## WordPress.org compliance notes

- The plan recommends a canonical root repository suitable for plugin packaging.
- The plan explicitly warns against packaging Git internals, dependency folders, and generated build output without policy.
- No implementation or release packaging was performed.

## Next recommended task

`TASK-ENV-004 Repository initialization and history preservation`

This task should execute the approved normalization option: decide `.lovable/project.json`, preserve nested app history, initialize the plugin root, add root ignore rules, and only then absorb app source under root Git if explicitly approved.

Do not start `TASK-001 Plugin foundation + React mount` until the repository root ambiguity is resolved or the user explicitly accepts the risk.

## Commit hash

Not committed.
