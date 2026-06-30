# TASK-012A - Release UX and Workflow Audit

Date: 2026-06-30

## Goal

Audit the whole Yaxii Shipping Manager admin app from a product UX, workflow, and release-readiness perspective, then document an implementation plan. This task is audit/planning only.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git root: `C:/Users/Aymen/Local Sites/yaxii-ysz/app/public/wp-content/plugins/yaxii-shipping-manager`
- Starting branch: `task/011e-custom-methods-shipping-zones-table`
- Working branch: `task/012a-release-ux-workflow-audit`
- Recent branch graph confirmed TASK-011G, TASK-011F, TASK-011E, TASK-011B, TASK-010H, and TASK-010G are present locally.
- TASK-011D was present as an untracked existing progress report before this task.
- Pre-existing dirty files were present before this task, including `AGENTS.md`, `CLAUDE.md`, and older `.agents/progress/yaxii-shipping-manager/*.md` reports. They were not modified or staged for this task.

## Scope

In scope:

- Audit visible tabs: Shipping Zones, Generator, Diagnostics, Settings, Import / Export, Smart Form Sync.
- Audit current React app workflows and current API clients/types.
- Audit backend preview/apply/diagnostics/settings capability against UX promises.
- Create `docs/RELEASE-UX-WORKFLOW-AUDIT.md`.
- Create this progress report.

Out of scope:

- Product code changes.
- Backend changes.
- WooCommerce writes.
- New safe apply behavior.
- Zone deletion/reset/wipe tooling.
- CSV backend.
- Commune pricing.
- Provider imports.
- YSF sync.
- Telemetry, licensing, Pro locks, remote assets, external fonts, or hidden calls.
- Reference app folders or mock runtime files.

## Files changed

- None at product-code level.

## Files created

- `docs/RELEASE-UX-WORKFLOW-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-012A-release-ux-workflow-audit.md`

## Tabs audited

- Shipping Zones
- Generator
- Diagnostics
- Settings
- Import / Export
- Smart Form Sync

## Major UX problems

1. `Protected` is too vague for merchants. It should become `Manual zone` or `Not managed by Yaxii`, with `Protected by Yaxii` as explanation.
2. A row can briefly show `Needs update` after apply because pending state clears before refreshed diagnostics confirms the new WooCommerce value.
3. Generator is too long for release and includes communes, safety, CSV, preview-only, and legacy concepts as major decisions even though some are informational or future-only.
4. Diagnostics cards summarize issues but do not consistently provide issue-specific next actions.
5. Settings persists defaults only, but method/label/price controls can be misunderstood as live WooCommerce updates.
6. Import / Export and Smart Form Sync are visible top-level tabs despite being unimplemented.

## Broken/dead action list

- Import CSV `Select file`: disabled and backend not connected.
- Import CSV `Validate and preview import`: disabled and backend not connected.
- Export `Local draft configuration`: disabled and no endpoint.
- Export `WooCommerce snapshot`: disabled and no endpoint.
- Generator CSV `Import CSV`: disabled and backend not connected.
- Generator CSV `Download sample`: disabled and sample backend not connected.
- Smart Form Sync: visible top-level screen but no reads or writes.
- Legacy 58-compatible mode: visible but unavailable.
- Commune list: real read-only data, but not used by current WooCommerce engine.
- Zone name updates: can appear in preview/support details, but apply does not update existing zone names.

## Workflow gaps

- Fresh install works technically but needs a shorter Generator.
- Existing manual zones are protected safely, but the merchant-facing explanation and action path are weak.
- Fully managed setup works, but post-apply verification state needs to be explicit.
- Missing setup repair is real, but the repair preview should show exact methods/prices that will be restored.
- Daily price changes work, but stale diagnostics can cause confusing status flicker.
- Free shipping works as price `0`, but fixed-price UI should accept `0` where applicable.
- Enable/disable works for registry-owned methods, but row-level active copy can imply zone disable.
- Diagnostics warnings need direct fix paths.
- Settings needs stronger defaults-only framing.
- Preview-only mode is not distinct enough to deserve a primary setup mode in the release wizard.
- Checkout verification remains a limitation and must stay soft in copy.

## Recommended simplified product flow

Release navigation should be:

1. Shipping Zones
2. Generator
3. Diagnostics
4. Settings

Recommended merchant flow:

1. Use Generator only for first setup or repair.
2. Preview and generate safe managed setup.
3. Land in Shipping Zones.
4. Use Shipping Zones for daily price and method-status changes.
5. Use Diagnostics when Shipping Zones shows a manual, conflict, missing, or warning state.
6. Use Settings for future defaults only.

## Must-fix list

- Rename and explain protected/manual row states.
- Add post-apply `Updating...` or diagnostics-refresh state to avoid stale `Needs update`.
- Hide top-level Import / Export before release.
- Hide top-level Smart Form Sync before release.
- Simplify Generator and remove communes as a full step.
- Make Settings clearly defaults-only.
- Hide or de-emphasize legacy 58 mode until verified.

## Should-fix list

- Add issue-specific next actions to Diagnostics health cards.
- Move full wilaya lists deeper in Advanced Diagnostics.
- Clarify row active switch as managed-method enable/disable.
- Allow `0` in fixed price controls.
- Reduce bulk-tool visual density.
- Make repair preview more explicit.

## Hide-until-ready list

- CSV import/export UI.
- Smart Form Sync UI.
- Reset/delete/wipe tooling.
- Manual-zone adoption.
- Provider imports.
- Commune-level pricing controls.
- Legacy 58 setup mode.

## Release-readiness scores

- Shipping Zones UX: 7/10
- Generator UX: 5/10
- Diagnostics UX: 7/10
- Settings UX: 6/10
- Overall merchant clarity: 6/10
- Technical safety: 8/10
- WordPress.org readiness: 7/10

## Suggested next implementation tasks in order

1. TASK-012B: Hide unreleased tabs and simplify top navigation.
2. TASK-012C: Rename protected/manual statuses and improve Diagnostics actions.
3. TASK-012D: Add post-apply refresh state for Shipping Zones rows.
4. TASK-012E: Simplify Generator flow for MVP.
5. TASK-012F: Restructure Settings as defaults-only.
6. TASK-012G: Make Diagnostics issue-first and support-export ready.

## What was before

The plugin had real diagnostics, preview, safe apply, dynamic managed method display, price update, method status update, repair setup, and a cleaner Diagnostics UI. The release UX still exposed inactive top-level features and unclear workflow boundaries.

## What changed

Created an audit document and this progress report. No product code changed.

## What remains mocked

- CSV import/export backend remains not implemented.
- Commune-specific pricing remains not implemented.
- Provider imports remain not implemented.
- YSF sync remains not implemented.
- Zone-name apply remains not implemented.
- Manual-zone adoption remains not implemented.
- Reset/delete/wipe tooling remains not implemented.
- Checkout verification remains diagnostic only, not a full checkout proof.

## Security notes

- No PHP, REST, JS runtime, nonce, capability, or output behavior was changed.
- No new route was added.
- No telemetry, tracking, remote calls, licensing, Pro lock, external font, CDN, or hidden service behavior was added.

## WooCommerce safety notes

- No WooCommerce write code was changed.
- No WooCommerce write action was triggered.
- The audit confirms the current safe apply boundary remains create missing managed zones, add methods, update registry-owned method prices/labels, and update registry-owned method enabled status only after preview/apply revalidation.
- Manual/unknown zones remain protected by design.

## WordPress.org compliance notes

- The audit recommends hiding top-level disabled Import / Export and Smart Form Sync before release because visible unimplemented features can make the plugin look unfinished or teaser-heavy.
- No external asset, remote service, telemetry, licensing, trialware, or obfuscation behavior was added.
- Documentation avoids claiming production-ready status, provider support, automatic sync, full city pricing, or all-checkout proof.

## Checks run

- `git diff --check`
- `git status --short --untracked-files=all`

No npm, PHP, build, lint, or PHPStan checks were needed because only markdown docs/report files were created.

## Check results

- `git diff --check`: passed. Git reported LF-to-CRLF warnings for pre-existing unrelated dirty files, but no whitespace errors.
- `git status --short --untracked-files=all`: reviewed. The TASK-012A deliverables are the only new files from this task; earlier dirty reports/instruction files remain unstaged and unrelated.
- No npm/PHP build was run because this task changed documentation/report files only.

## Known risks

- This is a static source audit, not a fresh browser smoke.
- Some UI behavior recommendations, especially post-apply status timing, are inferred from the current React state flow and prior smoke reports rather than reproduced live during this task.
- Existing dirty files remain in the worktree and are intentionally not included in this task.

## Blockers

None.

## Next recommended task

TASK-012B: Hide unreleased top-level tabs and simplify release navigation to the four real MVP surfaces.

## Commit hash

To be recorded in the final task response after the commit is created.
