# Runtime Smoke Checklist

Use this checklist before adding new WooCommerce write paths. The goal is to prove the current merchant flow still works in a real WordPress admin screen and that WooCommerce writes remain limited to supported Yaxii-managed work.

## Browser Admin Smoke

1. Open `wp-admin/admin.php?page=yaxii-shipping-manager` as an administrator.
2. Confirm the plugin admin page loads without console errors.
3. Confirm Shipping Zones says controls are local draft controls only.
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

### Manual-Zone Protection

Do this only in a disposable local store or with explicit approval to create and remove temporary WooCommerce zones.

Expected result:

- Manual or unknown zones are skipped or reported.
- Yaxii does not adopt the manual zone.
- Yaxii does not update manual methods.
- No deletes are performed by the apply engine.

## Current Limitations

- Zone-name updates are previewed but not applied.
- Reset or wipe tooling is not implemented.
- CSV import/export backend is not implemented.
- Commune-specific pricing is not implemented.
- Provider import and YSF sync are not implemented.
- Shipping Zones table edits are local draft controls; WooCommerce writes go through the generator preview/apply flow only.
