# Runtime Smoke Checklist

Use this checklist before adding new WooCommerce write paths. The goal is to prove the current merchant flow still works in a real WordPress admin screen and that WooCommerce writes remain limited to supported Yaxii-managed work.

## Browser Admin Smoke

1. Open `wp-admin/admin.php?page=yaxii-shipping-manager` as an administrator.
2. Confirm the plugin admin page loads without console errors.
3. Confirm the main navigation shows only `Shipping Zones`, `Generator`, `Diagnostics`, and `Settings`.
4. Confirm `Import / Export` and `Smart Form Sync` are not visible in the top navigation.
5. Confirm Shipping Zones shows the reference-based management page with live WooCommerce status and pending-change controls for supported prices and method enabled status.
6. Confirm Shipping Zones no longer shows bare `Protected`; manual/unknown rows use `Manual zone` or `Not managed by Yaxii`.
7. Confirm a successful price or status apply shows `Updating...` for affected rows while diagnostics refreshes, not stale `Needs update`.
8. Open the generator.
9. Confirm the wizard uses five steps: Coverage, Methods and prices, Names, Preview, Generate.
10. Confirm Coverage shows a diagnostics-guided recommended path.
11. Confirm setup modes are distinct:
   - Create new setup: selects all wilayas for the chosen dataset.
   - Repair existing setup: preselects missing managed zones or method gaps when diagnostics are available.
   - Preview only: runs preview but hides generate/apply.
12. Confirm the dataset selector offers `Current Algeria dataset` and `Legacy 58-compatible dataset`.
13. Select legacy mode and confirm the selection count is based on the loaded legacy dataset.
14. Confirm commune coverage is not a main step and is available only as collapsed reference information.
15. Confirm delivery methods and prices share one step.
16. Confirm Names says existing WooCommerce zone names are not changed in this release.
17. Confirm final preview auto-runs and shows safety copy inline.
18. Confirm Preview-only mode hides generate/apply controls.
19. Confirm no-op previews show `Setup already matches this selection` and offer `Open Shipping Zones`.
20. Confirm Settings is titled `Defaults for future setup`, the primary action is `Save defaults`, and the page says existing WooCommerce shipping zones are not changed by saving settings.

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
- `Open Shipping Zones` navigates to the Shipping Zones tab.
- `Open Generator` navigates to the Generator tab.
- `Open WooCommerce zones` opens WooCommerce shipping settings in a new tab.
- Issue cards with warnings/failures show direct actions such as `Open Shipping Zones` or `Open WooCommerce zones`.

TASK-011B local smoke result:

- Browser automation authenticated into `wp-admin` with temporary administrator users that were deleted after smoke.
- Diagnostics rendered the reference-style health-check UI with real diagnostics counts: `7` passed, `1` warning, `0` failures on the local store.
- The main Diagnostics view showed the compact health cards and did not show the full wilaya table by default.
- The recommended next action used frontend-derived, merchant-facing text from real diagnostics state: `Review the warning, then use Generator preview before applying changes.`
- `Refresh diagnostics` completed and remained on the health-check view.
- `Advanced details for support` was collapsed by default and opened to show the full wilaya coverage/support table.
- `Open Shipping Zones` navigated to the Shipping Zones tab.
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

## Shipping Zones Table Smoke

Expected result:

- The table-centered Shipping Zones page shows active managed rows when diagnostics are low-risk and Yaxii-managed zones/methods are present.
- Each row shows live WooCommerce status from diagnostics, not only local draft state.
- Technical zone and ownership details are hidden until row details are opened.
- Home and office price inputs show the live WooCommerce cost when the method is registry-owned.
- Editing a managed price marks a pending change and shows old price -> new price.
- The selected-row `Make free` quick tool sets managed pending prices to `0`; method cells display `Free` without a permanent per-cell free toggle.
- Method cells do not show active enable/disable switches.
- Disabled methods keep their price visible in a muted state with a `Disabled` badge.
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

- Shipping Zones shows the affected wilaya as `Missing setup`.
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
- Shipping Zones rendered the reference-aligned page with the compact status card, filters, selected-row quick tools, inline free-shipping switches, read-only enable-state switches, row action menus, hidden details, and sticky pending bar.
- Selected-row quick tools appeared only after selecting rows and supported Home, Office, Both, Set price, Make free, Clear selection, and Review changes.
- A bulk pending price action created pending changes without writing to WooCommerce; the pending changes were discarded successfully.
- Chlef Home delivery was changed from `700` to `701` through the review dialog and existing preview/apply flow.
- Chlef Home delivery was restored from `701` to `700` through the same review/apply flow.
- Runtime WooCommerce verification after restore found `Yaxii - 02 Chlef - الشلف` with Home delivery enabled at `700` and Office delivery enabled at `400`.

TASK-010E local smoke result:

- Browser automation authenticated into `wp-admin` with a temporary administrator user that was deleted after smoke.
- Shipping Zones rendered without per-cell free-shipping toggles.
- Selected-row quick tools appeared after selecting Adrar and included Home, Office, Both, Set price, Change by %, Add / subtract, Round to, Make free, Copy Home -> Office, Copy Office -> Home, Discard pending, disabled Enable, and disabled Disable.
- Keyboard activation was required for quick-tool buttons in `agent-browser`; pointer clicks did not reliably activate toolbar buttons in this smoke session.
- `Make free` created a pending price `0` change through the selected-row quick tools.
- The review dialog opened from `Save changes`; `Update prices` used the existing preview/apply flow and reported `Prices updated`.
- Adrar was restored through selected-row Set price quick tools to Home delivery `700` and Office delivery `400`.
- Runtime WooCommerce verification after restore found Adrar and Chlef each with Home delivery `700` and Office delivery `400`, with one matched zone per wilaya in the smoke script.

TASK-010G local smoke result:

- Browser automation authenticated into `wp-admin` with a temporary administrator user that was deleted after smoke.
- Shipping Zones rendered method-level Home/Office enabled switches and row-level wilaya enabled switches.
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
- Shipping Zones rendered the table with Home delivery, Office delivery, and `Custom method 1` price inputs for managed wilayas.
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
- Reset or wipe tooling is not implemented.
- CSV import/export backend is not implemented.
- Commune-specific pricing is not implemented.
- Provider import and YSF sync are not implemented.
- Shipping Zones price/free edits are pending changes; WooCommerce writes go through preview/apply only.
