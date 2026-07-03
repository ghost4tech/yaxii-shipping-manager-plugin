# Manual Zone Support and Adoption Audit

Date: 2026-07-03

Status: Audit only. No product code, runtime asset, WooCommerce data, Yaxii COD Theme file, or remote server file was changed.

## Goal

Audit whether and how Yaxii Shipping Manager should support manually created WooCommerce shipping zones, and define the safest MVP and future adoption policy for WordPress.org release.

## Scope

This audit reviewed the current read-only diagnostics, Shipping Editor, Generator prevention, preview planner, apply engine, managed registry, reset/removal plan, and Yaxii COD Theme compatibility docs.

This audit does not implement manual-zone editing, adoption, conversion, deletion, merge, registry writes, SafeApplyEngine changes, Generator behavior changes, or Yaxii COD Theme changes.

## Sources Read

- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014C-yaxii-cod-readonly-compat-diagnostics.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014D-prevent-duplicate-generation-external-zone-statuses.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/APPLY-ENGINE.md`
- `docs/APPLY-CONTRACT.md`
- `docs/PREVIEW-PLANNER.md`
- `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`
- `src/WooCommerce/ShippingDiagnosticsService.php`
- `src/WooCommerce/ShippingZoneReader.php`
- `src/WooCommerce/YaxiiCodCompatibilityDetector.php`
- `src/Apply/ManagedZoneRegistry.php`
- `src/Apply/SafeApplyEngine.php`
- `src/Preview/PreviewPlanner.php`
- `src/Apply/ApplyReadinessEvaluator.php`
- `admin-app/src/components/shipping-zones/`
- `admin-app/src/components/diagnostics/`
- `admin-app/src/components/generator/`
- `admin-app/src/lib/generator/diagnostics-guidance.ts`
- `admin-app/src/lib/shipping-zones/status.ts`
- `admin-app/src/types/shipping-zones.ts`

## Current Manual-Zone Behavior

Manual WooCommerce zones are currently detected as zones that overlap an Algeria wilaya but are not recorded in `yaxii_shipping_manager_managed_zones` and do not look like Yaxii-owned zones. In `ShippingDiagnosticsService`, ownership priority is managed registry first, then Yaxii name hint, then `manual_unknown`. Direct state matches use `DZ:NN`; country-level `DZ` or direct state `DZ:NN` can count as overlapping coverage.

`ShippingZoneReader` is read-only. It normalizes WooCommerce zones, locations, shipping methods, enabled state, and flat-rate cost. It does not create, update, delete, or save zones.

In Shipping Editor, manual rows are shown as `Manual WooCommerce zone`. Their details are read-only and can show WooCommerce zone name, matched wilaya code, method names, method prices, and enabled/disabled status when WooCommerce returns that data. Manual rows route to `Review Diagnostics` and `Open WooCommerce zones`.

Manual rows do not expose editable price inputs, managed-method status switches, row active switches, bulk price/status tools, `Repair setup`, `Generate`, `Adopt`, `Convert`, `Delete`, or `Merge`.

Diagnostics advanced details list WooCommerce zones and show ownership hints. Manual or unknown zones are labeled as protected diagnostic signals, not editable resources.

Generator Start treats manual zones as protected. A clean store with manual zones can still start a new Yaxii setup, but manual zones are warned about and sent to Diagnostics for review. Coverage and Preview can skip or block selected wilayas where protected zones overlap.

`PreviewPlanner` places a selected manual or unknown overlapping zone into `skipManualZones` with type `skip_manual_zone`. It does not create a zone for that wilaya, does not propose price changes for that manual zone, and does not register it as Yaxii-owned.

`ApplyReadinessEvaluator` reports protected skips as `manual_zones_detected` with attention severity. Conflicts block apply.

`SafeApplyEngine` can create missing Yaxii-managed zones, add methods to Yaxii-managed zones, and update labels, costs, or enabled state only for registry-owned flat-rate method instances. Its validation requires `ownershipSource: managed_registry`, a matching managed registry zone record, the expected `DZ:NN` location, and a recorded method instance for updates. Manual zones cannot pass those checks.

The removal tool plan and current cleanup behavior protect manual zones. Manual zones are counted and reported only under protected/manual groups and are never candidates for managed setup removal unless a zone is also proven by the Yaxii managed registry.

Current conclusion:

- Manual zones are read-only.
- Manual zones are excluded from repair.
- Manual zones are excluded from price and status updates.
- Manual zones are excluded from removal.
- Manual zones are excluded from YSM registry ownership.
- Manual zones are skipped or blocked by preview/apply instead of adopted.

## Product Models Evaluated

### Model 1: Read-only forever for MVP

Manual zones stay protected. Yaxii Shipping Manager only shows them and links to WooCommerce zones.

Pros:

- Safest model for WordPress.org release.
- Avoids accidental merchant configuration edits.
- Keeps ownership clean and explainable.
- Lowest support and liability risk.

Cons:

- Existing manual setups cannot be fully managed from Yaxii Shipping Manager.
- Merchants must keep managing those zones in WooCommerce or generate separate clean Yaxii-managed coverage for missing wilayas.

Verdict: Recommended MVP model.

### Model 2: Read-only now, adoption later

MVP keeps read-only behavior. A future version can add an explicit adoption wizard after separate design and runtime proof.

Pros:

- Safe now.
- Keeps roadmap open.
- Allows adoption to be designed with preview, verification, typed confirmation, rollback/reporting, and stale-preview protection.

Cons:

- Future migration UX and support docs will be needed.

Verdict: Recommended future direction, but only after MVP release safety is stable.

### Model 3: Manage manual zones without adoption

YSM edits manual zone methods without creating registry ownership.

Pros:

- Convenient for merchants who already have manual zones.

Cons:

- Unsafe ownership model.
- Hard to know which methods YSM is allowed to edit.
- High risk for stores using custom method labels, plugin shipping methods, free shipping, local pickup, conditional shipping, or checkout/theme assumptions.
- Weak audit trail because the registry would not prove ownership.

Verdict: Not recommended.

### Model 4: Adopt manual zones into Yaxii registry

YSM converts selected manual zones into Yaxii-managed zones after preview and confirmation.

Pros:

- Lets merchants keep existing zones.
- Useful for agencies migrating existing Algerian WooCommerce setups.

Cons:

- Risky.
- Requires strict verification of locations, method types, labels, costs, duplicates, checkout compatibility, and rollback/reporting.
- Not suitable for rushed free MVP.

Verdict: Possible future model only as a separate adoption feature.

### Model 5: Duplicate-safe recreate only

YSM refuses to adopt manual zones. The merchant resolves or removes manual zones in WooCommerce, then generates a clean Yaxii-managed setup.

Pros:

- Simple and safe.
- Keeps YSM ownership precise.

Cons:

- Less convenient for existing stores.
- Requires merchants to do manual cleanup in WooCommerce.

Verdict: Acceptable fallback path for MVP. Do not automate cleanup.

## Recommended MVP Model

Use Model 1 for the initial WordPress.org MVP:

Manual WooCommerce zones remain protected and read-only. Yaxii Shipping Manager may show them, count them, explain why they block or skip certain wilayas, and link to WooCommerce zones. It must not edit, adopt, convert, merge, rename, delete, repair, or register them.

This keeps the free MVP aligned with the current safety policy: YSM writes only to zones and method instances it created and recorded in `yaxii_shipping_manager_managed_zones`.

## Recommended Future Model

Use Model 2 as the roadmap direction:

Keep read-only protection now. Later, build a separate adoption wizard that can adopt eligible manual zones only after a dry-run endpoint proves they are safe candidates and the merchant gives typed confirmation.

Model 4 can be the later implementation shape, but only after strict adoption checks, runtime smoke, rollback/reporting, and compatibility work are designed.

## Adoption Risks and Required Safety Checks

Future adoption must be blocked unless all required checks pass:

- WooCommerce is active and shipping zone APIs are available.
- The current user has `manage_woocommerce`.
- The adoption route requires a REST nonce and capability check.
- The zone is an Algeria state-specific zone, not a broad country-level zone unless a separate country-zone policy is designed.
- The normalized wilaya code matches exactly one current or selected dataset row.
- The zone location is compatible with the selected dataset mode.
- No Yaxii-managed registry zone already exists for the same normalized wilaya.
- No Yaxii COD Theme or external Yaxii zone already covers the same normalized wilaya unless a separate bridge flow handles it.
- The zone is not already in `yaxii_shipping_manager_managed_zones`.
- The zone is not recorded in `yaxii_zone_map`.
- The zone has only supported methods for adoption, likely `flat_rate` only for the first adoption version.
- Method instance IDs, method IDs, labels, enabled state, and costs are readable.
- Flat-rate costs are valid WooCommerce decimal strings and not formulas or unsupported plugin expressions.
- Unsupported methods block adoption or remain explicitly untouched; they must never be silently rewritten.
- Free shipping methods, local pickup, conditional shipping methods, table-rate plugins, provider methods, and custom plugin methods require separate policy.
- Multiple flat-rate methods require explicit mapping to Home, Office, Custom 1, or Custom 2; never guess.
- Method labels must be shown to the merchant before adoption.
- Zone name policy must be explicit: keep existing name by default or rename only in a later separate feature.
- Registry records are created only after all verification passes.
- Registry method records are created only for method instances explicitly adopted.
- No hidden delete, merge, or method replacement.
- Preview hash and accepted summary are required.
- Stale-preview protection is required.
- WooCommerce is re-read immediately before adoption.
- A typed confirmation is required, for example `ADOPT MANUAL ZONE`.
- Every adopted, skipped, blocked, and unsupported item is reported.
- Rollback strategy is documented before implementation. At minimum, the report must list created registry records and the exact prior state so a support user can reverse the registry change.
- Adoption logs must not contain secrets or customer data.

## Manual Method Management Audit

YSM should not edit manual-zone methods in MVP.

Editing a manual zone's flat-rate price can look simple, but it is unsafe without adoption because there is no registry proof that YSM owns the method. A manual zone may contain multiple flat rates, custom labels, a mix of flat rate and non-flat-rate methods, free shipping, local pickup, provider/plugin methods, or conditional shipping rules. A theme or checkout customization may depend on exact method labels or instance IDs.

Strict recommendation:

- Manual-zone method editing must stay blocked until the zone and specific method instances are adopted into the YSM registry through an explicit adoption flow.
- If a manual zone has multiple flat rates, adoption must require explicit mapping for each adopted method.
- If method labels are custom, preserve and display them. Do not rename them during adoption unless a separate rename step is added.
- If a method is not `flat_rate`, do not edit it in the first adoption version.
- If a theme or checkout depends on special method names, adoption must warn that checkout behavior can change only if labels or enabled state are modified later.
- If uncertainty remains, block adoption and send the merchant to WooCommerce zones.

## Yaxii COD Theme Zone Recommendation

Yaxii COD Theme zones are not normal manual zones.

They should be treated as theme-owned or external Yaxii zones, not as ordinary manual zones, because they can be linked to `yaxii_zone_map`, use `DZ:DZ-NN` location formats, and may power Yaxii COD Theme checkout through theme-specific endpoints and state keys.

MVP policy:

- Treat Yaxii COD Theme zones as external/theme-owned read-only zones.
- Keep them visible in Diagnostics and Shipping Editor through `Created by Yaxii COD Theme`, `External Yaxii zone`, or `Duplicate zone`.
- Do not adopt them in the MVP.
- Do not convert them in the MVP.
- Do not write to `yaxii_zone_map`.
- Do not claim YSM-generated zones power Yaxii COD Theme checkout.

Future policy:

- A bridge-only model may be considered after a separate Yaxii COD Theme bridge audit.
- Any bridge must be preview-based and must not casually write to `yaxii_zone_map`.
- Conversion from Yaxii COD Theme zones to YSM registry is a separate migration project, not part of manual-zone adoption MVP.

## Proposed MVP UX

### Shipping Editor

Status label:

- Use `Manual WooCommerce zone` for ordinary manual zones.
- Use `Created by Yaxii COD Theme`, `External Yaxii zone`, or `Duplicate zone` for theme/external coverage.
- Use aggregate labels such as `Protected zones` or `Protected` when the count or filter includes manual, theme, external, or duplicate protected rows.

Row details:

- Show WooCommerce zone name.
- Show matched wilaya code.
- Show methods, prices, and enabled/disabled status when readable.
- Show ownership as manual or unknown.
- Show technical IDs only in details or advanced support views.

Visible actions:

- `Review Diagnostics`
- `Open WooCommerce zones`

Hidden actions:

- Price inputs.
- Enable/disable controls.
- Bulk price/status tools.
- `Repair setup`.
- `Adopt`.
- `Convert`.
- `Merge`.
- `Delete`.

### Generator

When manual zones exist:

- Keep the setup path available for safe missing wilayas.
- Warn that manual WooCommerce zones are protected.
- Link to Diagnostics and WooCommerce zones.

When all selected wilayas are manual-covered:

- Do not preselect them for create or repair.
- Preview should return protected skips or conflicts, not creates.
- Generate/apply should not expose a normal success path for those protected rows.

When some wilayas are manual-covered and some are missing:

- Preselect only safe missing non-overlapping wilayas.
- Keep manual-covered wilayas locked out of create/repair.
- Explain that manual-covered wilayas remain managed in WooCommerce.

Manual-covered wilayas:

- Lock them out of normal create/repair selection.
- Allow preview-only support review if useful.

### Diagnostics

Cards:

- Keep existing Yaxii COD compatibility cards.
- Add or retain clear manual-zone wording when manual zones are present: `Manual zones protected`.
- Keep detailed zone lists collapsed under advanced details.

Advanced details:

- Show ownership hint.
- Show matched and overlapping wilaya counts.
- Show method counts and readable method labels/prices.
- Say ownership hints are diagnostic signals only.

Recommended action:

- For manual-only stores, recommend reviewing WooCommerce zones or generating only missing non-overlapping YSM setup.
- Do not recommend adoption in MVP.

### Removal Tool

Policy:

- Manual zones remain protected.
- Show protected-zone count.
- Never include manual zones in removal candidates.
- Never remove a zone with unmanaged methods.
- Keep typed confirmation only for managed setup removal.

## Future Adoption Task Sequence

If adoption is approved later, implement it as separate waves:

1. `TASK-ADOPT-001`: Adoption audit proof and runtime smoke design.
2. `TASK-ADOPT-002`: Read-only adoption dry-run endpoint.
3. `TASK-ADOPT-003`: Adoption UI preview.
4. `TASK-ADOPT-004`: Adoption execution with typed confirmation.
5. `TASK-ADOPT-005`: Restore, rollback, and reporting.
6. `TASK-ADOPT-006`: Yaxii COD Theme bridge compatibility after a separate bridge audit.

The adoption dry-run should return:

- Candidate zones.
- Blocked zones.
- Normalized wilaya code per zone.
- Dataset match result.
- Existing YSM registry duplicate result.
- Existing Yaxii COD/theme/external duplicate result.
- Methods found.
- Method IDs.
- Instance IDs.
- Labels.
- Costs.
- Enabled state.
- Supported method mappings.
- Unsupported methods.
- Free shipping and local pickup findings.
- Plugin/provider method findings.
- Duplicate method findings.
- Estimated registry zone records.
- Estimated registry method records.
- Confirmation text required.
- Preview hash.
- Generated timestamp.
- Blocking reasons.
- Warnings.

## WordPress.org Release Recommendation

For the initial WordPress.org release:

- Manual zones should remain read-only.
- Adoption should be hidden.
- Copy may say manual zones are protected now, but should not promise a delivery date for adoption.
- Aggregate copy should say protected zones when it includes manual, Yaxii COD Theme, external Yaxii, or duplicate protected rows.
- Screenshots can include manual zones only if they clearly show protected/read-only behavior.
- Readme can mention that manual WooCommerce zones are protected and not edited by Yaxii Shipping Manager.
- Plugin Check/readme release notes should not claim manual-zone management, adoption, conversion, or automatic migration.
- No Pro locks, licensing, telemetry, remote calls, external assets, or hidden provider integrations should be added around manual-zone support.

## What Should Not Be Implemented Yet

- Manual-zone adoption.
- Manual-zone edit controls.
- Manual flat-rate price edits without adoption.
- Manual method enable/disable controls.
- Manual zone rename.
- Manual zone delete.
- Manual zone merge.
- Manual zone conversion.
- `yaxii_zone_map` writes.
- Yaxii COD Theme conversion.
- Yaxii COD Theme bridge.
- Provider imports.
- YSF sync.
- CSV backend.
- Commune-level pricing.
- Any WooCommerce write path outside current preview/apply managed-registry rules.

## Risks

- Current diagnostics classify ordinary manual zones through ownership hints and overlap, not through a formal manual-zone registry. That is correct for read-only protection, but insufficient for adoption.
- Country-level Algeria manual zones can overlap every wilaya. Any future adoption must treat broad zones as a separate high-risk case.
- Existing copy and counts sometimes use `manual` where the protected set now includes manual, theme, and external zones. This is acceptable for current behavior but should be tightened before screenshots/readme are finalized.
- Yaxii COD Theme zones are mixed with broader external compatibility findings and must not be treated as simple manual zones.

## Final Recommendation

Ship the WordPress.org MVP with manual WooCommerce zones protected and read-only. Do not add adoption, conversion, or manual method management before release.

Future manual-zone adoption can be useful, but only as a separate preview-first migration feature with strict candidate checks, typed confirmation, stale-preview protection, immediate WooCommerce re-read, and reporting. Yaxii COD Theme zones need a separate bridge audit before any conversion or map-writing is considered.

## Next Recommended Task

TASK-014F: tighten protected-zone release copy and documentation wording, especially replacing ambiguous `Manual zones` counts with `Protected zones` where the UI includes manual, theme, and external protected rows.

## TASK-014F Implementation Note

TASK-014F should keep row-level labels precise while changing aggregate release copy to `Protected zones`, `Protected`, or `Protected zones are read-only` when the group may include manual, Yaxii COD Theme, external Yaxii, or duplicate protected rows.
