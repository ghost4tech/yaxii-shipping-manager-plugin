# TASK-007C: Git Sync and Runtime Smoke for Redesigned Generator Wizard

Date: 2026-06-28

## Goal

Cleanly sync the TASK-007A and TASK-007B Git history, keep the Lovable reference app out of committed code, restore or diagnose the local WordPress runtime, and run a logged-in wp-admin smoke test for the redesigned Generator Wizard.

## Scope

- Verification and narrow polish only.
- No WooCommerce shipping zone writes.
- No apply engine implementation.
- No CSV backend implementation.
- No commune-level pricing implementation.
- No provider imports, YSF sync, telemetry, licensing, Pro locks, external assets, or remote calls.

## Git Branch State Before

- Starting branch: `task/007b-generator-wizard-reference-integration`.
- Starting status: only `.agents/references/yaxii-shipping-hub-03/` was untracked.
- Recent local history:
  - `2bfe6b4` `TASK-007B: integrate redesigned generator wizard`
  - `c47cd48` `TASK-007A: plan generator wizard product flow`
  - `4eba2e6` `TASK-006B: wire admin product flow before apply`
- Local commit presence:
  - TASK-006B: present at `4eba2e6`
  - TASK-007A: present at `c47cd48`
  - TASK-007B: present at `2bfe6b4`
- Before sync, `main` and `origin/main` included TASK-006B but did not include TASK-007A or TASK-007B.

## Git Sync Result

- Fetched `origin`.
- Fast-forwarded `main` to `task/007b-generator-wizard-reference-integration`.
- Pushed `main` to `origin`.
- Pushed `task/007b-generator-wizard-reference-integration` to `origin`.
- No history was rewritten.
- No branches were deleted.

## Main Includes TASK-007A and TASK-007B

- Local `main`: includes TASK-007A and TASK-007B after fast-forward.
- `origin/main`: includes TASK-007A and TASK-007B after push.

## Main Push Result

`main` was pushed successfully to `origin` after the fast-forward sync.

## Reference App Handling

`.agents/references/yaxii-shipping-hub-03/` remains untracked and was not staged or committed. Its nested `.git` directory was left untouched.

## Runtime DB Result

Initial WP-CLI bootstrap failed with:

```text
Error: Error establishing a database connection.
```

Diagnosis found that LocalWP MySQL was running on `127.0.0.1:10124`, while `wp-config.php` pointed at `localhost`. A direct PHP mysqli probe to `127.0.0.1:10124` using the configured LocalWP database credentials succeeded.

Local runtime fix applied outside the plugin repository:

- `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-config.php`
- `DB_HOST` changed from `localhost` to `127.0.0.1:10124`

After the local fix, WP-CLI bootstrap succeeded:

- `wp option get siteurl`: `http://yaxii-ysz.local`
- `wp plugin status yaxii-shipping-manager`: active, version `0.1.0`
- `wp plugin status woocommerce`: active, version `10.9.1`

The local `dev` administrator password was reset via WP-CLI only to allow the logged-in smoke test.

## Browser Smoke Result

Logged-in wp-admin smoke passed after the runtime DB fix and asset rebuild.

Verified:

- Plugin admin page loads.
- Generator tab opens.
- Redesigned wizard opens.
- Setup mode step works.
- CSV section is visible and clearly disabled/unavailable.
- Wilaya selection works.
- Communes skip path works.
- Communes show path lazy-loads rows by wilaya through `/wp-json/yaxii-shipping-manager/v1/dataset?mode=current&include=communes&wilaya_code=16`.
- Commune search/filter accepts input.
- Delivery method labels are editable.
- Default methods are not hard-locked; Office / Stopdesk can be disabled.
- Custom method slots are capped at `custom_1` and `custom_2`.
- Prices step flags negative prices as invalid and blocks progress while invalid.
- Names/labels step works.
- Safety step explains manual-zone protection and preview-only behavior.
- Preview step calls `/wp-json/yaxii-shipping-manager/v1/preview`.
- Preview output appears.
- Readiness card appears.
- Preview groups appear.
- Preview hash and contract version appear.
- Diagnostics shortcut opens the Diagnostics view.
- Apply remains disabled.
- No fake generated/applied success copy appears.
- WooCommerce zone count remained `0` after the smoke test.

## UI Issues Found

- The preview metadata label read `Preview reference` instead of the required `Preview hash`.
- Fixed narrowly in `PreviewPlanPanel` and rebuilt admin assets.
- Minor smoke note: the invalid price state blocks progression correctly, but the Continue button can still look enabled. This is a UX polish item, not a data safety issue.

## Files Changed

- `admin-app/src/components/generator/PreviewPlanPanel.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-C1D7I7E5.js` removed by rebuild
- `assets/admin/assets/main-A6qveiuR.js` added by rebuild
- Local runtime only, outside plugin repo: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-config.php`

## Files Created

- `.agents/progress/yaxii-shipping-manager/TASK-007C-git-sync-runtime-smoke.md`
- `assets/admin/assets/main-A6qveiuR.js`

## What Was Before

- `main` and `origin/main` stopped at TASK-006B.
- TASK-007A and TASK-007B existed only on the task history.
- Local WordPress could not bootstrap because the database host did not match the active LocalWP MySQL port.
- Browser smoke for TASK-007B was blocked.
- Preview metadata used the less precise `Preview reference` label.

## What Changed

- `main` and `origin/main` now include TASK-007A and TASK-007B.
- The TASK-007B branch was pushed to `origin`.
- Local WordPress runtime was restored by pointing `wp-config.php` at the active LocalWP MySQL port.
- A logged-in wp-admin smoke test was completed.
- Preview metadata now labels the value as `Preview hash`.
- Admin assets were rebuilt from the updated React source.

## What Still Remains Mocked Or Disabled

- Apply remains disabled.
- No WooCommerce shipping zones are created, updated, or deleted.
- No WooCommerce shipping methods are added.
- CSV import remains UI-only/coming soon.
- No CSV sample backend exists.
- Commune data is informational/read-only.
- Commune-level pricing is not implemented.
- Provider imports and YSF sync are not implemented.

## Security Notes

- No new REST endpoints were added.
- No capability, nonce, or authentication behavior was changed.
- No telemetry, analytics, external scripts, or remote calls were added.
- The local admin password reset was only for the local smoke environment.

## WooCommerce Safety Notes

- No WooCommerce write APIs were added or called.
- WooCommerce zone count remained `0` after smoke testing.
- Apply stayed disabled.
- The smoke test exercised preview-only contracts.

## WordPress.org Compliance Notes

- The reference app stayed untracked and uncommitted.
- No external CDN assets were added.
- No licensing, Pro locks, telemetry, tracking, obfuscation, or provider API behavior was added.
- Disabled CSV UI remains honest and does not claim import success.

## QA Checks

- `npm run typecheck` in `admin-app`: passed.
- `npm run lint` in `admin-app`: passed with existing Fast Refresh warnings in shared UI files and `main.tsx`.
- `npm run build` in `admin-app`: passed.
- Source maps under `assets/admin`: none found.
- Forbidden string scan over product source/assets: passed.
- Broad docs scan found only guardrail mentions in docs.
- Raw dataset bundling scan over built JS: passed.
- WooCommerce write API scan: no shipping write APIs found; existing reads/settings saves are not WooCommerce zone writes.
- `git diff --check`: passed with line-ending warnings for generated assets.
- `git status --short --untracked-files=all`: `.agents/references/yaxii-shipping-hub-03/` remains untracked.

## Check Results

The QA checks passed for the scoped UI/runtime verification. The only warnings were existing React Fast Refresh lint warnings and generated-asset line-ending warnings.

## Known Risks

- `wp-config.php` required a local DB host correction outside the plugin repository. This is environment-specific and should not be committed to the plugin.
- The Continue button visual state on invalid prices could be clearer even though progression is blocked.
- The untracked reference app still contains a nested `.git`; it must stay out of commits.

## Blockers

No blocker remains for this task after the LocalWP DB host correction.

## Next Recommended Task

TASK-008 should focus on the safe apply engine design/implementation only after another review of the preview planner contract and manual-zone protection rules.

## Commit Hash

Pending until the TASK-007C commit is created.
