# Runtime Smoke Checklist

Use this checklist before adding new WooCommerce write paths. The goal is to prove the current merchant flow still works in a real WordPress admin screen and that WooCommerce writes remain limited to supported Yaxii-managed work.

## Browser Admin Smoke

1. Open `wp-admin/admin.php?page=yaxii-shipping-manager` as an administrator.
2. Confirm the plugin admin page loads without console errors.
3. Confirm the main navigation shows only `Shipping Editor`, `Generator`, `Diagnostics`, and `Settings`.
4. Confirm `Import / Export` and `Smart Form Sync` are not visible in the top navigation.
5. Confirm Shipping Editor shows the reference-based management page with live WooCommerce status and pending-change controls for supported prices and method enabled status.
6. Confirm Shipping Editor no longer shows bare `Protected`; manual/unknown rows use `Manual zone` or `Not managed by Yaxii`.
7. Confirm a successful price or status apply shows `Updating...` for affected rows while diagnostics refreshes, not stale `Needs update`.
8. Confirm the app header, top navigation, and active page content share the same left and right container edges on Shipping Editor, Generator, Diagnostics, and Settings.
9. Confirm the shared container remains full-width without horizontal overflow on mobile widths.
10. Open the generator.
11. Confirm the wizard uses seven steps: Start, Coverage, Methods, Prices, Names, Preview, Generate.
12. Confirm Start shows a diagnostics-guided recommended path.
13. Confirm setup modes are distinct:
   - Create new setup: selects all wilayas for the chosen dataset.
   - Repair existing setup: preselects missing managed zones or method gaps when diagnostics are available.
   - Preview only: runs preview but hides generate/apply.
14. Confirm Coverage is second and does not show setup mode cards.
15. Confirm the dataset selector offers `Current dataset` and `Legacy 58-compatible dataset` with no counts in the option labels.
16. Select current and legacy modes and confirm only the selected dataset summary shows the loaded count.
17. Confirm commune coverage is not a main step and is available only as collapsed reference information.
18. Confirm Methods and Prices are separate steps.
19. Confirm Methods controls enabled delivery methods and labels.
20. Confirm Prices controls defaults and per-wilaya overrides, allows `0` for free shipping, and blocks invalid or negative prices.
21. Confirm Names says existing WooCommerce zone names are not changed in this release.
22. Confirm final preview auto-runs and shows safety copy inline.
23. Confirm Preview-only mode stops at Preview with no Generate/apply controls.
24. Confirm no-op previews show `Setup already matches this selection` and offer `Open Shipping Editor`.
25. Confirm Settings is titled `Defaults for future setup`, the primary action is `Save defaults`, and the page says existing WooCommerce shipping zones are not changed by saving settings.

### TASK-012E Generator State and No-op Smoke

Expected:

- A fully managed setup shows `Your shipping setup is already active`.
- The fully managed primary action opens Shipping Editor.
- `Modify setup anyway` allows continuing into Coverage and warns that existing setup was found.
- Fresh/no setup shows `Create a new shipping setup` with `Start setup`.
- Missing setup shows `Repair missing setup` with `Repair setup`.
- Manual conflicts show `Manual zones need review`, `Review Diagnostics`, and `Open WooCommerce zones`.
- Repair mode preselects only missing or method-incomplete managed wilayas.
- Repair mode with no missing setup says `No repair needed` and offers `Open Shipping Editor`.
- `Preview only` is a small secondary support option and stops at Preview.
- No-op Preview says `Setup already matches this selection`.
- No-op Generate says `No setup changes needed` and does not show a Generate button.
- Unsupported-only Generate says `No supported changes in this release` and does not show a Generate button.
- No WooCommerce write occurs during these navigation and no-op checks.

### TASK-012F Remove Managed Setup Dry-run Smoke

Expected:

- `GET /wp-json/yaxii-shipping-manager/v1/managed-setup/removal-preview` is accessible only to a permitted administrator.
- The response includes `removalAvailable: false` and `dryRunOnly: true`.
- The response includes managed zone and method counts from `yaxii_shipping_manager_managed_zones`.
- Registry mismatches are returned as warnings and are not repaired or cleared.
- Manual WooCommerce zones appear only under `manualZonesProtected`.
- Manual zones are not included in `zonesToRemoveLater`.
- WooCommerce zone count does not change after the endpoint call.
- WooCommerce method count does not change after the endpoint call.
- Settings shows `Advanced tools` and `Remove Yaxii setup`.
- If no Yaxii-managed setup exists, the tool says `No Yaxii setup found.` and no remove button is shown.
- No working remove/delete/reset button is shown.

### TASK-012G Remove Managed Setup Execution Smoke

Expected:

- `GET /wp-json/yaxii-shipping-manager/v1/managed-setup/removal-preview` returns per-zone `canRemove`, method ownership counts, blockers, `dryRunHash`, `dryRunGeneratedAt`, and accepted summary counts.
- Manual WooCommerce zones appear only under `manualZonesProtected`.
- Manual zones are not included in `zonesToRemoveLater` unless they are also recorded in the Yaxii managed registry.
- If a managed zone contains unmanaged methods or an unexpected location, `canRemove` is false and no remove button is shown.
- `POST /wp-json/yaxii-shipping-manager/v1/managed-setup/remove` requires a REST nonce, typed confirmation `REMOVE YAXII SETUP`, the dry-run hash, generated timestamp, and accepted summary counts.
- The remove endpoint re-runs the dry-run before deleting and rejects stale or changed previews.
- Verified removable zones are deleted through WooCommerce shipping zone APIs only after registry ownership is proven.
- Missing WooCommerce zone or method registry entries are cleaned only after confirmed removal.
- Manual zones and methods remain unchanged.
- Settings refreshes the preview after removal and shows `Yaxii setup removed. Manual WooCommerce zones were not touched.`

### TASK-012I Empty Setup and Removal UI Smoke

Expected:

- Shipping Editor shows `No shipping setup yet` when the managed registry is empty, no active managed rows exist, and most or all wilayas are missing.
- The full wilaya table is hidden until `View all wilayas` is clicked.
- `Generate shipping zones` opens Generator in the create setup flow.
- If protected manual WooCommerce zones exist, Shipping Editor shows protected manual-zone copy.
- If no manual WooCommerce zones exist, no manual-zone warning is shown.
- Settings `Advanced tools` says `No Yaxii setup found.` when no Yaxii-managed setup exists.
- When Yaxii-managed setup exists, `Remove Yaxii setup` opens a confirmation modal.
- The confirmation modal says `This removes only Yaxii-managed WooCommerce shipping zones and methods.`, `Manual WooCommerce zones will not be touched.`, and `You can generate a new Yaxii setup again later.`
- The confirmation modal asks the user to type `REMOVE`, not the backend confirmation string.
- The modal shows only Yaxii-managed zones to remove, manual zones protected, and warnings/blockers counts by default.
- `View technical details` contains candidate, blocker, warning, and protected manual-zone records.
- If blockers exist, the modal says `Yaxii setup cannot be safely removed yet.` and does not show `Confirm removal`.
- After successful removal, Settings shows `Yaxii setup removed. Manual WooCommerce zones were not touched.` and offers `Generate shipping zones`.
- Expanding a manual/protected row shows the WooCommerce zone name, matched wilaya code, method names, method prices, and enabled/disabled status when readable.
- Manual/protected row details offer only `Open WooCommerce zones` and `Review in Diagnostics`.
- `Repair setup` and `Repair selected` send preview pricing rows with `methodStatuses` as an object, using an empty object when there are no status changes.
- Generator Start shows `Create a new Yaxii setup` after removal even when protected manual zones remain.
- Generator Start warns `Manual WooCommerce zones exist and will be protected.`
- Preview/Apply still skips or blocks manual conflicts and does not edit manual zones or manual methods.

### TASK-012H Post-Removal Recovery Smoke

Superseded by the TASK-012I empty setup smoke above. The repair payload and manual-zone read-only details expectations from TASK-012H still apply.

### TASK-012D Generator Step Layout Smoke

Expected:

- Start is the first step and contains only diagnostics guidance plus setup mode selection.
- Coverage is the second step and contains dataset mode, wilaya selection, and collapsed commune reference.
- Methods and Prices are separate steps.
- `Legacy 58-compatible dataset` remains selectable and uses loaded dataset counts.
- Preview-only mode does not continue to Generate and does not expose apply controls.
- Existing Preview and Generate behavior is otherwise unchanged.

### TASK-012C Generator Smoke Scenarios

Expected:

- Current dataset / active setup recommends setup already active or repair if issues exist.
- Legacy 58-compatible mode previews only 58 selected wilayas and excludes codes outside `01` through `58`.
- Legacy mode diagnostics do not report additional current-dataset wilayas as missing.
- Repair mode preselects missing or incomplete managed setup when diagnostics exposes it.
- Repair mode says `No repair needed` when no missing or incomplete setup exists.
- Preview-only mode still runs preview and hides generate/apply.
- Communes remain collapsed reference information and do not imply commune-level pricing.

### Diagnostics Health-Check Smoke

Expected result:

- Diagnostics opens as a read-only health-check page.
- The main view shows overall health, passed/warnings/failures counts, compact health cards, and a recommended next action.
- The main view does not show the full wilaya coverage table or raw WooCommerce zone list.
- `Refresh diagnostics` reloads diagnostics without writing to WooCommerce.
- `Advanced details for support` is collapsed by default.
- Opening advanced details shows full wilaya coverage, WooCommerce zone data, zone IDs, ownership hints, raw warnings, generated timestamp, and method counts.
- `Open Shipping Editor` navigates to the Shipping Editor tab.
- `Open Generator` navigates to the Generator tab.
- `Open WooCommerce zones` opens WooCommerce shipping settings in a new tab.
- Issue cards with warnings/failures show direct actions such as `Open Shipping Editor` or `Open WooCommerce zones`.

TASK-011B local smoke result:

- Browser automation authenticated into `wp-admin` with temporary administrator users that were deleted after smoke.
- Diagnostics rendered the reference-style health-check UI with real diagnostics counts: `7` passed, `1` warning, `0` failures on the local store.
- The main Diagnostics view showed the compact health cards and did not show the full wilaya table by default.
- The recommended next action used frontend-derived, merchant-facing text from real diagnostics state: `Review the warning, then use Generator preview before applying changes.`
- `Refresh diagnostics` completed and remained on the health-check view.
- `Advanced details for support` was collapsed by default and opened to show the full wilaya coverage/support table.
- `Open Shipping Editor` navigated to the Shipping Editor tab.
- `Open Generator` required keyboard activation in agent-browser and navigated to the Generator tab.
- `Open WooCommerce zones` opened `admin.php?page=wc-settings&tab=shipping` in a new tab.
- In-process REST smoke for `GET /wp-json/yaxii-shipping-manager/v1/diagnostics` returned `woocommerceActive=true`, `configuredWilayas=69`, `missingWilayas=0`, `duplicateConflictCount=0`, `zonesWithoutMethods=0`, and `checkoutFallbackRisk=low`.
- No WooCommerce write action was performed during the smoke.

### Generator Preview Reference UI Smoke

TASK-011C local smoke result:

- Browser automation authenticated into `wp-admin` with a temporary administrator user that was deleted after smoke.
- Generator reached the final preview step through the real wizard and rendered the reference-style `Preview plan` UI.
- The visible final preview showed readiness, selected-wilaya count, coverage summary, enabled-method count, region format, preview group cards, preview samples, safety copy, review checkbox, and collapsed advanced details from real preview data.
- Main final-preview UI did not show preview hash, contract version, generated timestamp, zone IDs, method keys, ownership-source codes, or raw plan arrays.
- Advanced details were collapsed by default; keyboard activation opened them and showed preview hash, contract version, generated timestamp, raw group counts, warnings, zone IDs, method keys, ownership hints, and support-only plan rows.
- Preview-only wizard mode rendered the same preview-plan layout and showed that apply controls are hidden for that mode.
- Browser console had no page errors; it only showed the normal WordPress jQuery Migrate logs.
- In-process REST smoke for `POST /wp-json/yaxii-shipping-manager/v1/preview` returned `status=200`, `selectedWilayas=69`, `createZones=0`, `addMethods=0`, `updateMethods=0`, `updateMethodStatuses=0`, `conflicts=0`, `readiness=ready`, a valid 64-character preview hash, and `apply-contract-v1`.
- No apply action was triggered in browser or runtime smoke, so no WooCommerce write occurred during TASK-011C smoke.

TASK-011C feedback-pass local smoke result:

- Browser automation authenticated into `wp-admin` with a temporary administrator user that was deleted after smoke.
- Generator was opened from a cache-busted admin URL so the current built asset was verified.
- Keyboard activation was required for `Start generator` in agent-browser; after that, the wizard advanced normally.
- The wizard showed the separate `Step 9 of 9 - Generate` step.
- The Preview step showed `Coverage` as `Wilaya level`; the longer coverage explanation was not visible in the Preview card.
- The Preview step no longer showed a preview sample section.
- The Preview step no longer showed the removed ready-to-save action card.
- The Preview step exposed `Continue to Generate` only after the real preview was ready.
- The Generate step showed `Generate shipping setup`, one-click `Generate setup`, and the safety lines from the reference-style action card.
- The Generate step copy used generate/save wording in the visible merchant UI.
- The `Generate setup` button was not pressed in browser smoke because it calls the real backend write path.
- No WooCommerce write action was performed during the feedback-pass smoke.

## Shipping Editor Table Smoke

Expected result:

- The table-centered Shipping Editor page shows active managed rows when diagnostics are low-risk and Yaxii-managed zones/methods are present.
- Each row shows live WooCommerce status from diagnostics, not only local draft state.
- Technical zone and ownership details are hidden until row details are opened.
- Home and office price inputs show the live WooCommerce cost when the method is registry-owned.
- Editing a managed price marks a pending change and shows old price -> new price.
- The selected-row `Make free` quick tool sets managed pending prices to `0`; method cells display `Free` without a permanent per-cell free toggle.
- Method cells do not show active enable/disable switches.
- Disabled methods keep their price visible in a muted state with a `Disabled` badge.
- A wilaya with all registry-owned managed methods disabled shows `Methods disabled`, not `Active`.
- A wilaya with mixed enabled and disabled registry-owned managed methods shows `Partially active`, not fully active.
- The row-level switch disables or enables all existing Yaxii-managed methods for that wilaya; it does not delete the WooCommerce zone.
- Selected-row quick tools can bulk-enable or bulk-disable selected registry-owned methods.
- `Save changes` or `Review` opens the focused review dialog for price and status changes.
- `Update prices`, `Update status`, or `Save changes` calls preview and then apply through the existing safe backend.
- Missing setup rows keep price inputs disabled, show `Repair setup`, and use the existing preview/apply backend to recreate missing managed zones or methods.
- Selecting one or more missing setup rows shows `Repair selected` without showing price quick tools for those rows.
- Manual or unknown rows cannot be edited through the table.

## Runtime Scenarios

### Existing Setup No-Op

Use one managed wilaya with live WooCommerce method labels and prices as the draft.

Expected result:

- `createZones` is `0`.
- `addMethods` is `0`.
- `updateMethods` is `0`.
- `updateMethodStatuses` is `0`.
- The matched WooCommerce zone and method count do not change.

### Method Price Update

Use one Yaxii-managed wilaya and one registry-owned flat-rate method.

Expected result:

- Preview reports one `updateMethods` item.
- Apply updates only that method instance.
- The registry method record updates `lastKnownCost`.
- Repeating preview with the same draft becomes a no-op.
- Restoring the original draft price updates the same method instance back.

### Method Status Update

Use one Yaxii-managed wilaya and one registry-owned flat-rate method.

Expected result:

- Preview reports one `updateMethodStatuses` item.
- Apply updates only that method instance's `enabled` setting.
- The registry method record updates `enabled`.
- Disabling the method removes it from WooCommerce rate output while preserving its stored price.
- Re-enabling the method returns it to WooCommerce rate output with the original price.
- No zones or methods are created or deleted.

### No Duplicates

Compare method counts before update, after update, after repeat preview, and after restore.

Expected result:

- No new zones are created.
- No new flat-rate methods are created.
- The target zone still has the same count of flat-rate methods.

### Shipping Rate Check

Run a WooCommerce zone match for a package destination in Algeria with the selected wilaya code.

Expected result:

- WooCommerce matches the Yaxii-managed zone for that wilaya.
- Enabled flat-rate methods return the expected labels and restored prices.
- Disabled flat-rate methods do not return in the rate output.

### Missing Setup Repair

Use a disposable LocalWP store where a Yaxii-managed wilaya zone or required managed method was deleted manually.

Expected result:

- Shipping Editor shows the affected wilaya as `Missing setup`.
- Price inputs stay disabled for that row.
- `Repair setup` or `Repair selected` opens a repair dialog.
- The repair dialog says manual zones will not be touched.
- Repair calls preview, then apply, through the existing safe backend.
- Preview reports supported `createZones` or `addMethods` work and no conflicts.
- Apply recreates the missing managed zone or method and updates the managed registry.
- Diagnostics refresh and the repaired row becomes Active when WooCommerce returns the expected zone and methods.
- Manual conflicts block repair and route the merchant to Diagnostics.

TASK-010C local smoke result:

- Browser automation reached the WordPress login screen, so authenticated browser smoke was blocked in this turn.
- WP-CLI/REST smoke used the normal preview and apply REST controllers in-process with an administrator user and REST nonce.
- DZ:01 started with Home delivery `700` and Office delivery `400`.
- Preview reported one managed method update for Home delivery `700` to `701`.
- Apply updated one method and changed Home delivery to `701`.
- Restore preview reported one managed method update back to `700`.
- Restore apply updated one method and returned Home delivery to `700`.
- Office delivery stayed `400`.
- The DZ:01 method count stayed `2` after update and restore.
- WooCommerce rate calculation for destination `DZ:01` returned Home delivery `700` and Office delivery `400`.

TASK-010D local smoke result:

- Browser automation authenticated into `wp-admin` with a temporary administrator user that was deleted after smoke.
- Shipping Editor rendered the reference-aligned page with the compact status card, filters, selected-row quick tools, inline free-shipping switches, read-only enable-state switches, row action menus, hidden details, and sticky pending bar.
- Selected-row quick tools appeared only after selecting rows and supported Home, Office, Both, Set price, Make free, Clear selection, and Review changes.
- A bulk pending price action created pending changes without writing to WooCommerce; the pending changes were discarded successfully.
- Chlef Home delivery was changed from `700` to `701` through the review dialog and existing preview/apply flow.
- Chlef Home delivery was restored from `701` to `700` through the same review/apply flow.
- Runtime WooCommerce verification after restore found `Yaxii - 02 Chlef - الشلف` with Home delivery enabled at `700` and Office delivery enabled at `400`.

TASK-010E local smoke result:

- Browser automation authenticated into `wp-admin` with a temporary administrator user that was deleted after smoke.
- Shipping Editor rendered without per-cell free-shipping toggles.
- Selected-row quick tools appeared after selecting Adrar and included Home, Office, Both, Set price, Change by %, Add / subtract, Round to, Make free, Copy Home -> Office, Copy Office -> Home, Discard pending, disabled Enable, and disabled Disable.
- Keyboard activation was required for quick-tool buttons in `agent-browser`; pointer clicks did not reliably activate toolbar buttons in this smoke session.
- `Make free` created a pending price `0` change through the selected-row quick tools.
- The review dialog opened from `Save changes`; `Update prices` used the existing preview/apply flow and reported `Prices updated`.
- Adrar was restored through selected-row Set price quick tools to Home delivery `700` and Office delivery `400`.
- Runtime WooCommerce verification after restore found Adrar and Chlef each with Home delivery `700` and Office delivery `400`, with one matched zone per wilaya in the smoke script.

TASK-010G local smoke result:

- Browser automation authenticated into `wp-admin` with a temporary administrator user that was deleted after smoke.
- Shipping Editor rendered method-level Home/Office enabled switches and row-level wilaya enabled switches.
- The 3-dot row action menu was absent from the visible row action area.
- Adrar rendered live Home delivery `700` and Office delivery `400`.
- Keyboard activation selected Adrar and revealed the selected-row quick tools, including Home, Office, Both, Set price, Make free, Copy Home -> Office, Copy Office -> Home, Discard pending, Enable, Disable, and Review changes.
- Browser quick tools created a pending disable batch for Adrar without writing immediately; the row showed two pending status changes and `Save changes`/`Review` controls.
- Browser pending status changes were discarded; pending changes returned to `0`.
- WP-CLI/REST smoke used the normal preview and apply REST controllers in-process with an administrator user and REST nonce.
- Disabling DZ:01 Office delivery produced one `updateMethodStatuses` item and removed Office delivery from enabled rate output while Home delivery stayed enabled at `700`.
- Re-enabling DZ:01 Office delivery produced one `updateMethodStatuses` item and restored Office delivery at `400`.
- Disabling the entire DZ:01 wilaya produced two `updateMethodStatuses` items and removed both managed methods from enabled rate output without deleting methods.
- Restoring the entire DZ:01 wilaya produced two `updateMethodStatuses` items and restored Home delivery `700` and Office delivery `400`.
- The DZ:01 managed flat-rate method count stayed `2` throughout the disable/enable flow.

TASK-011E local smoke result:

- Browser automation authenticated into `wp-admin` as the local `dev` administrator.
- Shipping Editor rendered the table with Home delivery, Office delivery, and `Custom method 1` price inputs for managed wilayas.
- Chlef rendered Home delivery `700`, Office delivery `400`, and `Custom method 1` `450`.
- The persisted plugin settings still had `custom_1` and `custom_2` disabled, which reproduced the original display gap.
- A read-only WP-CLI settings check found 68 WooCommerce flat-rate option rows titled `Custom method 1`.
- No generator/apply action was triggered during the smoke.
- No WooCommerce write was performed by this fix.

### Manual-Zone Protection

Do this only in a disposable local store or with explicit approval to create and remove temporary WooCommerce zones.

Expected result:

- Manual or unknown zones are skipped or reported.
- Yaxii does not adopt the manual zone.
- Yaxii does not update manual methods.
- No deletes are performed by the apply engine.

TASK-009B local smoke result:

- Test wilaya `02` already had Yaxii-managed zone `4` with `home_delivery` method `7` at `700` and `office_delivery` method `8` at `400`.
- A temporary manual WooCommerce zone named `Manual Smoke Test - DZ:02` was created for `state:DZ:02` with manual flat-rate method `140`, title `Manual Smoke Method`, and cost `999`.
- Diagnostics reported one duplicate conflict for wilaya `02` and classified the temporary zone as manual or unknown, not Yaxii-owned.
- Preview produced no create, add, or update work for the manual zone; it returned a blocked duplicate-zone conflict for zone IDs `4` and `70`.
- Apply was attempted with the normal confirmation contract and returned a blocked response; the manual zone name, method title, and method cost stayed unchanged.
- The temporary manual zone was deleted by the smoke script after verifying its exact name and ID. Post-cleanup diagnostics returned wilaya `02` to one configured Yaxii-managed zone and duplicate conflicts to `0`.

## Current Limitations

- Zone-name updates are previewed but not applied.
- Full-store reset or wipe tooling is not implemented; only confirmed Yaxii-managed setup removal is available.
- CSV import/export backend is not implemented.
- Commune-specific pricing is not implemented.
- Provider import and YSF sync are not implemented.
- Shipping Editor price/free edits are pending changes; WooCommerce writes go through preview/apply only.

## Generator Return Refresh Smoke

- Generate a supported setup from Generator.
- Click `Return to shipping editor`.
- Confirm Shipping Editor reloads diagnostics and shows the generated managed setup without a browser refresh.
