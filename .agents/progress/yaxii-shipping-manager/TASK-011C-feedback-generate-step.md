# TASK-011C Feedback - Separate Preview and Generate Steps

Date: 2026-06-29

## Goal

Apply UX feedback to the generator preview flow after TASK-011C:

- Keep Preview coverage short and move detail into a tooltip.
- Remove the Preview sample section.
- Remove the old ready-to-save action card from Preview.
- Add a separate reference-style Generate step after Preview.
- Keep all real preview/apply backend behavior and avoid fake prototype logic.

## Scope

In scope:

- Frontend generator wizard presentation.
- Real `PreviewResponse` display mapping.
- Real `fetchApply` wiring from a separate Generate step.
- Documentation, runtime smoke notes, and rebuilt admin asset.

Out of scope:

- WooCommerce backend write behavior changes.
- SafeApplyEngine changes.
- New REST routes.
- Reset/wipe tooling.
- CSV backend.
- Commune-specific pricing.
- Provider imports.
- Sync features.
- External assets or remote runtime code.

## Files Changed

- `admin-app/src/components/generator/GeneratorFinalStep.tsx`
- `admin-app/src/components/generator/GeneratorPreviewSummary.tsx`
- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/lib/generator/preview-summary.ts`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-F01FVp9u.css`
- `assets/admin/assets/main-B8SBWTnb.js`
- `docs/GENERATOR-PREVIEW-REFERENCE-INTEGRATION-PLAN.md`
- `docs/RUNTIME-SMOKE.md`

## Files Created

- `admin-app/src/components/generator/GeneratorGenerateStep.tsx`
- `admin-app/src/lib/generator/generate-result.ts`
- `.agents/progress/yaxii-shipping-manager/TASK-011C-feedback-generate-step.md`

## Files Removed

- `admin-app/src/components/generator/GeneratorApplyActionCard.tsx`
- `admin-app/src/components/generator/GeneratorApplyResult.tsx`
- `admin-app/src/components/generator/GeneratorPreviewSample.tsx`
- replaced old built JS asset under `assets/admin/assets/`

## What Was Before

- Preview and write action lived together on the same final step.
- Preview coverage could show a long commune explanation directly in the summary tile.
- The Preview step included a sample section.
- The Preview step included an action card with ready/save wording.

## What Changed

- Preview is now a read-only review step.
- The coverage tile shows `Wilaya level` and exposes the detailed coverage explanation through `Coverage details`.
- Preview sample rendering and its unused helper code were removed.
- The old action card was removed from Preview.
- The wizard now has a separate Step 9 `Generate` screen based on the reference action-card shape.
- The Generate step uses real `fetchApply` and sends the existing internal preview hash, timestamp, accepted summary, safety snapshot, contract version, confirmation phrase, and original preview request.
- The Generate step shows one-click `Generate setup`, loading animation classes, real result copy, and post-result actions for returning to the editor or opening WooCommerce shipping zones.
- Preview-only mode and blocked previews do not show the generate action.

## What Still Remains Mocked

- No fake generator or fake apply behavior was added.
- CSV backend remains unavailable.
- Commune-specific pricing remains unavailable.
- Provider import and sync features remain unavailable.

## Security Notes

- No new REST routes were added.
- No external scripts, styles, fonts, or hidden calls were added.
- The generate action still goes through the existing nonce-backed REST client.
- Backend-required confirmation data stays internal to the request.

## WooCommerce Safety Notes

- No WooCommerce PHP write logic was changed.
- The frontend still calls the existing preview/apply backend only.
- Manual-zone protection, conflict blocking, backend revalidation, and no-delete policy remain backend-owned.
- Browser smoke did not press `Generate setup`, so no WooCommerce write occurred during this feedback pass.

## WordPress.org Compliance Notes

- No remote assets were added.
- No tracking, licensing, upsell, obfuscated code, or provider API was added.
- Built assets remain local to the plugin.

## Browser Smoke Result

Passed with a caveat:

- Authenticated browser smoke used a temporary administrator user, then deleted it.
- A cache-busted admin URL was used to ensure the current built asset loaded.
- `Start generator` required keyboard activation in agent-browser, matching prior smoke behavior.
- Wizard showed the separate `Step 9 of 9 - Generate`.
- Preview showed `Coverage` as `Wilaya level`.
- The longer coverage explanation was not visible in the Preview card.
- Preview sample was not visible.
- The old ready-to-save action card was not visible.
- Preview advanced to Generate only after the real preview was ready.
- Generate showed `Generate shipping setup`, `Generate setup`, and reference-style safety lines.
- The generate button was not pressed because it calls the real WooCommerce write path.

## Runtime Smoke Result

- `npm run build` produced the current admin bundle.
- Browser smoke verified the generated admin asset through `wp-admin`.
- No runtime WooCommerce write smoke was run in this pass because the request was a UI feedback change and the browser generate action would modify store configuration.

## Checks Run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Browser smoke in `wp-admin`
- source map scan
- restricted phrase scan
- raw dataset bundling scan
- external asset scan
- WooCommerce write scan
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Typecheck passed.
- Lint passed with the existing 8 Fast Refresh warnings in shared UI files and `main.tsx`.
- Build passed.
- Browser smoke passed for Preview and Generate presentation.
- Final scan results are recorded in the terminal output for this task.

## QA Guard Findings

- Clean code: the Preview step no longer owns apply state or result rendering; the new Generate component is kept focused.
- Docs: integration plan and runtime smoke notes were updated to match actual behavior.
- WordPress/WooCommerce: no PHP write path changed; write behavior remains behind the existing safe backend.
- REST: no endpoint contract changes were introduced.
- Directory guidelines: no remote dependency or hidden external behavior was added.

## Maintainability Notes

- `GeneratorGenerateStep.tsx` is below the 300-line target after moving result summary text to `admin-app/src/lib/generator/generate-result.ts`.
- `GeneratorFinalStep.tsx` is now a small preview-only composition component.
- `GeneratorWizard.tsx` and `admin-app/src/routes/index.tsx` remain large and should be split in future tasks.

## Known Risks

- The browser smoke did not click `Generate setup`; success animation/result after a real write was verified by code wiring, not by a store-changing browser action.
- The tooltip content is implemented with the existing Radix tooltip component; agent-browser text extraction did not expose portal tooltip text during hover, so the detail placement was also verified from source and built JS.
- Existing generator copy still contains some backend-shaped language outside this feedback scope.

## Blockers

- None.

## Next Recommended Task

TASK-011D: perform a controlled disposable-store generate smoke that clicks `Generate setup`, verifies the loading/result state, confirms no duplicate methods, and restores any touched managed setup if needed.

## Commit Hash

Pending until commit.
