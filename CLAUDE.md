# CLAUDE.md — Yaxii Shipping Manager Coding Rules

## Mission

You are working on Yaxii Shipping Manager, a free WordPress/WooCommerce plugin for Algerian merchants and agencies.

The goal is WordPress.org acceptance and real merchant usefulness.

This plugin helps users configure and manage WooCommerce shipping for Algeria through a clean React admin interface, instead of forcing them to use WooCommerce’s default shipping-zone UX.

## Current priority

Do not rush feature work.

Current phase:

1. Environment and harness
2. Plugin foundation
3. React app mount
4. Dataset hardening
5. Read-only WooCommerce diagnostics
6. Preview planner
7. Safe apply engine

Do not implement WooCommerce shipping-zone writing until diagnostics and preview planning exist.

## Required behavior

Before every task:

1. Read this file.
2. Read `AGENTS.md`.
3. Inspect `.agents/skills/`.
4. Use only skills that exist.
5. Confirm working directory.
6. Confirm Git root and branch.
7. Show git status.
8. Read files before editing.
9. Stay inside the requested task boundary.

Do not invent missing skills. Report missing skills.

## Skill usage

Use relevant skills every time:

- `wp-plugin-development` for plugin structure, hooks, admin UI, lifecycle, settings, packaging.
- `wp-guard` for WordPress security, escaping, sanitization, i18n, REST permissions, admin assets.
- `woo-guard` for WooCommerce shipping/order/checkout/money logic.
- `wp-rest-api` for REST endpoints.
- `wp-plugin-directory-guidelines` for WordPress.org compliance.
- `clean-code-guard` for code quality and AI failure-mode review.
- `test-guard` for tests.
- `docs-guard` for reports, README, and docs.
- `wp-project-triage` for repo discovery.
- `wp-phpstan` for static analysis setup.
- `wp-performance` for expensive queries, caching, autoload, and admin performance.

If a task touches WooCommerce, use both WordPress and WooCommerce guardrails.

## Non-negotiable restrictions

Never add:

- Licensing
- Telemetry
- Tracking
- Remote calls to Yaxii servers
- External CDN assets
- Obfuscation
- Aggressive upsells
- Admin dashboard spam
- Provider API dispatch
- Fake Pro lock system
- Hidden product marketplace
- Unsafe reset/delete actions
- Automatic sync without explicit preview and confirmation

Do not ship Lovable telemetry/error capture in the plugin.

Do not keep fake apply success behavior in production code.

Do not hardcode “success” for unfinished backend actions.

## WordPress.org target

This plugin must be WordPress.org-safe.

That means:

- GPL-compatible
- No hidden tracking
- No remote dependency for core features
- No external asset loading
- Clear permissions
- Proper sanitization and escaping
- Translation-ready strings
- No misleading claims
- No disabled paid features dominating the free UI
- No public-site links injected without user permission

Use Plugin Check before release tasks.

## Project naming

Plugin name:

`Yaxii Shipping Manager`

Namespace:

`Yaxii\ShippingManager`

Prefix:

`yaxii_shipping_manager`

Text domain:

`yaxii-shipping-manager`

Admin page title:

`Yaxii Shipping Manager`

Clarifying copy:

`Algeria shipping setup for WooCommerce`

Avoid mixing product names like `Yaxii Shipping Zones` unless explicitly changing product naming.

## Product scope

Free MVP includes:

- Algeria shipping setup wizard
- Dataset selection
- Current/legacy dataset compatibility
- Wilaya pricing table
- Home delivery price
- Office/stopdesk delivery price
- CSV import/export
- Read-only diagnostics
- Checkout protection simulator
- Preview plan
- Safe apply engine after preview exists
- Settings for safe behavior

Free MVP excludes:

- YSF sync implementation
- Provider imports
- Automations
- Scheduled price changes
- Commune-level custom shipping engine
- Multi-country support
- Paid/pro locks

YSF Sync may remain as a disabled roadmap page only.

Products/cross-sell page should be removed or hidden from MVP unless the user explicitly keeps it.

## Dataset rules

Dataset correctness is critical.

Rules:

- Do not use “68 wilayas.”
- Do not label delegated/legacy rows as official unless verified.
- Support current official Algeria dataset after verification.
- Support legacy dataset mode when useful for old stores/provider tables.
- Include Arabic and French names with correct UTF-8 encoding.
- Treat communes/cities as dataset/browsing/mapping first.
- Do not promise city-level pricing in v1 unless a real custom WooCommerce shipping method is implemented.

## WooCommerce safety

Shipping zones and methods are merchant configuration. Treat writes as dangerous.

Before any write:

1. Read existing zones.
2. Detect manual zones.
3. Detect Yaxii-managed zones.
4. Detect duplicates/conflicts.
5. Generate preview plan.
6. Ask for explicit confirmation.
7. Apply only the previewed plan.
8. Skip manual zones by default.
9. Report every action.
10. Log partial failures.

Never delete or overwrite manual zones by default.

Never add an apply engine before the preview planner.

## Coding standards

Follow WordPress coding standards and project conventions.

PHP:

- Use strict namespacing.
- Avoid global functions unless necessary.
- Guard direct file access.
- Use hooks intentionally.
- Use WordPress APIs.
- Use WooCommerce APIs for Woo data.
- Validate/sanitize input early.
- Escape output late.
- Use nonces and capabilities.
- Use prepared SQL if SQL is unavoidable.
- Use options for small config.
- Avoid autoloading large options.
- Use transients/cache for expensive diagnostics if needed.

React/TypeScript:

- Keep components focused.
- No fake production API responses.
- Separate mock data from real API clients.
- Use wp-admin-safe routing.
- Do not assume SSR.
- No external CDN.
- No telemetry.
- Handle loading/error/empty states.
- Keep accessibility in mind.
- Do not make operational screens childish.

## Git workflow

Use a task branch unless the user explicitly says otherwise.

Branch format:

`task/<task-id-short-title>`

Check before editing:

- Current branch
- Root Git status
- Nested Git repos
- Untracked files

Do not mix unrelated changes.

Commit after successful implementation only if:

- Root Git repo exists
- Checks pass
- Report exists
- No unrelated changes
- User did not request no commit

Commit message:

`TASK-XXX: summary`

If the task is audit-only or the user says not to commit, do not commit.

If Git root is missing or ambiguous, stop and report.

## Report requirements

Every task creates a report:

`.agents/progress/yaxii-shipping-manager/TASK-XXX-short-title.md`

Report must include:

- Goal
- Scope
- Files changed
- Files created
- What was before
- What changed
- What remains mocked
- Security review
- WooCommerce safety review
- WordPress.org compliance review
- Checks run
- Results
- Risks
- Blockers
- Next task
- Commit hash if committed

## Blocker handling

Stop and report if:

- Git root is missing
- Nested Git repo creates ambiguity
- Task requires WooCommerce but WooCommerce is unavailable
- Requested change violates WordPress.org rules
- Dataset facts are uncertain
- A write action could damage shipping configuration
- Build/test tooling fails in a way you cannot explain
- Required source file is missing
- You cannot verify an API/hook/function exists

Do not improvise around blockers.

Do not fake completion.

## Checks

Use checks appropriate to the task.

Common checks:

- `git status --short --untracked-files=all`
- `git diff --check`
- `php -l` for changed PHP files
- Composer autoload/checks if Composer exists
- PHPCS/WPCS if configured
- PHPStan if configured
- JS lint if configured
- TypeScript check if configured
- Build if assets changed

If a check is unavailable, report why.

## Final answer format

Always return:

- Status
- Branch
- Commit hash if any
- Report path
- Files changed
- Checks run
- What works
- What remains mocked/not implemented
- Risks/blockers
- Next recommended task

No marketing fluff. No false confidence.
