# Generator Wizard Product Plan

## Purpose

The Generator Wizard should help an Algerian WooCommerce merchant prepare a safe shipping setup before Yaxii writes anything to WooCommerce.

The wizard is not the apply engine. It prepares a draft, shows read-only diagnostics and preview results, and keeps apply disabled until a future safe apply task implements reviewed WooCommerce writes.

## Current Wizard Audit

Current steps in `admin-app/src/routes/index.tsx`:

1. Setup path
2. Dataset mode
3. Label/naming
4. Shipping methods
5. Default prices
6. Wilaya selection
7. Review draft

Already connected to real backend contracts:

- Settings initialize from persisted settings.
- Current wilayas load through `GET /dataset?mode=current&include=wilayas`.
- Preview calls `POST /preview`.
- Preview output shows grouped plan results, readiness, preview hash, and disabled apply state.
- Diagnostics uses `GET /diagnostics`.
- Apply remains disabled through the apply contract.

Still prototype-like:

- The wizard starts with setup path choices instead of the merchant's real question: which wilayas and prices should be covered?
- CSV appears as a selectable path even though the backend is not connected.
- Label and naming appears before coverage and prices, which makes the flow feel like a UI configuration form instead of a shipping setup assistant.
- Communes are not visible even though the dataset contains them.
- Review does not summarize commune coverage.
- The final action says local draft, while the real journey should point toward preview.
- The current wizard lives in one large route module, so the next UI task should split it carefully without broad refactoring.

## Proposed Wizard Flow

Recommended steps:

1. Setup mode and defaults
2. Coverage
3. Cities and communes
4. Delivery methods
5. Shipping prices
6. Names and labels
7. Safety check
8. Preview
9. Apply managed zones and methods when safe

### 1. Setup Mode And Defaults

Purpose: choose how the merchant wants to start.

Options:

- Fresh setup
- Continue existing setup
- Preview changes only

Recommended copy:

> Choose how you want to prepare your Algeria shipping setup. Preview runs before any apply.

Mapping:

- Fresh setup: default to all current wilayas selected.
- Continue existing setup: use diagnostics to explain existing WooCommerce zones.
- Preview changes only: let the merchant review a plan without implying apply is available.

CSV import should not be a primary wizard path until the CSV backend exists. Keep it outside this wizard or show it as disabled with plain copy.

### 2. Coverage

Purpose: select the wilayas covered by this store.

Options:

- Current Algeria dataset, 69 wilayas.
- Legacy 58-compatible dataset, visible but unavailable.
- Select all wilayas.
- Select individual wilayas.
- Search wilayas by code, French name, or Arabic name.
- Show commune count per wilaya.

Recommended copy:

> Select the wilayas where you deliver. Yaxii will preview WooCommerce shipping zones for these wilayas.

Legacy unavailable copy:

> Legacy 58-compatible mode is not available yet. We will add it only after a safe mapping is verified.

### 3. Cities And Communes

Purpose: make commune coverage visible without promising unsupported commune-level pricing.

MVP decision:

- Show communes inside selected wilayas for visibility.
- Default coverage is all communes inside selected wilayas.
- Commune list is informational and read-only.
- Do not allow commune exclusions in the MVP.
- Do not add commune-level pricing controls.
- Native WooCommerce zone generation remains wilaya-level.

Recommended UI:

- Show a coverage summary: selected wilayas and total communes covered.
- Add a collapsible section per selected wilaya.
- Each wilaya row shows commune count.
- Add search/filter inside the commune list.
- Disabled exclusion controls may appear only if the copy is explicit that exclusions are not available yet; otherwise omit them to avoid confusion.

Recommended copy:

> All communes inside selected wilayas are covered. WooCommerce zones are created at wilaya level. Commune-specific prices need a future Yaxii shipping method and are not part of this setup yet.

Backend path:

- Use `GET /dataset?mode=current&include=communes&wilaya_code=NN` when a wilaya section is opened.
- Do not import `data/algeria/current/communes.json` into React.
- Do not fetch all communes by default unless needed for a small summary; prefer lazy loading per wilaya.

Future option:

- City or commune-specific pricing requires a custom Yaxii WooCommerce shipping method or checkout city integration.
- It must be planned separately because native WooCommerce zones cannot safely express all commune-level price rules by themselves.

### 4. Delivery Methods

Purpose: choose the flat-rate methods Yaxii should preview.

MVP methods:

- Home delivery
- Office / stop desk delivery
- Custom method 1
- Custom method 2

Rules:

- Home delivery and office / stop desk delivery are required.
- Custom method 1 and 2 are optional.
- Unlimited custom methods are not in the MVP.
- Method type remains `flat_rate`.

Recommended copy:

> Choose the delivery methods customers should see at checkout. Home delivery and office / stop desk delivery stay on for the MVP.

### 5. Shipping Prices

Purpose: set default and per-wilaya prices before preview.

Options:

- Default home delivery price.
- Default office / stop desk price.
- Custom method prices when custom methods are enabled.
- Per-wilaya price override.
- Bulk apply a price to selected wilayas.
- Optional free shipping value by setting price to `0`.
- Empty means unset local draft.

Validation:

- Reject negative values.
- Reject invalid numbers.
- Keep currency display as WooCommerce currency later, fallback `DZD`.
- Do not do WooCommerce money writes in the wizard.

Recommended copy:

> Set the prices Yaxii should preview. These prices are not written to WooCommerce yet.

### 6. Names And Labels

Purpose: decide how zones and method labels appear in preview.

Options:

- Zone prefix.
- Zone name format.
- Region label format: French, Arabic, French - Arabic, Arabic - French.
- Office wording: Office delivery, Stopdesk, Bureau, Custom label.

Recommended copy:

> Choose how wilayas and WooCommerce zones should be named in the preview.

### 7. Safety Check

Purpose: explain what the apply engine protects before preview.

Show locked safety rules:

- Manual zones are skipped.
- Conflicts are blocked.
- No deletes are planned.
- Preview is required before apply.

Recommended copy:

> Yaxii protects manual WooCommerce zones. Conflicts must be reviewed before apply.

### 8. Preview

Purpose: call the real preview endpoint and show the plan.

The preview request should send:

- selected wilaya codes
- pricing rows
- methods
- zone name format
- zone prefix
- region label format

Show:

- selected wilayas count
- commune coverage summary
- enabled methods
- price summary
- safety rules
- preview groups
- readiness state
- preview hash and contract version

Recommended copy:

> This is a preview only. No WooCommerce changes were made.

### 9. Apply Managed Zones And Methods

Purpose: make the current boundary obvious.

Recommended copy:

> Apply can create missing Yaxii-managed zones and add selected methods with prices to managed zones. Manual zones are not touched.

The active apply button should appear only when a reviewed preview has missing zones or missing methods, no conflicts, and the required confirmation text is entered.

## UI Copy Recommendations

Fresh store:

> Ready to create Yaxii zones. No existing Algeria wilaya zones were found.

Manual zones detected:

> Manual zones are protected and will be skipped.

Conflicts detected:

> Conflicts found. Resolve duplicate or overlapping zones before applying.

No wilayas selected:

> Select at least one wilaya to preview shipping setup.

Preview only:

> This is a preview only. No WooCommerce changes were made.

Apply managed zones and methods:

> Create zones and add methods.

Commune coverage:

> All communes inside selected wilayas are covered. Commune-specific prices are not available yet.

Legacy 58 unavailable:

> Legacy 58-compatible mode is not available yet.

## Next UI Implementation Scope

Must implement next:

- Replace the current wizard step order with the product flow above.
- Add commune visibility for selected wilayas.
- Add wilaya search and commune search/filter.
- Show commune count per wilaya.
- Keep commune coverage informational/read-only.
- Improve selected wilaya and pricing review.
- Move preview into the final wizard step.
- Make safety copy clear before preview.
- Enable apply only for the reviewed managed-zone path.

Must not implement next:

- WooCommerce zone updates, deletes, or method updates beyond adding methods to managed zones.
- Commune-level pricing engine.
- Checkout city field changes.
- CSV backend.
- Provider imports.
- YSF sync.
- Remote calls, remote tracking, licensing, or Pro locks.

## Risks

- Showing communes may cause merchants to expect commune-specific pricing. The UI must say clearly that MVP coverage is wilaya-level.
- Fetching all 1541 communes at once may make the wizard feel heavy. Lazy-load communes per selected wilaya when possible.
- The wizard source is currently in a large route file. The next implementation should split new wizard components without changing unrelated screens.
- The current dataset is candidate data and not independently verified as official administrative truth. UI copy should avoid official claims.
