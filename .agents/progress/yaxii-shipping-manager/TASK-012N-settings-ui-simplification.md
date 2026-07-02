# TASK-012N - Settings UI Simplification

Date: 2026-07-02

## Goal

Simplify the visible Settings page after the TASK-012L settings logic audit while preserving the full settings REST/backend contract for compatibility.

## Scope

- Frontend Settings page UX cleanup.
- Documentation updates for the visible Settings contract and runtime smoke checklist.
- Built admin asset refresh.
- No backend settings key deletion, REST response shape change, SafeApplyEngine change, Generator behavior change, Shipping Editor behavior change, or WooCommerce write behavior change.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/012n-settings-ui-simplification`
- Base commit: `b30af23 TASK-012L: audit settings logic and UX`
- TASK-012M present locally: `d647f2d TASK-012M: shorten disabled status label`
- Unrelated dirty files existed before this task and were not staged.

## Settings UI Before/After

Before:

- Settings rendered a large defaults form with dataset mode, region label format, zone naming, zone prefix, office wording, method labels/default prices, custom method slots, disabled safety toggles, reset defaults, and advanced removal tooling.
- The page copy said `Save defaults for future setup.`, which could imply a broader defaults workflow than the MVP can safely explain.

After:

- Settings title remains `Settings`.
- Description is now `Manage global preferences and advanced setup tools.`
- Visible sections are:
  - `General`
  - `Safety rules are always on`
  - `Advanced tools`

## Fields Kept Visible

- `Wilaya display language`
  - Saves the existing `regionLabelFormat` field.
  - Choices remain `French`, `Arabic`, `French - Arabic`, and `Arabic - French`.
  - Help text says it is used for Algeria wilaya labels in WooCommerce and as the default for new Generator drafts.

## Fields Hidden

Hidden from visible Settings UI only:

- `datasetMode`
- `zoneNameFormat`
- `zonePrefix`
- `officeWordingMode`
- `officeCustomLabel`
- method labels
- default method prices
- custom method enabled states
- disabled safety toggles
- `Reset defaults`

The TypeScript settings types, default settings data, and REST payload contract remain intact because Generator and API parsing still use them.

## Safety Card Behavior

Disabled safety toggles were replaced by a read-only card:

```text
Safety rules are always on
Yaxii protects manual WooCommerce zones, requires preview before apply, skips conflicts by default, and never deletes manual zones.
These rules cannot be disabled in this release.
```

## Advanced Tools Behavior

`Remove Yaxii setup` remains in Settings under Advanced tools. The visible description now says:

```text
Remove only Yaxii-managed WooCommerce zones and methods. Manual WooCommerce zones will not be touched.
```

The existing preview/modal/confirmation/removal flow was not changed, and destructive removal was not executed.

## Backend REST Contract Preservation

- `GET /settings` and `PUT /settings` response/request shape remain unchanged.
- The frontend still keeps a complete `PersistedSettings` object in state.
- Saving Settings submits the complete settings object, not a partial payload.
- Only the visible UI control mutates `regionLabelFormat`.

## Hidden Settings Preservation Behavior

In-process REST smoke saved a changed `regionLabelFormat`, verified hidden fields were preserved, and restored the original option:

```json
{"status":200,"changed":true,"hiddenPreserved":true,"restored":true,"beforeRegion":"fr_ar","savedRegion":"fr"}
```

If a store already has `datasetMode: legacy_58`, this task does not silently change it. The saved value remains a compatibility risk for a later dataset/runtime decision.

## Runtime/Browser Smoke Result

- Browser automation was blocked: `agent-browser doctor --offline --quick` hung with no output and had to be stopped by exact PID.
- WP-CLI eventually returned the LocalWP URL: `http://yaxii-ysz.local`.
- Fallback REST smoke passed as documented above.
- Static source/bundle checks confirm old Settings-only copy and removed Settings defaults controls are not present in the current Settings bundle.

## Files Changed

- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-BfE6TFFu.css`
- `assets/admin/assets/main-DSUfFPfk.js`
- `docs/SETTINGS-CONTRACT.md`
- `docs/SETTINGS-UX-LOGIC-AUDIT.md`
- `docs/RUNTIME-SMOKE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-012N-settings-ui-simplification.md`

Removed stale built assets:

- `assets/admin/assets/main-B9fh4DN5.css`
- `assets/admin/assets/main-oBPj8BrD.js`

## What Remains Not Implemented

- No backend settings migration.
- No removal of hidden/backend settings keys.
- No Generator-to-Settings sync.
- No Shipping Editor-to-Settings sync.
- No change to diagnostics dataset behavior.
- No WooCommerce write path changes.
- No CSV backend, commune-level pricing, provider imports, YSF sync, telemetry, licensing, or Pro locks.

## QA Guard Findings

- `clean-code-guard`: scope is narrow; no new abstraction or production write behavior added.
- `docs-guard`: docs now match the visible UI and preserve backend compatibility wording.
- `woo-guard`: no new WooCommerce write/delete path was added; removal executor remains the existing path.
- `wp-guard`: no PHP or WordPress capability/nonce code changed.
- `wp-rest-api`: settings endpoint contract remains full-shape `PersistedSettings`.
- `wp-plugin-directory-guidelines`: no external assets, telemetry, licensing, hidden calls, or upsells added.

## Checks Run / Results

- `npm run typecheck` in `admin-app` - passed.
- `npm run lint` in `admin-app` - passed with existing fast-refresh warnings in shared UI files and `main.tsx`.
- `npm run build` in `admin-app` - passed; Vite emitted the existing chunk-size warning.
- Source maps under `assets/admin` - none found.
- Restricted phrase scan - no matches.
- Raw dataset bundling scan over built assets - no matches.
- External asset scan for Google Fonts, remote CSS, and remote scripts - no matches.
- WooCommerce write/delete zero-context diff scan - no matches.
- REST settings smoke - passed and restored the original option.
- `git diff --check` - pending final QA pass.
- `git status --short --untracked-files=all` - pending final QA pass.

## Known Risks

- Browser UI smoke could not be completed because `agent-browser doctor --offline --quick` hung.
- Saved hidden `datasetMode` still affects dataset loading and diagnostics until a later explicit migration/runtime decision.
- The built JS chunk remains over 500 kB, matching the existing Vite warning.
- Unrelated dirty files remain in the worktree and must not be staged with this task.

## Blockers

- Browser automation unavailable during this run. REST smoke covered the settings save contract, but the exact visual checklist remains manual/browser QA.

## Next Recommended Task

TASK-012O should decide the saved `datasetMode` runtime behavior now that dataset mode is hidden from Settings, especially how Diagnostics and WooCommerce Algeria state registration should behave for stores that previously saved `legacy_58`.

## Commit Hash

Pending before commit; final response records the created commit hash.
