# TASK-014A: Release Compatibility Audit with Yaxii COD Theme

Date: 2026-07-02

## Goal

Audit release compatibility issues discovered after installing Yaxii Shipping Manager on a site that already had Yaxii COD Theme shipping data. This was audit-only work. No product code, theme code, remote files, database state, or WooCommerce zones were changed.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Branch: `task/014a-release-compatibility-audit-yaxii-cod`
- TASK-013A commit `b1e7f4c` exists locally.
- TASK-013B report exists at `.agents/progress/yaxii-shipping-manager/TASK-013B-create-release-folder.md`.
- Release folder exists at `release/`.
- Pre-existing unrelated dirty files were present before this task and were not staged or modified by this audit.

## Scope

Included:

- Yaxii Shipping Manager release compatibility audit.
- Yaxii COD Theme source inspection.
- Settings notice root-cause audit.
- Toggle switch CSS/component audit.
- WooCommerce shipping-zone detection audit.
- Yaxii COD checkout compatibility audit.
- Admin menu slug/name audit.
- Documentation and progress report only.

Excluded:

- Product code changes.
- Yaxii COD Theme code changes.
- Remote SSH inspection or changes.
- WooCommerce zone cleanup.
- Generator, SafeApplyEngine, Settings, or Shipping Editor implementation changes.
- Migration/adoption/conversion code.

## Files inspected

Yaxii Shipping Manager:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/RELEASE-PACKAGING.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/SETTINGS-CONTRACT.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/SETTINGS-UX-LOGIC-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-013A-plugin-check-release-hygiene.md`
- `.agents/progress/yaxii-shipping-manager/TASK-013B-create-release-folder.md`
- `yaxii-shipping-manager.php`
- `src/Admin/AdminPage.php`
- `src/Admin/AssetRegistrar.php`
- `src/Rest/Routes.php`
- `src/Rest/BootstrapController.php`
- `src/Settings/SettingsRepository.php`
- `src/Settings/SettingsSanitizer.php`
- `src/WooCommerce/AlgeriaStatesRegistrar.php`
- `src/WooCommerce/ShippingDiagnosticsService.php`
- `src/WooCommerce/ShippingZoneReader.php`
- `src/Data/DatasetRepository.php`
- `src/Preview/PreviewPlanner.php`
- `src/Apply/SafeApplyEngine.php`
- `src/Apply/ManagedZoneRegistry.php`
- `admin-app/src/routes/index.tsx`
- `admin-app/src/components/ui/switch.tsx`
- `admin-app/src/lib/shipping-zones/status.ts`
- `admin-app/src/features/diagnostics/DiagnosticsAdvancedDetails.tsx`
- `data/algeria/current/wilayas.json`
- `data/algeria/legacy-58/wilayas.json`

Yaxii COD Theme:

- `inc/Data/Countries/States/DZ.php`
- `inc/Data/Countries/Cities/DZ.php`
- `inc/Data/Providers/DZProvider.php`
- `inc/Data/Manager.php`
- `inc/WooCommerce/LocalizationManager.php`
- `inc/WooCommerce/ShippingZoneGenerator.php`
- `inc/WooCommerce/ShippingSettingsPage.php`
- `inc/Api/ShippingController.php`
- `inc/Api/LocationController.php`
- `inc/Ajax/OrderHandler.php`
- `inc/Core.php`
- `assets/js/checkout.js`
- `template-parts/components/fast-checkout.php`
- `woocommerce/checkout/form-checkout.php`
- `docs/en/checkout-and-conversion/managing-wilayas-and-zones.md`

## Files changed

- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014A-release-compatibility-audit-yaxii-cod.md`

## Files created

- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014A-release-compatibility-audit-yaxii-cod.md`

## What was before

The release package had passed Plugin Check, but real install testing exposed:

- a persistent global "Settings normalized" warning;
- toggle switch thumb overflow;
- duplicate Yaxii COD Theme plus Yaxii Shipping Manager zone setup;
- checkout incompatibility with Yaxii COD Theme;
- poor visibility for foreign/extra zones;
- unclear diagnostics for mixed 58/69 setups;
- possible admin naming confusion.

## What changed

Only audit documentation was added. No runtime behavior changed.

## Settings notice finding

The warning is caused by normal first-run defaults being handled as invalid stored data. `SettingsRepository::read()` passes a missing option value to `SettingsSanitizer::sanitize_stored()`, which returns defaults plus the warning `Stored settings were invalid and defaults were used.` The React app renders any settings warning globally as `Settings normalized`.

Recommendation:

- Treat a missing settings option as a quiet first-run default.
- Keep warnings for truly malformed stored settings.
- Move repair warnings into Settings and make them non-blocking/dismissible.

## Toggle switch finding

The switch component uses a tight transform:

- track: `h-6 w-11 p-0.5`
- thumb: `h-5 w-5`
- checked translation: `translate-x-5`

The calculation leaves no tolerance for wp-admin CSS, transform rounding, or RTL direction. The fix should be component-level and minimal: constrain the translate distance or make the switch explicitly LTR/logical while preserving `overflow-hidden`.

## Existing setup detection finding

Yaxii Shipping Manager detects state locations shaped like `DZ:01`. Yaxii COD Theme creates state locations shaped like `DZ:DZ-01` and stores ownership in `yaxii_zone_map`. Yaxii Shipping Manager does not currently inspect or normalize that map or code format.

Result: theme zones can be invisible to YSM diagnostics and preview planning.

## Duplicate 69 + 58 finding

The source supports the observed duplicate pattern:

- Yaxii Shipping Manager current dataset count: 69.
- Yaxii Shipping Manager legacy dataset count: 58.
- Yaxii Shipping Manager zone format: `DZ:NN`.
- Yaxii COD Theme dataset count: 58.
- Yaxii COD Theme state IDs: `DZ-NN`.
- Yaxii COD Theme zone location format: `DZ:DZ-NN`.

Because these formats are not normalized together, a site can end up with 58 theme zones plus 69 plugin zones.

## Yaxii COD checkout compatibility finding

Yaxii COD Theme checkout gets states, cities, rates, and shipping validation from theme code and the `yaxii_zone_map` option. It expects `billing_state` values like `DZ-01`. Yaxii Shipping Manager generated zones use `DZ:01` locations and do not populate `yaxii_zone_map`.

Result: Yaxii COD checkout cannot be expected to recognize YSM-generated zones without a compatibility bridge.

## Shipping Editor visibility finding

The Shipping Editor builds rows from the active dataset and overlays direct diagnostics matches. It does not render unmatched foreign WooCommerce zones as first-class rows. Theme zones with `DZ:DZ-NN` can be missing from the main table or shown only in advanced diagnostics with generic ownership labels.

Recommended future statuses:

- `Created by Yaxii COD Theme`
- `External Yaxii zone`
- `Manual WooCommerce zone`
- `Duplicate zone`
- `Legacy 58 zone`
- `Format mismatch`

## Diagnostics gaps

Diagnostics should add read-only coverage for:

- Yaxii COD Theme setup detection;
- `DZ:DZ-NN` code format;
- duplicate normalized wilaya zones;
- legacy/current mismatch;
- external Yaxii zones;
- orphan YSM registry records;
- orphan `yaxii_zone_map` entries;
- theme checkout compatibility risk.

Recommended cards:

- `Existing Yaxii COD setup detected`
- `Duplicate shipping zones found`
- `Legacy/current wilaya mismatch`
- `Checkout theme compatibility warning`
- `Manual zones protected`
- `State code format mismatch`

## Admin menu naming finding

Current identifiers:

- Plugin slug/page slug: `yaxii-shipping-manager`
- REST namespace: `yaxii-shipping-manager/v1`
- Option names: `yaxii_shipping_manager_settings`, `yaxii_shipping_manager_managed_zones`
- Menu label: `Yaxii Shipping`
- Page title: `Yaxii Shipping Manager`

The slug and internal identifiers are acceptable and should not be changed without a proven conflict. The visible submenu label is the most likely confusion point and can be clarified independently.

## Recommended implementation waves

1. Release UX fixes:
   - suppress first-run global settings warning;
   - scope true settings repair warnings to Settings;
   - fix switch thumb overflow.
2. Read-only compatibility detector:
   - normalize `DZ:NN`, `DZ:DZ-NN`, `DZ-NN`, and `yaxii_zone_map`;
   - classify Yaxii COD Theme zones;
   - detect duplicate normalized wilayas and 58/69 mismatch.
3. Shipping Editor and Generator prevention:
   - show external/theme/manual/duplicate statuses;
   - block duplicate creation where external coverage already exists.
4. Checkout compatibility messaging:
   - warn when Yaxii COD Theme checkout assumptions are active;
   - do not claim compatibility until a bridge is verified.
5. Future conversion/adoption tool:
   - preview-only;
   - explicit confirmation;
   - no silent writes or deletes.

## High-risk changes to avoid

- Changing `SafeApplyEngine` to update theme/manual zones.
- Writing to `yaxii_zone_map`.
- Deleting or merging WooCommerce zones.
- Automatically adopting Yaxii COD Theme zones.
- Changing canonical state codes without migration design.
- Renaming REST namespace, option names, or plugin slug to solve a UI confusion.
- Claiming Yaxii COD checkout compatibility before runtime verification.

## What still remains mocked

No mock behavior changed in this task. Existing mocked or future-scoped areas remain as before, including YSF Sync, provider dispatch, full conversion/adoption tools, and any non-implemented Pro concepts.

## What should not be implemented yet

- Theme zone conversion.
- Manual-zone adoption.
- `yaxii_zone_map` synchronization.
- Zone deletion or merge tooling.
- Yaxii COD Theme code changes.
- Provider dispatch.
- YSF sync.
- Licensing or Pro locks.

## Security notes

- No SSH commands were run.
- No remote files were inspected or modified.
- No WooCommerce zones were changed.
- No options were written.
- No credentials or secrets were handled.

## WooCommerce safety notes

Shipping zones are store configuration and remain untouched. The recommended compatibility path is read-only detection first, then prevention of duplicate writes, then optional future conversion only through a preview and explicit confirmation.

## WordPress.org compliance notes

The recommended fixes preserve WordPress.org expectations:

- local-first behavior;
- no telemetry;
- no external assets;
- no hidden remote calls;
- no misleading checkout compatibility claim;
- no destructive cleanup;
- clear documentation of actual behavior.

## Checks run

- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- `git diff --check`: Passed. Git printed line-ending normalization warnings for pre-existing dirty files, but no whitespace errors were reported.
- `git status --short --untracked-files=all`: Passed for visibility. It showed the two new audit files plus pre-existing unrelated dirty files.
- `git diff --cached --check`: Passed for the staged audit/report files.

## Known risks

- The audit used local source inspection only. No remote/test database read-only queries were run.
- Runtime order between YSM and Yaxii COD `woocommerce_states` filters should be verified in a real active theme/plugin stack during implementation.
- The exact visual switch overflow should be reproduced in wp-admin before final CSS values are chosen.

## Blockers

None for the audit. Implementation is intentionally deferred.

## Next recommended task

TASK-014B: fix release UX blockers only:

- quiet first-run settings defaults;
- scope/dismiss true settings repair notices;
- fix switch thumb overflow;
- run focused frontend and PHP checks.

Then TASK-014C should implement read-only Yaxii COD compatibility diagnostics without changing WooCommerce write paths.

## Commit hash, if committed

This report is included in the commit reported in the final task closeout.
