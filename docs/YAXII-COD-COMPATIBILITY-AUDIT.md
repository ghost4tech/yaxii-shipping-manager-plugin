# Yaxii COD Compatibility Audit

Date: 2026-07-02

Status: Audit only. No product code, theme code, database state, or remote server files were changed.

## Goal

Audit release-readiness issues found after installing the Yaxii Shipping Manager release package on a site that already had Yaxii COD Theme shipping data. This document explains the current incompatibilities, the likely root causes, and the safest pre-release design for detection and prevention.

## Scope

Inspected sources:

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
- Yaxii COD Theme files under `C:\Users\Aymen\Local Sites\yaxii-theme\app\public\wp-content\themes\yaxii-cod`

No SSH inspection was used. The audit is based on local source only.

## Executive Findings

1. The persistent "Settings normalized" banner is caused by normal first-run defaults being treated as an invalid stored settings repair. A missing `yaxii_shipping_manager_settings` option returns warnings, and the React app renders those warnings globally.
2. The switch component uses a mathematically tight thumb translation. In wp-admin or RTL contexts it can visibly overshoot. The fix should be a small bounded component/CSS change.
3. Yaxii Shipping Manager cannot currently detect Yaxii COD Theme zones. It only recognizes state locations shaped like `DZ:01`, while the theme creates locations shaped like `DZ:DZ-01`.
4. Yaxii Shipping Manager uses current 69 wilayas by default and legacy 58 as an internal mode. Yaxii COD Theme uses a 58-wilaya dataset with state IDs like `DZ-01`.
5. Yaxii COD checkout cannot use Yaxii Shipping Manager zones because it reads theme endpoints and the `yaxii_zone_map` option, validates `billing_state` as `DZ-XX`, and does not scan WooCommerce zones generated with `DZ:NN`.
6. The Shipping Editor table is dataset-row-first. Extra zones that do not match the current dataset location pattern are not shown as explicit rows with an ownership/status label.
7. Diagnostics can list WooCommerce zones in advanced details, but it does not classify Yaxii COD zones, legacy/current mismatches, duplicate normalized wilayas, or checkout theme compatibility risk.
8. The plugin slug `yaxii-shipping-manager` is acceptable for WordPress.org and should not be changed without a proven collision. The visible submenu label `Yaxii Shipping` is more ambiguous and can be clarified before release.

## A. Settings Normalized Notice

### Current behavior

`SettingsRepository::read()` calls `get_option( SettingsRepository::OPTION_NAME, null )` and passes the result to `SettingsSanitizer::sanitize_stored()`.

`SettingsSanitizer::sanitize_stored()` treats a non-array value as invalid stored data. On a clean install, the option is missing, so the value is `null`. That path returns default settings plus the warning:

`Stored settings were invalid and defaults were used.`

The admin app renders this as a global React alert in `RuntimeNotices` with the title:

`Settings normalized`

### Why it appears on a fresh release install

The plugin currently does not distinguish between:

- first-run missing option, which is expected and should be quiet;
- malformed stored option, which may be worth surfacing;
- stale stored option with repaired keys, which should be scoped to Settings.

Because a missing option is interpreted as invalid storage, a normal first-run install shows a warning before the merchant has done anything wrong.

### UX risk

This is bad release UX and may look like a broken install. The banner is global, recurring, and not dismissible from the inspected React path.

### Recommendation

For the next implementation task:

- Treat missing `yaxii_shipping_manager_settings` as first-run defaults with no warning.
- Keep warnings for actually malformed stored options.
- Move repair warnings into the Settings view as a small non-blocking message.
- Make any repair notice dismissible for the current admin session.
- Do not show a fixed global warning for expected default normalization.

## B. Toggle Switch Overflow

### Current behavior

`admin-app/src/components/ui/switch.tsx` defines:

- root: `h-6 w-11 ... p-0.5 overflow-hidden`
- thumb: `h-5 w-5 ... data-[state=checked]:translate-x-5`

On paper, this is exactly 20 px of travel inside a 44 px wide track with 2 px padding and a 20 px thumb. That leaves no tolerance for border, transform rounding, inherited wp-admin styles, RTL direction, or compiled CSS differences.

The same switch component is reused in the Shipping Editor and other controls, so the bug should be treated as component-level unless runtime proof narrows it.

### Recommendation

Make the switch movement tolerant instead of exact-edge:

- Set the switch root direction to LTR, or make the transform logical/RTL-aware.
- Reduce checked thumb travel slightly, for example to 18 px, or use fixed dimensions where travel is less than the theoretical maximum.
- Keep `overflow-hidden`.
- Test inside wp-admin in both LTR and RTL/admin-style contexts.

This is a minimal UI fix. It does not require changing Settings, Generator, Shipping Editor logic, or WooCommerce write paths.

## C. Existing WooCommerce Shipping Setup Detection

### Current Yaxii Shipping Manager detection

Yaxii Shipping Manager currently treats zones as relevant to a wilaya when zone locations match this pattern:

- country: `DZ`
- state: `DZ:NN`, for example `DZ:01`

The direct match and overlap logic in `ShippingDiagnosticsService` only extracts wilaya codes from `DZ:(\d{2})`. The preview planner then relies on those diagnostics. If no matching zone is found for a dataset row, the planner can propose creating a new zone.

Managed ownership is currently detected through:

- the `yaxii_shipping_manager_managed_zones` option;
- the configured zone ID in that registry;
- zone-name hints containing the configured prefix or `yaxii`;
- otherwise `manual_unknown`.

### Current Yaxii COD Theme setup

Yaxii COD Theme uses:

- states keyed as `DZ-01` through `DZ-58`;
- cities keyed under those state IDs;
- WooCommerce state registration with keys like `DZ-01`;
- WooCommerce zone locations created as `DZ:` plus the state ID, for example `DZ:DZ-01`;
- zone names like `01 - Adrar`;
- flat-rate methods titled `Home Delivery` and `Desk Delivery`;
- an ownership/map option named `yaxii_zone_map`, keyed by `DZ-XX` and storing WooCommerce zone IDs.

### Detection weakness

Yaxii Shipping Manager does not currently normalize or classify:

- state location `DZ:DZ-01`;
- raw state key `DZ-01`;
- Yaxii COD `yaxii_zone_map`;
- theme generated zone names like `01 - Adrar`;
- theme 58-wilaya setup as an external Yaxii setup.

Therefore Yaxii COD Theme zones can be invisible to Yaxii Shipping Manager's wilaya matching and preview planner.

### Compatibility direction

Before WordPress.org release, compatibility should be read-only and preventive:

1. Detect Yaxii COD Theme zones and label them.
2. Warn before any Generator/Apply flow creates overlapping zones.
3. Do not adopt, rewrite, delete, or convert theme zones automatically.
4. Do not write to `yaxii_zone_map` from Yaxii Shipping Manager.
5. Leave conversion/adoption as a later explicit preview-based tool.

## D. Duplicate 69 + 58 Issue

### What the source suggests

The likely duplicate setup is duplicate WooCommerce shipping zones, not duplicate Yaxii Shipping Manager registry records.

Yaxii COD Theme creates 58 zones using:

- state IDs: `DZ-01` through `DZ-58`;
- zone locations: `DZ:DZ-01` through `DZ:DZ-58`;
- map option: `yaxii_zone_map`.

Yaxii Shipping Manager defaults to the current dataset, verified locally as 69 wilayas. It creates/recognizes zones using:

- state IDs in dataset rows: `01` through `69`;
- zone locations: `DZ:01` through `DZ:69`;
- registry option: `yaxii_shipping_manager_managed_zones`.

Because the formats differ, a site can have:

- 58 Yaxii COD Theme zones;
- 69 Yaxii Shipping Manager zones;
- both sets representing many of the same wilayas through different code formats.

### Other possible duplication surfaces

The code also supports checkout/state dropdown conflicts:

- Yaxii Shipping Manager registers WooCommerce states as `01`, `02`, etc.
- Yaxii COD Theme registers WooCommerce states as `DZ-01`, `DZ-02`, etc.
- Both use the `woocommerce_states` filter at priority 10.
- Each implementation assigns `$states['DZ']` to its own formatted list.

Whichever filter runs later can replace the previous Algeria state list. That means the visible checkout dropdown may not match the zones created by the other system.

### Recommendation

Add a normalized compatibility detector that maps all of these to canonical wilaya numbers for read-only analysis:

- `DZ:01` -> `01`
- `DZ:DZ-01` -> `01`
- `DZ-01` -> `01`
- `yaxii_zone_map["DZ-01"]` -> `01`

Then diagnostics can detect:

- a current 69 setup;
- a legacy 58 setup;
- Yaxii COD Theme setup;
- duplicate normalized wilaya zones;
- mixed current/legacy zones;
- zones whose state code format is incompatible with the active checkout provider.

Generator and Apply should be blocked or forced into a review-only state when external Yaxii COD zones already cover the same wilayas.

## E. Yaxii COD Checkout Compatibility

### How the theme checkout gets wilayas and rates

Yaxii COD Theme checkout reads location and rate data from theme APIs and classes:

- `/yaxii-cod/v1/locations/states`
- `/yaxii-cod/v1/locations/cities?state_id=DZ-XX`
- `/yaxii-cod/v1/shipping/rates?state_id=DZ-XX`
- `ShippingZoneGenerator::get_zone_id( $state_id )`
- `ShippingController::validate_rate_for_state()`
- `OrderHandler` validation for `billing_state`

The theme expects `billing_state` to match a pattern like `DZ-01`.

### Why it does not recognize Yaxii Shipping Manager zones

Yaxii Shipping Manager generated zones do not populate `yaxii_zone_map`, and they use locations like `DZ:01`, not `DZ:DZ-01`. The theme shipping code does not scan WooCommerce zones by normalized location. It uses the theme map option and state IDs like `DZ-01`.

Therefore, even if Yaxii Shipping Manager creates correct WooCommerce zones for native WooCommerce matching, the Yaxii COD checkout can still return no compatible rate because its own source of truth was not updated.

### Recommendation

Short term, Yaxii Shipping Manager should detect active theme assumptions and warn clearly:

- "Yaxii COD Theme checkout appears to use its own 58-wilaya zone map."
- "Yaxii Shipping Manager zones will not power this checkout unless a compatibility bridge is added."

Do not add a hard dependency on the theme.

Long term, the cleanest fix is shared normalization:

- The theme should be able to read native WooCommerce zones by normalized Algeria state code.
- The plugin can expose read-only compatibility diagnostics.
- A future explicit bridge can map or import theme zones through preview, but it must not silently write `yaxii_zone_map` or mutate existing zones.

## F. Shipping Editor Visibility for Foreign/Extra Zones

### Current behavior

The Shipping Editor builds rows from the active dataset and then overlays diagnostics per wilaya. It does not render arbitrary extra WooCommerce zones as table rows.

A Yaxii COD Theme zone with location `DZ:DZ-01` does not match the current direct pattern `DZ:01`. As a result:

- the dataset row for `01` can show `Missing setup`;
- the theme zone can be absent from the main Shipping Editor table;
- the advanced diagnostics zone list may show the zone, but without a clear "Created by Yaxii COD Theme" classification.

### Recommended statuses

Add read-only statuses before any migration/adoption work:

- `Created by Yaxii COD Theme`
- `External Yaxii zone`
- `Manual WooCommerce zone`
- `Duplicate zone`
- `Legacy 58 zone`
- `Current 69 zone`
- `Format mismatch`

### Recommended rules

Suggested classification:

- `Yaxii-managed`: zone ID exists in `yaxii_shipping_manager_managed_zones` and has expected `DZ:NN` location.
- `Yaxii COD Theme`: zone ID appears in `yaxii_zone_map`, or zone location matches `DZ:DZ-NN`.
- `External Yaxii zone`: zone name or method metadata strongly hints Yaxii, but no YSM registry or theme map was found.
- `Manual WooCommerce zone`: zone overlaps Algeria locations but has no YSM registry, no theme map, and no Yaxii hint.
- `Duplicate zone`: more than one zone normalizes to the same wilaya code.
- `Legacy 58 zone`: normalized codes are only in `01` through `58` and no `59` through `69` are present.

## G. Diagnostics Coverage

### Current coverage

Diagnostics currently reports:

- WooCommerce availability;
- dataset status;
- shipping-zone totals;
- missing wilaya setup;
- duplicate direct matches;
- zones without methods;
- checkout fallback risk;
- Yaxii-managed registry counts.

### Gaps

Diagnostics does not yet report:

- Yaxii COD Theme zone map detection;
- `DZ:DZ-NN` state-location format;
- duplicate normalized wilaya zones across `DZ:NN` and `DZ:DZ-NN`;
- legacy 58 versus current 69 mismatch;
- external Yaxii/theme zones;
- orphan theme map records;
- orphan Yaxii Shipping Manager registry records by normalized code;
- checkout compatibility risk when Yaxii COD Theme checkout is active.

### Recommended diagnostics cards

Add read-only cards before expanding write behavior:

- `Existing Yaxii COD setup detected`
- `Duplicate shipping zones found`
- `Legacy/current wilaya mismatch`
- `Checkout theme compatibility warning`
- `Manual zones protected`
- `External Yaxii zones detected`
- `State code format mismatch`

## H. Admin Menu Slug and Naming

### Current identifiers

- Plugin name: `Yaxii Shipping Manager`
- Text domain: `yaxii-shipping-manager`
- Admin page slug: `yaxii-shipping-manager`
- WooCommerce submenu label: `Yaxii Shipping`
- Page title: `Yaxii Shipping Manager`
- REST namespace: `yaxii-shipping-manager/v1`
- Admin script/style handle: `yaxii-shipping-manager-admin`
- React mount: `yaxii-shipping-manager-admin-app`
- Settings option: `yaxii_shipping_manager_settings`
- Managed zones option: `yaxii_shipping_manager_managed_zones`

### Finding

The plugin slug is appropriate for WordPress.org and does not need to change unless there is a proven routing collision. Changing the slug, REST namespace, option names, or asset handles now would create migration and documentation churn without directly fixing the reported compatibility issue.

The visible menu label `Yaxii Shipping` is more likely to cause user confusion because it is shorter and close to other Yaxii shipping features. If a naming change is needed before release, start with user-facing menu/title copy rather than storage or API identifiers.

### Recommendation

- Keep the WordPress.org plugin slug `yaxii-shipping-manager`.
- Keep REST namespace and option names stable unless a real conflict is proven.
- Consider changing the visible WooCommerce submenu label to `Shipping Manager` or `Yaxii Shipping Manager`.
- Do not rename internal identifiers as part of the compatibility detection task.

## I. Compatibility Design Proposal

### 1. First-run on clean store

Shipping Editor:

- Show all current 69 wilayas as `Missing setup`.
- Do not show "Settings normalized" as a global warning.

Generator:

- Recommend previewing the current 69 setup.
- Create no zones until preview and explicit confirmation.

Diagnostics:

- Show WooCommerce/dataset readiness.
- Show that no managed zones exist yet.

Allowed actions:

- Preview.
- Apply only after confirmation.
- Save normal settings.

Blocked actions:

- None beyond existing safety rules.

Future tool:

- Not needed for clean first-run.

### 2. Store with existing Yaxii COD Theme zones

Shipping Editor:

- Show matching normalized wilayas as `Created by Yaxii COD Theme` or `External Yaxii zone`.
- Show missing 59 through 69 separately if the current dataset is active.
- Do not mark theme-covered wilayas as plain `Missing setup`.

Generator:

- Warn that an existing Yaxii COD 58-wilaya setup was found.
- Do not propose creating overlapping zones until the merchant chooses a safe path.

Diagnostics:

- Show `Existing Yaxii COD setup detected`.
- Show `State code format mismatch` if `DZ:DZ-NN` exists.
- Show checkout compatibility warning.

Allowed actions:

- Read-only inspection.
- Export/report.
- Preview-only compatibility plan.

Blocked actions:

- Silent creation of duplicate zones.
- Silent adoption of theme zones.
- Writing to `yaxii_zone_map`.
- Deleting theme zones.

Future tool:

- Optional conversion/adoption wizard with preview, backups, and explicit confirmation.

### 3. Store with manual WooCommerce zones

Shipping Editor:

- Show overlapping wilayas as `Manual WooCommerce zone`.
- Keep manual zones protected and read-only.

Generator:

- Skip manual zones by default.
- Recommend review before creating any adjacent managed setup.

Diagnostics:

- Show `Manual zones protected`.
- Show conflicts where more than one zone maps to the same wilaya.

Allowed actions:

- Create only missing non-overlapping managed zones after preview.

Blocked actions:

- Updating manual zone methods.
- Renaming or deleting manual zones.

Future tool:

- Optional manual adoption flow, not for first release.

### 4. Store with old 58-wilaya setup

Shipping Editor:

- Show 58 covered wilayas as legacy.
- Show delegated/current-only wilayas as missing or unsupported depending on selected mode.

Generator:

- Recommend choosing between current 69 mode and legacy 58 compatibility before preview.
- Do not mix modes without an explicit warning.

Diagnostics:

- Show `Legacy/current wilaya mismatch`.
- Explain that the store has 58-wilaya coverage while the plugin default dataset is 69.

Allowed actions:

- Read-only inspection.
- Legacy-mode preview if the merchant intentionally uses 58.

Blocked actions:

- Silent expansion from 58 to 69 on a store with theme checkout assumptions.

Future tool:

- Migration plan from 58 to 69 after dataset and checkout policy are confirmed.

### 5. Store with current 69-wilaya setup

Shipping Editor:

- Show Yaxii-managed 69 zones as active/partial/disabled according to registry and methods.
- Show any extra zones as duplicates or manual/external.

Generator:

- Recommend updates only for registry-managed missing or disabled methods.

Diagnostics:

- Show current 69 coverage.
- Show duplicate normalized wilaya zones if present.

Allowed actions:

- Idempotent updates for managed registry zones.

Blocked actions:

- Updating zones not in the YSM registry unless a future adoption flow exists.

Future tool:

- Registry repair for orphan records, if needed.

### 6. Store with duplicate state zones

Shipping Editor:

- Show affected wilayas as `Duplicate zone`.
- List each duplicate source: YSM registry, Yaxii COD Theme, external Yaxii, or manual.

Generator:

- Block apply for affected wilayas.
- Offer a read-only conflict report.

Diagnostics:

- Show `Duplicate shipping zones found`.
- Include normalized code, zone IDs, location formats, method labels, and ownership hints.

Allowed actions:

- Inspection and export.

Blocked actions:

- Creating another zone for the same normalized wilaya.
- Deleting or merging duplicates automatically.

Future tool:

- Conflict resolver with explicit merchant decisions.

### 7. Store with theme checkout active

Shipping Editor:

- Show compatibility banner if Yaxii COD Theme checkout is detected.
- Label whether zones are usable by native WooCommerce matching, theme checkout, or both.

Generator:

- Warn that YSM-generated zones may not power Yaxii COD checkout.
- Block or require explicit acknowledgement before creating zones that the active checkout will not read.

Diagnostics:

- Show `Checkout theme compatibility warning`.
- Explain whether the theme expects `DZ-XX`, `yaxii_zone_map`, or its own endpoints.

Allowed actions:

- Read-only diagnostics.
- Native WooCommerce preview if the merchant is not using theme checkout.

Blocked actions:

- Claiming compatibility with Yaxii COD checkout without a verified bridge.

Future tool:

- Optional compatibility bridge after both plugin and theme behavior are specified.

## Recommended Implementation Waves

### Wave 1: Release UX fixes

- Suppress first-run settings normalization warnings.
- Move real settings-repair warnings into Settings.
- Fix switch thumb overflow.

No WooCommerce write-path changes.

### Wave 2: Read-only compatibility detector

- Normalize Algeria zone references across `DZ:NN`, `DZ:DZ-NN`, `DZ-NN`, and `yaxii_zone_map`.
- Detect Yaxii COD Theme setup.
- Detect legacy 58/current 69 mismatch.
- Detect duplicate normalized wilaya zones.
- Add diagnostics warnings only.

No adoption, conversion, deletion, or SafeApplyEngine changes.

### Wave 3: Shipping Editor and Generator prevention

- Add explicit statuses for Yaxii COD, external Yaxii, legacy, manual, and duplicate zones.
- Prevent Generator/Apply from creating duplicates when a normalized wilaya is already covered by external/theme zones.
- Keep all foreign zones read-only.

### Wave 4: Checkout compatibility messaging

- Detect theme checkout assumptions when possible.
- Warn that YSM zones do not power Yaxii COD checkout unless a bridge exists.
- Avoid claiming full checkout compatibility.

### Wave 5: Future conversion/adoption tool

- Design a preview-only adoption/conversion flow.
- Require explicit confirmation.
- Preserve original zones and methods.
- Do not silently write `yaxii_zone_map`.
- Do not ship this before the free MVP detection and prevention are stable.

## High-Risk Changes to Avoid Now

- Changing `SafeApplyEngine` to update foreign/theme/manual zones.
- Writing to or deleting `yaxii_zone_map`.
- Deleting WooCommerce zones.
- Automatically adopting manual or theme zones.
- Changing canonical YSM state codes without a migration design.
- Changing REST namespace, option names, or plugin slug as a compatibility shortcut.
- Claiming Yaxii COD checkout support before a verified bridge exists.
- Running destructive cleanup on a test/demo server.

## What Should Not Be Implemented Yet

- Theme zone conversion.
- Manual-zone adoption.
- `yaxii_zone_map` synchronization.
- Zone deletion or merge tooling.
- Yaxii COD Theme code changes.
- Provider dispatch.
- YSF sync.
- Pro locks or licensing.

## Immediate Next Task

TASK-014B should implement only the low-risk release blockers:

1. Suppress the first-run "Settings normalized" global notice.
2. Keep true settings repair warnings scoped and dismissible.
3. Fix the switch thumb overflow.
4. Add unit or focused frontend checks where the repo supports them.

TASK-014C should then add read-only compatibility detection for Yaxii COD Theme zones and mixed 58/69 setups, without changing any WooCommerce write path.

## TASK-014B Implementation Note

TASK-014B implemented the Wave 1 release UX fixes only:

- Missing first-run `yaxii_shipping_manager_settings` now returns default settings with no warning.
- Malformed stored settings still flow through the sanitizer and can produce repair warnings.
- Settings repair warnings no longer render as a global `Settings normalized` notice; they render inside Settings as `Settings were repaired` and can be dismissed for the current admin session.
- The shared switch component uses an LTR internal direction and a bounded checked thumb translation so the knob stays inside the track.

TASK-014B did not implement Yaxii COD Theme detection, `DZ:DZ-01` normalization, duplicate 69/58 diagnostics, checkout compatibility warnings, generator blocking, adoption/conversion tooling, or any `yaxii_zone_map` read/write behavior.

## TASK-014C Implementation Note

TASK-014C implemented the first read-only compatibility diagnostics wave:

- Diagnostics now includes a `compatibility` object for Yaxii COD Theme and mixed Algeria shipping setup detection.
- The detector reads WooCommerce shipping zones, `yaxii_shipping_manager_managed_zones`, the Yaxii COD Theme `yaxii_zone_map` option, active theme metadata, and current/legacy dataset counts.
- It normalizes `DZ:NN`, `DZ:DZ-NN`, raw `DZ-NN`, and `yaxii_zone_map` keys to the same two-digit wilaya code for diagnostics only.
- Diagnostics can report theme setup detection, `yaxii_zone_map` counts, Yaxii COD/theme-format zone counts, YSM managed zone counts, duplicate normalized wilayas, legacy-only coverage, state-format mismatch, and checkout compatibility risk.
- The Diagnostics page shows read-only cards for existing Yaxii COD setup, duplicate shipping zones, state code format mismatch, and checkout compatibility warning only when those findings exist.
- Advanced details include active theme info, map/managed counts, duplicate normalized wilayas with zone IDs and location formats, source classification, checkout risk, and recommendations.
- Shipping Editor shows a non-blocking info hint when a Yaxii COD setup is detected.

TASK-014C did not adopt, repair, convert, delete, merge, or write WooCommerce zones. It did not write to `yaxii_zone_map`, change `SafeApplyEngine`, block Generator, edit Yaxii COD Theme source, or claim checkout compatibility is fixed.
