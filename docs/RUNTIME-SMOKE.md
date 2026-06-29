# Runtime Smoke Checklist

Use this checklist before adding new WooCommerce write paths. The goal is to prove the current merchant flow still works in a real WordPress admin screen and that WooCommerce writes remain limited to supported Yaxii-managed work.

## Browser Admin Smoke

1. Open `wp-admin/admin.php?page=yaxii-shipping-manager` as an administrator.
2. Confirm the plugin admin page loads without console errors.
3. Confirm Shipping Zones shows the reference-based management page with live WooCommerce status and pending-change controls for supported prices.
4. Open the generator.
5. Confirm setup modes are distinct:
   - Fresh setup: create a new shipping setup for selected wilayas.
   - Continue existing: add only missing managed zones or methods; manual zones are protected.
   - Preview changes: review only, without apply pressure.
6. Confirm wilaya selection works and Fresh setup defaults to all current wilayas.
7. Confirm commune coverage can be skipped.
8. Confirm commune coverage can be shown, and opening one wilaya lazy-loads read-only commune rows.
9. Confirm delivery methods can be reviewed.
10. Confirm prices can be edited as draft values.
11. Confirm names and safety steps are reachable.
12. Confirm final preview auto-runs.
13. Confirm final details are collapsed by default.
14. Confirm Preview-only mode hides apply controls and shows `Check diagnostics`.
15. Confirm `Check diagnostics` opens the Diagnostics tab.

## Shipping Zones Table Smoke

Expected result:

- The table-centered Shipping Zones page shows active managed rows when diagnostics are low-risk and Yaxii-managed zones/methods are present.
- Each row shows live WooCommerce status from diagnostics, not only local draft state.
- Technical zone and ownership details are hidden until row details are opened.
- Home and office price inputs show the live WooCommerce cost when the method is registry-owned.
- Editing a managed price marks a pending change and shows old price -> new price.
- The selected-row `Make free` quick tool sets managed pending prices to `0`; method cells display `Free` without a permanent per-cell free toggle.
- `Save changes` or `Review` opens the focused price-update dialog.
- `Update prices` calls preview and then apply through the existing safe backend.
- Missing setup rows keep price inputs disabled, show `Repair setup`, and use the existing preview/apply backend to recreate missing managed zones or methods.
- Selecting one or more missing setup rows shows `Repair selected` without showing price quick tools for those rows.
- Enable/disable visual state is read-only and clearly disabled because method status updates are not implemented yet.
- Manual or unknown rows cannot be edited through the table.

## Runtime Scenarios

### Existing Setup No-Op

Use one managed wilaya with live WooCommerce method labels and prices as the draft.

Expected result:

- `createZones` is `0`.
- `addMethods` is `0`.
- `updateMethods` is `0`.
- The matched WooCommerce zone and method count do not change.

### Method Price Update

Use one Yaxii-managed wilaya and one registry-owned flat-rate method.

Expected result:

- Preview reports one `updateMethods` item.
- Apply updates only that method instance.
- The registry method record updates `lastKnownCost`.
- Repeating preview with the same draft becomes a no-op.
- Restoring the original draft price updates the same method instance back.

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
