# TASK-012L - Settings Logic and UX Audit

## Date

2026-07-02

## Goal

Audit the Settings page logic, backend contracts, and merchant UX to decide which settings should stay, move to Generator, become read-only, or remain backend-only. No product behavior was changed.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git root: `C:/Users/Aymen/Local Sites/yaxii-ysz/app/public/wp-content/plugins/yaxii-shipping-manager`
- Branch created/switched to: `task/012l-settings-logic-ux-audit`
- Started from `d647f2d` (`TASK-012M: shorten disabled status label`)
- Recent local checkpoints confirmed:
  - `69eb754` (`TASK-012J: polish shipping editor status and layout`)
  - `c098ae5` (`TASK-012K: clean generator and removal UI polish`)
  - `099ea66` (`TASK-012L: unify page headings`)
  - `d647f2d` (`TASK-012M: shorten disabled status label`)
- No nested `app/.git` exists under the plugin root.
- Pre-existing unrelated dirty files were present before this task and were not staged.

## Scope

Audit and documentation only:

- Settings UI and copy.
- Settings REST/backend storage contract.
- Generator use of saved settings and local draft overrides.
- Shipping Editor use of saved settings and live WooCommerce diagnostics.
- Diagnostics dataset/settings behavior.
- Preview/apply relationship to settings.
- Safety rules UX.
- Dataset mode UX.
- Method defaults UX.
- Advanced tools placement.

Out of scope:

- Product code changes.
- Backend settings behavior changes.
- `SafeApplyEngine` changes.
- Generator behavior changes.
- Shipping Editor behavior changes.
- Setting deletion.
- New WooCommerce write paths.
- Manual-zone adoption.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Telemetry, licensing, Pro locks, remote assets, external fonts, or hidden calls.

## Files inspected

- `AGENTS.md`
- `CLAUDE.md`
- `.agents/skills/clean-code-guard/SKILL.md`
- `.agents/skills/docs-guard/SKILL.md`
- `.agents/skills/woo-guard/SKILL.md`
- `.agents/skills/wp-guard/SKILL.md`
- `.agents/skills/wp-rest-api/SKILL.md`
- `.agents/skills/wp-plugin-directory-guidelines/SKILL.md`
- `docs/SETTINGS-CONTRACT.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`
- `docs/RUNTIME-SMOKE.md`
- `.agents/progress/yaxii-shipping-manager/TASK-012J-shipping-editor-status-layout-polish.md`
- `.agents/progress/yaxii-shipping-manager/TASK-012K-generator-removal-tabs-polish.md`
- `.agents/progress/yaxii-shipping-manager/TASK-012I-empty-setup-removal-ui-cleanup.md`
- `.agents/progress/yaxii-shipping-manager/TASK-012H-post-removal-recovery-repair-fix.md`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/data/default-settings.ts`
- `admin-app/src/api/settings-api.ts`
- `admin-app/src/types/settings.ts`
- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/lib/generator/methods.ts`
- `admin-app/src/components/shipping-zones/ShippingZonesPage.tsx`
- `admin-app/src/lib/shipping-zones/preview-request.ts`
- `admin-app/src/lib/shipping-zones/status.ts`
- `admin-app/src/components/diagnostics/*`
- `admin-app/src/api/diagnostics-api.ts`
- `admin-app/src/types/diagnostics.ts`
- `src/Settings/SettingsDefaults.php`
- `src/Settings/SettingsSanitizer.php`
- `src/Settings/SettingsRepository.php`
- `src/Rest/SettingsController.php`
- `src/Rest/Routes.php`
- `src/Rest/DiagnosticsController.php`
- `src/Rest/PreviewController.php`
- `src/Preview/PreviewPlanner.php`
- `src/Preview/PreviewRequestSanitizer.php`
- `src/WooCommerce/ShippingDiagnosticsService.php`
- `src/WooCommerce/AlgeriaStatesRegistrar.php`
- `src/Apply/SafeApplyEngine.php` usage references

## Files changed

- `docs/SETTINGS-UX-LOGIC-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-012L-settings-logic-ux-audit.md`

## Files created

- `docs/SETTINGS-UX-LOGIC-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-012L-settings-logic-ux-audit.md`

## What was before

Settings exposed a large defaults form:

- Dataset mode.
- Region label format.
- Zone name format.
- Zone prefix.
- Office method wording.
- Home/office labels and default prices.
- Custom method 1 and 2 labels, default prices, and enabled states.
- Disabled safety-rule toggles.
- Reset defaults and Save defaults.
- Advanced tools with Remove Yaxii setup.

The page copy said `Save defaults for future setup.`, but several fields overlap with Generator and some affect broader runtime behavior.

## Current settings inventory

The full inventory table is in `docs/SETTINGS-UX-LOGIC-AUDIT.md`.

Summary recommendations:

- Keep in Settings: `regionLabelFormat`, only if reframed as a global wilaya display preference.
- Move to Generator only: `datasetMode`, `zoneNameFormat`, `zonePrefix`, `officeWordingMode`, `officeCustomLabel`, method labels, method default prices, and custom method enabled states.
- Convert to read-only note: safety policy fields.
- Remove from visible UI: reset defaults.
- Keep in Settings: save action, renamed/copy-adjusted for any remaining visible setting.
- Move to Advanced: Remove Yaxii setup, keeping existing confirmation and preview behavior.
- Keep backend only for compatibility: hidden setup-default keys until a later migration is scoped.

## Backend usage findings

- `SettingsRepository` stores all settings in `yaxii_shipping_manager_settings` with autoload disabled.
- `SettingsController` exposes `GET /settings` and `PUT /settings`; `PUT` requires the REST nonce and capability.
- `SettingsSanitizer` rejects unknown keys and invalid enum/method/price values.
- Locked method defaults are forced enabled.
- Safety policy is forced to true for all rules.
- `PreviewPlanner` reads settings and then applies preview overrides for `datasetMode`, `regionLabelFormat`, `zoneNameFormat`, `zonePrefix`, and `methods`.
- `PreviewRequestSanitizer` supports those override fields.
- `SafeApplyEngine` writes from the accepted preview/apply payload; Settings save does not directly update WooCommerce zones or methods.
- `ShippingDiagnosticsService` defaults to saved `datasetMode` when no explicit dataset mode is supplied.
- `AlgeriaStatesRegistrar` uses saved `datasetMode` and `regionLabelFormat` for WooCommerce Algeria states.

## UX findings

- Settings is doing too many jobs: setup defaults, global preference, safety explanation, and destructive advanced tooling.
- Method prices in Settings are especially confusing because Shipping Editor is the live price surface.
- Zone naming in Settings is confusing because existing WooCommerce zone names are not changed by a Settings save.
- Dataset mode in Settings is riskier than the copy suggests because it can influence diagnostics/admin coverage and WooCommerce state registration.
- Disabled safety switches imply merchant choice where the engine actually has non-negotiable rules.

## Duplicate Generator/Settings findings

Generator already owns:

- Dataset selection for a setup run.
- Method selection and method labels.
- Default and per-wilaya prices.
- Zone prefix, zone name format, region label format, and office wording.
- Preview and Generate execution.

Recommendation:

- Generator is authoritative for setup-run draft values.
- Settings may prefill Generator from existing backend defaults for compatibility.
- Generator changes should not automatically save back to Settings.
- Shipping Editor live values should not sync back into Settings defaults.

## Safety rules recommendation

Remove the disabled toggles from visible Settings and replace them with:

```text
Safety rules are always on
Yaxii protects manual WooCommerce zones, requires preview before apply, skips conflicts by default, and never deletes manual zones.
```

Keep backend `safetyPolicy` for compatibility and apply-contract/hash stability.

## Dataset mode recommendation

Move dataset mode to Generator only for MVP. Keep current dataset as the normal global default unless a later task explicitly scopes a global legacy-store mode.

Important risk:

- Existing saved `legacy_58` values may still influence admin, diagnostics, and WooCommerce state registration until an implementation task handles them.

## Method defaults recommendation

Move all method labels, default prices, and custom method enabled states out of visible Settings and into Generator.

Shipping Editor remains the live WooCommerce price/status surface. Settings defaults should not imply live WooCommerce price updates.

## Advanced tools recommendation

Keep `Remove Yaxii setup` in Settings under Advanced tools. Do not move it to Diagnostics for MVP because Diagnostics is read-only and removal is a confirmed destructive write path.

## Proposed final Settings structure

Header:

```text
Settings
Manage global preferences and advanced setup tools.
```

General defaults:

- `Wilaya display language`
- Help: `Used for Algeria wilaya labels in WooCommerce and as the default for new Generator drafts.`
- Save button: `Save settings`
- Success: `Settings saved. Existing WooCommerce shipping zones and prices were not changed.`

Safety:

- `Safety rules are always on`
- Read-only copy listed above.

Advanced tools:

- `Remove Yaxii setup`
- Keep existing removal preview, confirmation modal, blockers, and technical details.

If the product decides not to keep a global display preference, Settings should contain only the safety note and Advanced tools.

## What changed

Documentation only:

- Created the settings UX/logic audit.
- Created this progress report.

No product code changed.

## What still remains mocked

Existing limitations remain unchanged:

- CSV backend is not implemented.
- Commune-level pricing is not implemented.
- Provider imports are not implemented.
- YSF sync remains disabled/informational.
- Manual-zone adoption is not implemented.
- Zone-name apply/update remains unsupported.

## What should not be implemented yet

- Do not delete backend settings keys.
- Do not change settings REST shape.
- Do not change `SettingsSanitizer`, `SettingsRepository`, `SafeApplyEngine`, Generator, or Shipping Editor behavior in this audit task.
- Do not add a new WooCommerce write path.
- Do not sync Generator or Shipping Editor changes back to Settings automatically.

## Security notes

- No PHP, REST route, nonce, capability, request sanitization, file write, or output escaping code changed.
- The recommendation keeps destructive removal behind Advanced tools and existing typed confirmation.

## WooCommerce safety notes

- No WooCommerce write/delete behavior changed.
- Recommendation keeps manual-zone protection as an always-on rule.
- Recommendation keeps live price/status changes in Shipping Editor through preview/apply.
- Recommendation avoids making Settings a direct WooCommerce zone/method mutation surface.

## WordPress.org compliance notes

- No telemetry, analytics, licensing, Pro lock, remote call, external asset, external font, obfuscated code, provider dispatch, or misleading paid UI was added.
- Audit recommends reducing misleading controls rather than adding teaser/paid surfaces.
- Documentation claims were checked against current source files.

## Checks run

- `git diff --check`
- `git status --short --untracked-files=all`

No build was required because no product code or assets changed.

## Check results

- `git diff --check`: passed; Git printed line-ending normalization warnings for pre-existing unrelated dirty files.
- `git status --short --untracked-files=all`: passed for scope review; only this task's two new files are intended for staging, and unrelated dirty files remain unstaged.

## Known risks

- Existing unrelated dirty files remain in the worktree.
- Existing saved `datasetMode: legacy_58` behavior needs an implementation decision before hiding the field.
- Hiding setup-default fields while keeping backend keys can leave stale hidden values active if implementation does not explicitly handle them.
- Browser/runtime smoke was not needed for this documentation-only audit.

## Blockers

None for the audit.

## Next recommended task

Implement the Settings simplification as a frontend-only UX cleanup first:

1. Hide Generator-only setup controls from Settings.
2. Replace safety toggles with a read-only safety card.
3. Keep Advanced tools removal unchanged.
4. Preserve the full settings REST contract.
5. Decide how to handle existing saved `legacy_58` before changing dataset runtime behavior.

## Commit hash, if committed

Final commit hash is recorded in the task closeout response.
