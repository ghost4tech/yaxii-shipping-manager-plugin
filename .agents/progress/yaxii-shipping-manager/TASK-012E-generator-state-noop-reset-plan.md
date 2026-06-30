# TASK-012E: Generator State Logic, No-op UX, and Reset Tool Plan

## Date

2026-06-30

## Goal

Make the Generator state-aware so merchants are not pushed through no-op setup flows, improve preview/generate no-op handling, keep Preview only as an advanced support path, and document a future safe removal tool without implementing destructive behavior.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git root: plugin root.
- Branch: `task/012e-generator-state-noop-reset-plan`
- TASK-012D commit `90f43c7` was present locally before implementation.
- Pre-existing unrelated dirty files were present before this task and were not staged.
- Commit hash: pending at report creation; final response reports the committed hash.

## Scope

- Generator frontend state logic and copy.
- Preview and Generate no-op UX.
- Documentation and runtime smoke checklist.
- Reset/removal tool plan only.
- Rebuilt admin bundle.

No backend apply/reset/delete behavior was added.

## Files changed

- `admin-app/src/components/generator/GeneratorFinalStep.tsx`
- `admin-app/src/components/generator/GeneratorGenerateStep.tsx`
- `admin-app/src/components/generator/GeneratorPreviewSummary.tsx`
- `admin-app/src/components/generator/GeneratorStartStep.tsx`
- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/lib/generator/diagnostics-guidance.ts`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-B0ufSAlB.js`
- `assets/admin/assets/main-jlayDG6c.js`
- `docs/GENERATOR-WIZARD.md`
- `docs/RELEASE-UX-WORKFLOW-AUDIT.md`
- `docs/RUNTIME-SMOKE.md`

## Files created

- `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`
- `.agents/progress/yaxii-shipping-manager/TASK-012E-generator-state-noop-reset-plan.md`

## What was before

- Generator Start still presented setup modes as roughly equal choices.
- A store with existing managed setup could be pushed through Start -> Coverage -> Methods -> Prices -> Names -> Preview -> Generate with no meaningful work.
- Preview-only was available as a mode but the Generator still felt like a normal merchant path.
- No-op previews still exposed plan groups by default.
- Generate no-op copy was generic and did not provide the exact daily-management route.
- No safe reset/removal plan existed.

## What changed

- Start now derives an explicit state from diagnostics:
  - fresh setup
  - repair needed
  - setup already active
  - manual review
  - diagnostics unavailable
- The Start footer no longer has a generic Continue button. Users advance only through state-aware actions.
- Fully active setup routes primarily to Shipping Zones and offers `Modify setup anyway` as a secondary path.
- Manual-zone/conflict state routes to Diagnostics or WooCommerce zones.
- Fresh setup uses `Start setup`.
- Repair setup uses `Repair setup` and preselects only missing or method-incomplete managed wilayas.
- Create mode warns when existing managed setup exists.
- Preview-only is a small support option and stops at Preview.
- No-op Preview shows `Setup already matches this selection` and hides normal plan group cards by default.
- No-op Generate shows `No setup changes needed`, offers `Open Shipping Zones`, and does not show a Generate button.
- Unsupported-only Generate shows `No supported changes in this release` and does not show a Generate button.

## Start-state behavior

- Fresh/no setup: `Create a new shipping setup`, `Start setup`.
- Repair needed: `Repair missing setup`, `Repair setup`.
- Fully active setup: `Your shipping setup is already active`, `Open Shipping Zones`, `Modify setup anyway`.
- Manual review: `Manual zones need review`, `Review Diagnostics`, `Open WooCommerce zones`.
- Diagnostics unavailable: starts setup but tells the user preview will verify WooCommerce again.

## Mode behavior differences

- Create new setup selects all wilayas for the loaded dataset.
- Repair existing setup uses `repairWilayaCodes()` and no longer falls back to all wilayas when no repair work exists.
- Preview only is advanced/support and does not continue to Generate.

## No-op Generate behavior

- No supported work: `No setup changes needed`.
- Message: `WooCommerce already matches this setup. Use Shipping Zones for daily price changes.`
- Actions: `Open Shipping Zones`, `Back to edit setup`.
- No Generate button is shown.

## Preview-only behavior

- Preview-only can be started from the small secondary Start option.
- It reaches Preview and shows `Done reviewing`.
- Generate remains disabled and no apply/generate control is exposed.

## Reset tool plan

Created `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`.

Planned future tool:

- Name: `Remove Yaxii-managed setup`
- Location: `Settings -> Advanced tools` preferred, or `Diagnostics -> Advanced tools`.
- Dry-run first.
- Deletes only registry-owned managed setup from `yaxii_shipping_manager_managed_zones`.
- Never deletes manual WooCommerce zones.
- Requires typed confirmation: `REMOVE YAXII SETUP`.
- Blocks on registry mismatch or conflicts unless a repair/reconcile flow exists.

No reset/delete/wipe endpoint or UI was implemented.

## Browser/runtime smoke result

Browser smoke ran against `http://yaxii-ysz.local/wp-admin/admin.php?page=yaxii-shipping-manager&v=012e-smoke` using a temporary administrator user `ysm_smoke_012e`, which was deleted after the smoke.

Observed:

- The live store had one manual/protected row, so the fully managed Start case was not observable in this database state.
- Generator Start correctly showed the manual-review path with `Review Diagnostics`, `Open WooCommerce zones`, and small `Preview only`.
- Pointer click on `Start generator` still did not open the modal reliably in agent-browser; keyboard activation worked, matching prior smoke notes.
- Preview-only advanced path advanced to Coverage, Methods, Prices, Names, and Preview.
- Preview auto-ran and showed `Setup already matches this selection`.
- Preview-only stopped at Preview with `Done reviewing`.
- Generate remained disabled and no Generate/apply button was shown.
- No apply action was clicked.
- WooCommerce zone count after smoke: `69`.
- WooCommerce method count after smoke: `205`.

## What remains mocked/not implemented

- Destructive reset/removal tool.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Manual-zone adoption.
- Zone-name updates.

## Security notes

- No PHP, REST route, nonce, capability, or filesystem write behavior changed.
- No direct request access was added.
- Browser smoke used a temporary local administrator and deleted it after use.

## WooCommerce safety notes

- No new WooCommerce write path was added.
- Generator still writes only through existing preview/apply paths when supported work exists.
- Preview-only and no-op paths do not expose apply/generate actions.
- Reset/removal remains documentation only.

## WordPress.org compliance notes

- No telemetry, licensing, Pro locks, remote assets, external fonts, or hidden calls were added.
- The reset/removal plan requires local-first, transparent, typed-confirmation behavior and explicitly excludes manual-zone deletion.

## QA guard findings

- `clean-code-guard`: removed the dead recommendation wrapper and kept new state logic in `diagnostics-guidance.ts` rather than adding more branching inside the Start component.
- `docs-guard`: docs now describe the implemented Start/no-op behavior and label reset/removal as a future plan only.
- `woo-guard`: no new WooCommerce writes; no delete/reset/adoption behavior.
- `wp-guard`: no new PHP/admin request handling or public output.
- `wp-rest-api`: no REST endpoint or schema change.
- `wp-plugin-directory-guidelines`: no external service, licensing, obfuscation, or upsell surface added.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Source map scan under `assets/admin`
- Restricted runtime phrase scan over `admin-app/src`, `src`, and `assets/admin`
- Raw dataset bundling scan over built JS
- External asset scan over `admin-app/src`, `src`, and `assets/admin`
- WooCommerce write scan over changed source diff
- Browser smoke with agent-browser
- `wp option get siteurl`
- WooCommerce post-smoke zone count via WP-CLI
- WooCommerce post-smoke method count via WP-CLI
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- TypeScript typecheck: passed.
- ESLint: passed with 8 existing Fast Refresh warnings.
- Admin build: passed with existing Vite tsconfig-paths notice and chunk-size warning.
- Source map scan: passed, no `.map` files found.
- Restricted runtime phrase scan: passed.
- Raw dataset bundling scan: passed.
- External asset scan: passed.
- WooCommerce write scan: no PHP write diff; frontend diff only references existing preview/apply client boundaries and navigation copy.
- Browser smoke: partially passed. Manual-review and Preview-only/no-op behavior verified; fully managed Start case could not be observed because this store currently has one manual/protected row.
- `wp option get siteurl`: passed, returned `http://yaxii-ysz.local`.
- WooCommerce zone count after smoke: `69`.
- WooCommerce method count after smoke: `205`.
- `git diff --check`: passed; line-ending warnings only.

## Known risks

- The fully managed Start case still needs browser verification on a database state with no manual/protected rows.
- The built JS chunk remains slightly above Vite's warning threshold.
- Preview-only browser smoke verified no Generate/apply button but did not exercise Generate-step no-op in non-preview mode because this store's current state routes to manual review.

## Blockers

- No implementation blocker.
- Browser verification of the fully managed state is blocked by current local store data containing one manual/protected row.

## Next recommended task

Run a follow-up smoke on a disposable fully managed database state with no manual/protected rows, then implement the safe dry-run contract for `Remove Yaxii-managed setup` as a separate task if approved.
