# TASK-ENV-002 Product Reference Docs

Date: 2026-06-26

## Goal

Create stable product reference documentation for Yaxii Shipping Manager so future implementation agents preserve the agreed free MVP scope.

## Scope

- Read project instructions before editing.
- Inspect local skill folder.
- Confirm working directory and Git root state.
- Create or update:
  - `docs/PRD.md`
  - `docs/ARCHITECTURE.md`
  - `.agents/progress/yaxii-shipping-manager/TASK-ENV-002-product-reference-docs.md`
- Do not modify prototype source code.
- Do not implement features.
- Do not rename files.
- Do not delete `app/.git`.

## Files changed

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-ENV-002-product-reference-docs.md`

## Existing docs found

Existing docs were found before editing:

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`

They already contained a PRD and architecture outline. I kept the structure and tightened wording to better preserve the free MVP scope.

## Git root / nested repo state

Plugin root:

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git root: not a Git repository
- Branch: not available
- `git status --short --untracked-files=all`: not available because the plugin root has no `.git`

Nested app repo:

- Git root: `C:/Users/Aymen/Local Sites/yaxii-ysz/app/public/wp-content/plugins/yaxii-shipping-manager/app`
- Branch: `main`
- Status before edits: ` D .lovable/project.json`
- This deletion was pre-existing in the nested app repo and was not touched.

## Skills found / used / missing

Local `.agents/skills/`:

- Not found / empty.

Used:

- `docs-guard` from the available system skills, because this task creates/updates documentation.

Missing locally:

- `wp-plugin-development`
- `wp-guard`
- `woo-guard`
- `wp-rest-api`
- `wp-plugin-directory-guidelines`
- `wp-project-triage`
- `wp-phpstan`
- `wp-performance`

No missing local skill was invented.

## What was before

- `AGENTS.md` and `CLAUDE.md` existed and defined the product scope, WordPress.org constraints, naming, dataset rules, Git rules, and report rules.
- `docs/PRD.md` already existed.
- `docs/ARCHITECTURE.md` already existed.
- The existing docs were broadly aligned, but had wording that could invite drift:
  - "lead generation" language in a WordPress.org-bound PRD.
  - future "paid/pro possibility" language in roadmap sections.
  - dataset wording that needed clearer separation between current verified data and legacy 58-compatible data.
  - release wording that allowed Pro locks/fake paid features to merely not "dominate" rather than not exist in the MVP UI.

## What changed

`docs/PRD.md` was tightened to preserve these rules:

- Product goal is practical merchant/agency usefulness and WordPress.org acceptance.
- The Yaxii Smart Form bridge remains a future path, explicitly outside MVP.
- Current dataset wording now says "current verified Algeria shipping dataset" instead of making an unverified official-structure claim.
- Legacy dataset wording now says "legacy 58-row shape" compatibility and requires clear compatibility labeling.
- Future provider imports and automations are described as unscheduled possibilities outside MVP, not paid/pro scope.
- MVP release criteria now says no Pro locks or fake paid features exist in the MVP UI.

`docs/ARCHITECTURE.md` was tightened to preserve these rules:

- Dataset layer explicitly includes legacy 58-compatible mode.
- Architecture explicitly bans "68 wilayas" wording.
- Architecture explicitly says delegated or provider-specific rows must not be treated as official unless verified.
- WordPress.org rules now explicitly exclude a product marketplace in MVP.

## What still remains mocked / not implemented

No implementation was performed. The prototype remains mock-driven.

Still not implemented:

- WordPress plugin bootstrap.
- React admin mount.
- REST bridge.
- Dataset hardening.
- WooCommerce read-only diagnostics.
- Preview planner.
- Safe apply engine.
- CSV import/export backend.

## Security notes

- No PHP or REST code was added.
- No credentials, remote calls, telemetry, or external assets were added.
- The docs preserve nonce/capability requirements for future REST and write actions.

## WooCommerce safety notes

- No WooCommerce APIs were called.
- No shipping-zone writes were implemented.
- The docs preserve the required sequence: read first, preview second, write last.
- The docs preserve the rule that writes must not exist until diagnostics and preview planner exist.

## WordPress.org compliance notes

- Docs now avoid "lead generation" framing.
- Docs preserve no telemetry, no hidden remote calls, no CDN assets, no licensing, no Pro locks, no product marketplace, no automations, no provider dispatch, and no full YSF sync in MVP.
- Docs keep WordPress.org acceptance mandatory.

## Wording risks noticed

- Existing console output still renders some Unicode punctuation as mojibake in PowerShell output. The docs should be checked in an editor with UTF-8 rendering before release docs work.
- "Legacy 58-compatible dataset" still needs product confirmation during dataset hardening so agents do not confuse legacy provider compatibility with official administrative status.
- The prior prototype and audit mention `Yaxii Shipping Zones`; product docs now standardize on `Yaxii Shipping Manager`.

## Checks run

- `Get-Location`
- `Get-ChildItem -Force -Recurse -Depth 3 -Include AGENTS.md,CLAUDE.md`
- `Get-ChildItem -Force -Recurse .agent\skills`
- `git rev-parse --show-toplevel` in plugin root
- `git status --short --untracked-files=all` in plugin root
- `git rev-parse --show-toplevel` in nested `app`
- `git branch --show-current` in nested `app`
- `git status --short --untracked-files=all` in nested `app`
- `Get-Content AGENTS.md`
- `Get-Content CLAUDE.md`
- `Get-Content docs\PRD.md`
- `Get-Content docs\ARCHITECTURE.md`
- `rg` scan for restricted/drift-prone wording
- `git diff --check` where applicable

## Check results

- Plugin root Git commands failed as expected: the plugin root is not a Git repository.
- Nested app repo is on branch `main`.
- Nested app repo has a pre-existing deletion: ` D .lovable/project.json`.
- Local `.agents/skills/` did not provide project skills.
- `docs-guard` system skill was used.
- `git diff --check` in the nested app repo passed with no output.
- Trailing-whitespace scan for `docs` and the task report passed with no matches.
- Restricted/drift-prone wording scan found only intentional prohibition/reporting references, such as "Do not use 68 wilayas", "Product marketplace" in a must-not-show list, and report notes about removed wording.

## Known risks

- Plugin root is still not a Git repository, so root-level docs cannot be committed from the plugin root.
- Nested `app` repo is dirty due to a pre-existing deletion unrelated to this task.
- The product docs are reference docs only; they do not make the plugin runnable.
- Dataset facts still need verification in `TASK-002 Dataset Hardening`.

## Blockers

- Root Git repository is missing. This blocks branch creation and committing at the plugin root.
- Existing nested app repository creates repository-boundary ambiguity until normalized.

## Commit status

Skipped.

Reason:

- Plugin root is not a valid Git repository.
- Nested app repo has unrelated pre-existing change ` D .lovable/project.json`.

## Next recommended task

`TASK-ENV-003 Repository normalization plan` - decide whether the plugin root should become the canonical Git repository and how to preserve or absorb the nested prototype app repo safely without deleting `app/.git` accidentally.

If repository setup is intentionally deferred, the next implementation task remains:

`TASK-001 Plugin foundation + React mount`

but it should not start until the Git root ambiguity is resolved or explicitly accepted.

## Commit hash

Not committed.
