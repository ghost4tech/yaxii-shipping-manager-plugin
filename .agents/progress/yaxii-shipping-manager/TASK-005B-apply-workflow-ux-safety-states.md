# TASK-005B - Apply Workflow UX and Safety States

Date: 2026-06-27

## Goal

Define and implement read-only apply workflow UX states so merchants can understand whether a store is fresh, partially configured, manually configured, conflicted, missing methods, Yaxii-managed, or blocked before any real apply engine exists.

## Scope

- Added a read-only backend apply readiness evaluator.
- Extended the preview response with `applyReadiness`.
- Added frontend preview UI for readiness severity, state copy, blocking reasons, and counts.
- Added apply workflow documentation.
- Updated preview and apply contract documentation.
- Rebuilt admin assets because frontend source changed.

No WooCommerce writes were implemented.

## Files Changed

- `admin-app/src/api/preview-api.ts`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/types/preview.ts`
- `assets/admin/.vite/manifest.json`
- `docs/APPLY-CONTRACT.md`
- `docs/PREVIEW-PLANNER.md`
- `src/Preview/PreviewPlanner.php`
- Removed old built assets:
  - `assets/admin/assets/main-CVgJ7N5E.js`
  - `assets/admin/assets/main-DC0_2Kkp.css`
- Added new built assets:
  - `assets/admin/assets/main-BDtjsXzv.js`
  - `assets/admin/assets/main-CbyWoWLR.css`

## Files Created

- `src/Apply/ApplyReadinessEvaluator.php`
- `docs/APPLY-WORKFLOW.md`
- `.agents/progress/yaxii-shipping-manager/TASK-005B-apply-workflow-ux-safety-states.md`

## What Was Before

The preview response returned plan groups, warnings, safety policy, and `canApplyLater: false`, but it did not summarize what the plan meant for the merchant's apply-readiness state.

## What Changed

`POST /wp-json/yaxii-shipping-manager/v1/preview` now includes:

```json
"applyReadiness": {
  "state": "fresh_store",
  "severity": "ready",
  "title": "Ready to create Yaxii shipping zones",
  "message": "No existing Algeria wilaya zones were found. Future apply can create reviewed Yaxii-managed zones.",
  "recommendedAction": "Review the plan before applying.",
  "blockingReasons": [],
  "counts": {
    "creates": 69,
    "updates": 0,
    "manualSkips": 0,
    "conflicts": 0,
    "methodAdditions": 0,
    "methodUpdates": 0
  }
}
```

The admin preview panel now displays this readiness state as a compact safety card above the plan groups.

## Apply Workflow States

Implemented states:

- `fresh_store`
- `partial_setup`
- `manual_zones_detected`
- `conflicts_detected`
- `methods_missing`
- `yaxii_managed_ready`
- `blocked`

Implemented severities:

- `ready`
- `attention`
- `blocked`

## Readiness Evaluation Behavior

The evaluator uses:

- preview plan groups
- diagnostics payload
- apply contract summary data
- locked safety policy
- selected wilaya count

Priority:

1. WooCommerce inactive or no selected wilayas returns `blocked`.
2. Conflicts return `conflicts_detected` with `blocked` severity.
3. Manual/unknown overlaps return `manual_zones_detected`.
4. Method additions or updates return `methods_missing`.
5. Existing managed registry rows return `yaxii_managed_ready`.
6. Partial configured/missing coverage returns `partial_setup`.
7. Create-only plans return `fresh_store`.

## REST Contract Changes

The existing preview endpoint was extended:

```text
POST /wp-json/yaxii-shipping-manager/v1/preview
```

No new write endpoint was added. The endpoint remains protected by capability and REST nonce.

## Frontend Changes

- Preview response parser now requires `applyReadiness`.
- Preview panel displays:
  - readiness title
  - severity badge
  - state message
  - recommended next action
  - blocking reasons when present
  - readiness counts
- Apply remains disabled.
- UI still says the apply engine is not enabled.

## What Still Remains Mocked

- Wizard draft state remains local.
- CSV import/export remains UI-only.
- Future apply action remains unavailable.

## What Was Not Implemented

- No WooCommerce shipping zones were created, updated, or deleted.
- No WooCommerce shipping methods were added or updated.
- No method prices were changed.
- No safe apply engine was implemented.
- No preview plan persistence was implemented.
- No CSV backend was implemented.
- No YSF sync was implemented.
- No checkout fields were modified.
- No provider imports, commune-level pricing, telemetry, licensing, Pro locks, or remote calls were added.

## Security Notes

- No public endpoint was added.
- Preview remains protected by capability and REST nonce.
- No new request fields were added.
- The evaluator reads already-sanitized preview output and diagnostics data.

## WooCommerce Safety Notes

- No WooCommerce write APIs were added.
- No `WC_Shipping_Zone` write path was added.
- No shipping methods are added or modified.
- Readiness states are explanatory only.
- Manual/unknown zones remain protected.
- `canApplyLater` remains `false`.

## WordPress.org Compliance Notes

- No telemetry, analytics, licensing, remote calls, external CDN assets, or obfuscation were added.
- Documentation avoids claiming that apply exists.
- The UI does not claim zones were generated or applied.

## QA Guard Findings

- `woo-guard`: Pass. The evaluator and UI are read-only and do not call WooCommerce write APIs.
- `wp-guard`: Pass. No new public route, state-changing route, direct superglobal access, SQL, or unescaped PHP output was added.
- `wp-rest-api`: Pass. The existing protected preview endpoint response shape was extended; permission and nonce behavior are unchanged.
- `wp-plugin-directory-guidelines`: Pass. No guideline-risk features such as tracking, licensing, remote dependencies, or Pro gates were added.
- `clean-code-guard`: Pass. The evaluator is separate from the planner, has deterministic state priority, and does not return fake apply success.
- `docs-guard`: Pass. `docs/APPLY-WORKFLOW.md`, `docs/APPLY-CONTRACT.md`, and `docs/PREVIEW-PLANNER.md` match the implemented read-only contract.

## Checks Run

- `composer dump-autoload`
- `php -l src/Apply/ApplyReadinessEvaluator.php`
- `php -l src/Preview/PreviewPlanner.php`
- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- no source maps under `assets/admin`
- forbidden string scan over `src`, `admin-app/src`, and `assets/admin`
- raw dataset bundling scan over built JS
- WooCommerce write scan over apply/preview/frontend paths
- option write scan over `src`
- `git diff --check`
- `git status --short --untracked-files=all`

## Check Results

- Composer autoload: passed.
- PHP lint: passed for changed PHP files.
- TypeScript typecheck: passed.
- Admin lint: passed with 8 existing Fast Refresh warnings and 0 errors.
- Admin build: passed; generated `assets/admin/assets/main-BDtjsXzv.js` and `assets/admin/assets/main-CbyWoWLR.css`.
- Source maps: none found under `assets/admin`.
- Forbidden runtime strings: no matches in `src`, `admin-app/src`, or `assets/admin`.
- Raw dataset bundle strings: no matches in built JS.
- WooCommerce apply/preview write scan: no matches.
- Option write scan: found only existing settings option writes in `SettingsRepository`.
- `git diff --check`: passed with Git CRLF warnings only.
- Final git status: task-scoped changes only before commit.

## Known Risks

- Runtime REST smoke testing through WordPress was not performed in this task.
- The readiness state is a UX contract only; the real apply engine still needs its own server-side confirmation and re-read safeguards.
- Existing lint Fast Refresh warnings remain in shared UI files.

## Blockers

None.

## Next Recommended Task

TASK-006A: implement the safe apply engine design audit and confirmation contract before introducing WooCommerce write code.

## Commit Hash

Final commit hash is reported in the task closeout response.
