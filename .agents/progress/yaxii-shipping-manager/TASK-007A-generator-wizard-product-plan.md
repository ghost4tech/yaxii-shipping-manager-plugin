# TASK-007A - Generator Wizard Product Plan and Cities Coverage UX

Date: 2026-06-28

## Goal

Plan the real Generator Wizard product flow before implementation, including how cities and communes should appear without promising unsupported commune-level pricing.

## Scope

Planning and documentation only.

No frontend UI code, PHP code, WooCommerce write code, CSV backend, provider import, YSF sync, checkout field change, telemetry, licensing, or Pro lock was added.

## Files Changed

- None.

## Files Created

- `docs/GENERATOR-WIZARD.md`
- `.agents/progress/yaxii-shipping-manager/TASK-007A-generator-wizard-product-plan.md`

## What Was Before

The admin app had a wired read-only journey after TASK-006B, but the generator wizard still followed an older prototype-like sequence:

1. Setup path
2. Dataset mode
3. Label/naming
4. Shipping methods
5. Default prices
6. Wilaya selection
7. Review draft

The wizard could call preview, but it did not yet feel like a merchant-first Algeria shipping setup flow.

## Current Wizard Problems

- Coverage appears late in the flow even though wilaya coverage is the main merchant decision.
- Label and naming appears before coverage and prices.
- CSV appears as a setup path even though the backend is not connected.
- Communes are not visible even though the dataset includes 1541 commune rows.
- The review step does not summarize commune coverage.
- The final action still feels like local prototype draft handling instead of a clear preview journey.
- The wizard is implemented inside the large `admin-app/src/routes/index.tsx` route module, which makes future UI changes harder to review.

## Already Connected To Real Backend

- Settings load through `GET /settings` and save through `PUT /settings`.
- Current wilayas load through `GET /dataset?mode=current&include=wilayas`.
- Commune data is available through `GET /dataset?mode=current&include=communes&wilaya_code=NN`, but the wizard does not use it yet.
- Preview calls `POST /preview`.
- Diagnostics uses `GET /diagnostics`.
- Apply remains disabled through the apply contract.

## Proposed Wizard Steps

Recommended flow:

1. Setup mode and defaults
2. Coverage
3. Cities and communes
4. Delivery methods
5. Shipping prices
6. Names and labels
7. Safety check
8. Preview
9. Apply disabled

This order matches the merchant journey: decide how to start, choose where they deliver, understand commune coverage, define methods and prices, check safety, then preview.

## Cities / Communes UX Decision

MVP decision:

- User selects wilayas.
- The wizard shows communes inside selected wilayas for visibility.
- Default coverage is all communes inside selected wilayas.
- Commune list is informational and read-only.
- Native WooCommerce zone generation remains wilaya-level.
- Commune exclusions should not be enabled yet.
- Commune-level pricing should not be implemented or promised.

Recommended UI:

- Show commune count per selected wilaya.
- Show communes in collapsible sections.
- Lazy-load communes when a selected wilaya section opens.
- Include search/filter inside the commune list.
- Use clear copy: all communes inside selected wilayas are covered, but commune-specific prices need a future Yaxii shipping method or checkout integration.

## Options To Include

Setup mode:

- Fresh setup
- Continue existing setup
- Preview changes only

Dataset:

- Current Algeria dataset with 69 wilayas
- Legacy 58-compatible dataset visible but unavailable

Coverage:

- Select all wilayas
- Select individual wilayas
- Search wilayas
- Show commune count per wilaya
- View communes inside selected wilayas

Delivery methods:

- Home delivery
- Office / stop desk delivery
- Custom method 1
- Custom method 2

Pricing:

- Default home delivery price
- Default office / stop desk price
- Custom method default prices when enabled
- Per-wilaya price override
- Bulk apply price to selected wilayas
- Free shipping by setting a price to `0`
- Reject negative or invalid prices

Naming:

- Zone prefix
- Zone name format
- Region label format
- Office wording

Safety:

- Manual zones skipped
- Conflicts blocked
- No deletes planned
- Preview required before apply

Review:

- Selected wilayas count
- Commune coverage summary
- Enabled methods
- Prices summary
- Safety rules
- Preview button

## UI Copy Recommendations

- Fresh store: `Ready to create Yaxii zones. No existing Algeria wilaya zones were found.`
- Manual zones detected: `Manual zones are protected and will be skipped.`
- Conflicts detected: `Conflicts found. Resolve duplicate or overlapping zones before applying.`
- No wilayas selected: `Select at least one wilaya to preview shipping setup.`
- Preview only: `This is a preview only. No WooCommerce changes were made.`
- Apply disabled: `Apply engine is not enabled yet.`
- Commune coverage: `All communes inside selected wilayas are covered. Commune-specific prices are not available yet.`
- Legacy 58 unavailable: `Legacy 58-compatible mode is not available yet.`

## What Should Be Implemented In Next Task

- Reorder the wizard around the proposed product flow.
- Add commune visibility for selected wilayas.
- Add wilaya search.
- Add commune search/filter.
- Show commune count per wilaya.
- Keep commune coverage informational/read-only.
- Improve selected wilaya and pricing review.
- Move preview into the final wizard step.
- Add clearer safety copy before preview.
- Keep apply disabled.
- Split new wizard logic into smaller modules where practical instead of adding more weight to `routes/index.tsx`.

## What Should Not Be Implemented Yet

- Real apply engine.
- WooCommerce zone creation, update, or deletion.
- WooCommerce method creation or price updates.
- Commune-level pricing engine.
- Checkout city/commune field changes.
- CSV backend.
- Provider imports.
- YSF sync.
- Remote calls, telemetry, licensing, or Pro locks.

## Security Review

No code or endpoint behavior changed. The plan preserves existing protected REST contracts and keeps apply disabled.

## WooCommerce Safety Review

The plan keeps WooCommerce writes out of scope. Manual merchant zones remain protected by default, conflicts remain blocked, and no deletes are planned for the MVP.

## WordPress.org Compliance Review

The plan adds no tracking, remote services, external assets, licensing, Pro locks, or misleading paid-feature gates. Documentation avoids claiming commune-level pricing or real apply support.

## QA Guard Findings

- `clean-code-guard`: next implementation should avoid growing `routes/index.tsx` further and should split wizard-specific components/helpers.
- `docs-guard`: `docs/GENERATOR-WIZARD.md` documents planned behavior and labels future behavior clearly.
- `wp-plugin-development`: the plan stays inside local admin and existing REST contracts.
- `wp-guard`: no new public or state-changing route is planned for the next UI task.
- `woo-guard`: no WooCommerce writes are planned; native zone coverage remains wilaya-level.
- `wp-rest-api`: communes should be loaded through the existing protected dataset endpoint.
- `wp-plugin-directory-guidelines`: no remote dependency, telemetry, licensing, or upsell pattern is introduced.

## Checks Run

- `git diff --check`
- `git status --short --untracked-files=all`
- Planning docs wording scan for forbidden or misleading phrases

No npm build, npm lint, PHP lint, or Composer autoload check was run because only documentation/report files changed.

## Check Results

- `git diff --check`: passed.
- `git status --short --untracked-files=all`: only the TASK-007A report and `docs/GENERATOR-WIZARD.md` were untracked before staging.
- Wording scan: no forbidden `68 wilayas` wording and no misleading apply-enabled or commune-pricing-available claims. The only matches were intended "No WooCommerce changes were made" copy examples.

## Risks

- Showing communes may make merchants expect commune-specific pricing. The UI must clearly say commune-level pricing is not available yet.
- Loading all communes at once may make the wizard heavy. Lazy loading by selected wilaya is safer.
- The current dataset is candidate data and not independently verified as official administrative truth.
- Runtime browser QA is still needed after the local WordPress database issue from TASK-006B is fixed.

## Blockers

None for this planning task.

## Next Recommended Task

TASK-007B: implement the redesigned generator wizard UI with commune visibility and read-only preview flow, without WooCommerce writes.

## Commit Hash

Pending.
