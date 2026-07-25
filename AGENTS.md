# AGENTS.md — Yaxii Shipping Manager Agent Harness

## Project identity

Project: Yaxii Shipping Manager
Type: Free WordPress/WooCommerce plugin
Target: WordPress.org Plugin Directory
Market: Algerian WooCommerce COD merchants, agencies, and developers

Primary product promise:

> Configure and manage Algeria shipping for WooCommerce quickly, safely, and clearly.

This plugin is not a Yaxii Smart Form replacement.
It is a WooCommerce shipping setup and management tool.

## Current product scope

Free MVP only.

The free MVP should focus on:

- Current Algeria wilaya dataset support
- Legacy dataset compatibility when needed
- WooCommerce shipping setup wizard
- Beautiful React admin interface
- Wilaya pricing table
- Home delivery and office/stopdesk pricing
- CSV import/export
- Read-only WooCommerce diagnostics
- Checkout protection diagnostics
- Preview/dry-run plan before writing
- Safe apply engine only after the preview planner is proven

Do not implement paid/pro features unless the user explicitly starts a paid-version phase.

## Hard product restrictions

Do not add:

- Licensing
- Telemetry
- Remote tracking
- Hidden Yaxii API calls
- External CDN assets
- Obfuscated code
- Aggressive upsells
- Dashboard spam notices
- Provider sending APIs
- Yalidine/ZR/Maystro dispatch
- Full YSF sync implementation
- Automation/scheduled actions
- Commune-level custom shipping engine in the first release
- Destructive reset actions without a safe backend and explicit confirmation

YSF Sync may exist only as a disabled “coming later” informational screen until explicitly scoped.

## WordPress.org rules

This plugin is built for WordPress.org acceptance.

Agents must keep the plugin:

- GPL-compatible
- Local-first
- Transparent
- No hidden tracking
- No remote dependency for core functionality
- No external JS/CSS/CDN assets
- No misleading disabled paid screens in the first free release
- No public-site injected links without explicit user permission
- No obfuscation
- No unsafe file writes
- No unverifiable claims in readme/docs

Run Plugin Check before release tasks.

## Required skill usage

Before every task, inspect available skills under:

`.agents/skills/`

Use only skills that actually exist. Do not invent skill names.

Recommended skill mapping:

- General WordPress plugin architecture: `wp-plugin-development`
- WordPress security/i18n/admin/REST review: `wp-guard`
- WooCommerce shipping/order/checkout work: `woo-guard`
- REST endpoints: `wp-rest-api`
- WordPress.org compliance: `wp-plugin-directory-guidelines`
- Repo/project discovery: `wp-project-triage`
- Static analysis setup: `wp-phpstan`
- Performance-sensitive work: `wp-performance`
- Production code review: `clean-code-guard`
- Test code review: `test-guard`
- Documentation/report/readme review: `docs-guard`

If a required skill is missing:

1. Report the missing skill.
2. Do not invent its contents.
3. Continue using official WordPress/WooCommerce standards and project rules.
4. Mention the missing skill in the task report.

## Repository discipline

Before every task:

1. Confirm current working directory.
2. Confirm whether the plugin root is a Git repository.
3. Show current branch.
4. Show `git status --short --untracked-files=all`.
5. Inspect `AGENTS.md`, `CLAUDE.md`, and relevant `.agents/skills/` files.
6. Inspect the files you will modify and at least one neighboring file.
7. State the intended task boundary before editing.

If the plugin root is not a Git repository, stop before implementation and report the blocker unless the task is specifically about repository setup.

Nested Git repositories are dangerous. If `app/.git` exists inside the plugin root, do not delete it without explicit user instruction. Report the nested repo and propose a safe normalization plan.

## Branching rules

Use one branch per feature/task unless the user explicitly says otherwise.

Branch format:

`task/<short-task-name>`

Examples:

- `task/env-001-agent-harness`
- `task/001-plugin-foundation-react-mount`
- `task/002-dataset-hardening`
- `task/003-woo-readonly-diagnostics`

Do not work directly on `main`, `master`, or `dev` unless the user explicitly instructs it.

## Commit rules

Default rule:

After a successful implementation task, commit the changes.

But only commit when all are true:

1. The plugin root is a Git repository.
2. The task was completed.
3. Required checks passed or failures are explicitly documented.
4. The task report was created.
5. The user did not explicitly say “do not commit.”
6. There are no unrelated changes mixed into the diff.

Commit message format:

`TASK-XXX: concise summary`

Examples:

- `TASK-001: mount React admin app`
- `TASK-002: harden Algeria dataset`
- `TASK-003: add read-only Woo diagnostics`

Never commit:

- Broken builds without explicitly saying so
- Unrelated files
- Local secrets
- `node_modules`
- Vendor/build artifacts unless the task explicitly requires release packaging
- Generated archives unless the task is a release task

If committing is impossible, report why and leave changes uncommitted.

## Task report rules

Every task must create a markdown report under:

`.agents/progress/yaxii-shipping-manager/`

Report filename format:

`TASK-XXX-short-title.md`

Each report must include:

1. Task title
2. Date
3. Goal
4. Scope
5. Files changed
6. Files created
7. What was before
8. What changed
9. What still remains mocked
10. Security notes
11. WooCommerce safety notes
12. WordPress.org compliance notes
13. Checks run
14. Check results
15. Known risks
16. Blockers
17. Next recommended task
18. Commit hash, if committed

For audit-only tasks, say clearly that no product code was changed.

## Blocker protocol

If you hit a blocker, do not improvise around it.

Stop and report when:

- The repo is not in the expected branch/state
- Git root is missing or ambiguous
- Required files are missing
- WooCommerce is unavailable and the task requires Woo APIs
- A write action may damage store configuration
- Dataset correctness is uncertain
- The requested change conflicts with WordPress.org rules
- A required build tool is missing
- A generated file cannot be verified
- A test/build fails and the cause is unclear

Blocker report format:

- Blocker
- Evidence
- Why it matters
- Safe options
- Recommended option

Do not fake success.

## WordPress architecture rules

Use namespace:

`Yaxii\ShippingManager`

Use prefix for public identifiers:

`yaxii_shipping_manager`

Text domain:

`yaxii-shipping-manager`

Rules:

- One plugin bootstrap file.
- Avoid heavy side effects at file load time.
- Register hooks through a plugin/container/bootstrap class.
- Admin-only code must load only in admin context.
- React assets load only on the plugin admin screen.
- REST endpoints must have permission callbacks.
- State-changing REST endpoints require nonce and capability checks.
- Use options for small configuration.
- Use custom tables only if explicitly justified.
- Large options must not autoload.
- No direct `$_POST`, `$_GET`, `$_REQUEST` access without `wp_unslash()` and sanitization.
- Escape output late.
- All user-facing PHP strings must be translation-ready.

## WooCommerce rules

WooCommerce code must be guarded.

Before using WooCommerce classes/functions:

- Check WooCommerce is active.
- Avoid fatal references when WooCommerce is inactive.
- Declare compatibility honestly when touching HPOS or checkout blocks.
- Use WooCommerce APIs, not raw database writes.
- Use WooCommerce shipping zone/method APIs.
- Money values must be sanitized with WooCommerce decimal helpers.
- Do not use floats for price logic.
- Never overwrite manual merchant zones by default.
- Every write must come from a preview plan.
- Every write must be idempotent where possible.
- Log partial failures.
- Do not hide skipped/conflicted zones.

## Shipping-zone write safety

WooCommerce shipping zones are store configuration. Treat them as dangerous.

Before any write engine exists, build in this order:

1. Read-only diagnostics
2. Preview planner
3. Safe apply engine

The apply engine must:

- Read current WooCommerce zones first.
- Detect Yaxii-managed zones.
- Detect manual zones.
- Skip manual zones by default.
- Show conflicts before writing.
- Require explicit confirmation.
- Preserve user data.
- Report every create/update/skip/failure.
- Never silently delete zones.

## React admin rules

The prototype app is not yet a production WordPress admin app.

When integrating:

- Remove TanStack Start SSR assumptions if unsuitable for wp-admin.
- Use a static Vite build mounted inside one admin page.
- Use hash routing or another wp-admin-safe routing strategy.
- No external CDN assets.
- No Lovable telemetry/error capture.
- No fake production success states.
- Mock data must be clearly isolated and removed/replaced task by task.
- The app must work without breaking wp-admin navigation.
- Keep UI friendly but operational.
- Shipping Manager, Diagnostics, Preview, Apply, and Settings must feel trustworthy, not childish.

## Dataset rules

Dataset must be treated as product-critical.

Rules:

- Do not call delegated areas official wilayas unless verified.
- Do not use “68 wilayas” wording.
- Support current official Algeria dataset once verified.
- Support legacy dataset compatibility when needed.
- Store dataset version.
- Include Arabic/French names with correct encoding.
- Validate duplicates, missing codes, and incorrect labels.
- Keep communes/cities as data first; do not promise commune-level pricing until a real custom shipping method is scoped.

## Documentation rules

Documentation must describe actual behavior only.

Do not document features that are not implemented unless clearly labeled as roadmap or coming later.

No fake claims:

- “Production-ready”
- “Supports all providers”
- “Automatic sync”
- “Full city pricing”
- “Works with all checkouts”

unless verified by code and tests.

## Required checks

Run relevant checks for each task.

Minimum PHP checks:

- `php -l` on changed PHP files
- Composer autoload validation if Composer is present
- PHPCS/WPCS if configured
- PHPStan if configured

Minimum JS checks:

- Install dependencies only when needed
- `npm run build` or equivalent
- `npm run lint` if configured
- `npx tsc --noEmit` if TypeScript is configured and supported

Git checks:

- `git status --short --untracked-files=all`
- `git diff --check`

Release tasks additionally require:

- Plugin Check
- Readme validation
- No unwanted files in distribution
- No source maps unless intentionally allowed
- No secrets
- No `node_modules`
- No development-only files unless WordPress.org source distribution needs them

## Final response format

After each task, respond with:

1. Status
2. Branch
3. Commit hash, if committed
4. Report path
5. Files changed
6. Checks run and results
7. What works now
8. What remains mocked/not implemented
9. Risks/blockers
10. Next recommended task

Be direct. Do not oversell. Do not say “complete” if checks failed.
