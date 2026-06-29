# Lovable Brief: Shipping Zones Daily Manager

Date: 2026-06-29

## Product Goal

Design the Shipping Zones page as the merchant's daily shipping management center for Algeria WooCommerce shipping. The page should feel like the place where a merchant checks live prices, changes Home or Office delivery prices, and safely updates WooCommerce.

This is not a setup wizard. It is not a developer diagnostics console. It is the daily manager.

## Product Context

Yaxii Shipping Manager is a free WordPress/WooCommerce plugin for Algerian merchants and agencies. It helps configure and manage Algeria shipping for WooCommerce without forcing merchants to work directly inside WooCommerce shipping zones.

The backend can safely:

- Create Yaxii-managed WooCommerce shipping zones.
- Add Yaxii-managed flat-rate methods.
- Update Yaxii-managed flat-rate method labels and prices.
- Protect manual or unknown WooCommerce zones.
- Block conflicts.
- Avoid duplicate methods.

The backend cannot currently:

- Enable or disable methods.
- Rename existing WooCommerce zones.
- Delete zones or methods.
- Adopt manual zones.
- Import or export CSV.
- Price by commune.
- Import provider tables.
- Sync with Yaxii Smart Form.

## Current Problems

The current Shipping Zones page is safer than before, but it still feels too complicated:

- Too many cards, notices, filters, labels, and safety explanations compete for attention.
- `Open Generator` is too prominent for a daily price edit.
- `Needs update` does not instantly explain the next action.
- The table can still feel like a local draft tool instead of a real manager for WooCommerce prices.
- Diagnostics are too close to the main workflow.
- Unsupported features such as enable/disable create noise.
- Free shipping should feel like a simple price state, not a separate feature.
- Merchants should not need to run the full Generator wizard to change a managed price.

## Desired Shipping Zones Page

The page should answer three questions quickly:

1. Is my Algeria shipping setup active?
2. What are my current Home and Office prices by wilaya?
3. What do I click after changing a price?

Desired merchant flow:

1. Merchant opens Shipping Zones.
2. They see live WooCommerce status and a clean price table.
3. They edit a Home or Office price in a row.
4. The row clearly shows the price changed.
5. A clear action appears: `Review & apply`.
6. A short review confirms old price, new price, affected wilayas, and safety rules.
7. Merchant clicks `Update prices`.
8. Success says exactly what changed.

## Desired Generator Role

Generator is for setup and bulk preparation, not daily price editing.

Use Generator for:

- Fresh setup.
- Creating missing managed zones.
- Adding missing methods.
- Broad setup repair.
- Coverage, methods, labels, and defaults.

Do not make Generator the primary path for a simple price change.

## Desired Daily Price Update Flow

Preferred pattern:

- Inline row edit.
- Changed state in the row.
- Bottom or side action area for pending price updates.
- `Review & apply` as the primary action.
- Focused confirmation view for only the pending price updates.
- Final `Update prices` confirmation.

The review can be a modal, drawer, or focused inline panel. Be creative with layout. The important product logic is that the merchant sees a simple price-update confirmation, not a generic setup preview.

## Required UI States

Design for these states:

- Loading WooCommerce status.
- Shipping setup active.
- Missing setup.
- Manual conflict.
- Protected manual row.
- Managed row with editable Home and Office prices.
- Managed row with pending price change.
- Free shipping price state.
- No pending changes.
- Pending changes ready to review.
- Review in progress.
- Review blocked by conflict.
- Apply in progress.
- Apply succeeded.
- Apply failed or blocked.
- No-op: everything already matches.

## What To Show

Show prominently:

- Live status in plain merchant language.
- Search by wilaya code or name.
- Home delivery price.
- Office delivery price.
- Clear changed state, ideally old value to new value.
- One primary pending action: `Review & apply`.
- Secondary links:
  - `Advanced diagnostics`
  - `Open WooCommerce zones`
  - `Generator` only when setup or bulk work is needed

Show in details or support views:

- WooCommerce zone name.
- Ownership status.
- Missing methods.
- Manual protection explanation.

## What To Hide Or De-Emphasize

Hide from the main daily flow:

- Zone IDs.
- Method instance IDs.
- Preview hashes.
- Contract versions.
- Registry language.
- Advanced conflict internals.
- Enable/disable controls.
- Zone-name update controls.
- Delete/reset actions.
- Provider import actions.
- YSF sync.
- CSV tools unless presented as unavailable.

## UX Rules

- Think like a merchant, not a developer.
- One page, one main job: manage prices.
- Make the next action obvious after a price change.
- Avoid repeated warning cards.
- Keep safety reassuring but concise.
- Do not make unsupported features look clickable.
- Do not imply manual zones will be changed.
- Do not make diagnostics feel like the normal workflow.
- Keep the table practical for agencies managing many wilayas.
- Preserve a professional WordPress admin feel.
- Use clear operational language, not marketing language.

## Sample Content

Status examples:

- `Shipping setup is active`
- `Some wilayas need setup`
- `Manual WooCommerce zones need review`
- `WooCommerce is inactive`

Price update examples:

- `Home delivery: 700 DZD -> 750 DZD`
- `Office delivery: 400 DZD -> Free`
- `3 price updates ready`
- `Review & apply`
- `Update prices`
- `Updated Home delivery in 3 wilayas`

Manual protection examples:

- `Manual zone protected`
- `Yaxii will not change this WooCommerce zone.`
- `Open WooCommerce zones to edit manual methods.`

No-op example:

- `All managed prices match WooCommerce.`

## Unsupported Features To Mark As Future

If these appear at all, mark them as future or hide them:

- Method enable/disable.
- Zone renaming.
- Deletes and reset tools.
- Manual-zone adoption.
- Manual method editing.
- CSV import/export.
- Commune-level pricing.
- Provider imports.
- Smart Form Sync.

## Creative Freedom

Do not copy the current layout. Explore better ways to make the daily price-management workflow obvious and calm. The final concept can use a table, split manager, drawer, modal, or other practical admin pattern as long as the merchant can quickly edit prices and safely apply them.
