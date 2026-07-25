# TASK-010A: Product Flow UX Audit

Date: 2026-06-29

## Goal

Audit all current plugin tabs and workflows before more coding, with special focus on making Shipping Zones the daily management center for supported price updates.

This was an audit and planning task only. No product code was changed.

## Git State

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git root: `C:/Users/Aymen/Local Sites/yaxii-ysz/app/public/wp-content/plugins/yaxii-shipping-manager`
- Starting branch: `task/shipping-zones-page-redesign-reference`
- Task branch: `task/010a-product-flow-ux-audit`
- Preflight worktree status before branch creation: clean.
- Recent graph showed `d1f3dd5` at `task/shipping-zones-page-redesign-reference`, ahead of `main` and `origin/main`.
- TASK-010 commit `d1f3dd5` is present locally.
- Local `main` does not contain `d1f3dd5`.
- `origin/main` does not contain `d1f3dd5`.
- Safe sync path: keep this work on a task branch from `d1f3dd5`, then fast-forward or PR/merge TASK-010 and TASK-010A into `main` without rewriting history.
- `app/.git` was not present.
- `.agents/skills/` was not present.
- `.agents/skills/` was present and used for available guard instructions.
- `.agents/references/yaxii-shipping-hub-03/` is present but was not staged or committed.

## Scope

Included:

- Read-only review of current docs, reports, React app, API clients, preview/apply components, diagnostics, settings, and backend preview/apply services.
- Product-flow recommendations for every tab.
- Backend capability versus UI expectation matrix.
- Lovable design brief for the next Shipping Zones rework.
- Task report.

Not included:

- No UI implementation.
- No backend write path.
- No zone-name updates.
- No direct table writes.
- No reset or wipe tooling.
- No manual zone adoption.
- No CSV backend.
- No commune-level pricing.
- No provider imports.
- No YSF sync.

## Tabs Audited

- Shipping Zones
- Generator
- Diagnostics
- Import / Export
- Settings
- Smart Form Sync

## Current Workflow Map

Initial setup:

- The merchant uses Generator to choose setup mode, wilayas, commune visibility, methods, prices, names, safety, preview, and apply.
- The backend can create Yaxii-managed zones, add methods, and update registry-owned method labels/prices after preview revalidation.
- This flow is appropriate for setup and broad repair.

Daily price update:

- The merchant can edit managed Home or Office prices in Shipping Zones.
- The table creates pending changes.
- `Review changes` calls preview and then the existing safe apply panel.
- This works technically, but still feels too much like setup/review machinery for a simple price update.

Manual-zone conflict:

- Diagnostics detects conflict.
- Preview/apply blocks unsafe duplicate conflict states.
- Manual and unknown rows remain protected.
- The UI should explain the merchant action more plainly.

No-op state:

- Preview can report no supported work.
- Shipping Zones should show that managed prices already match WooCommerce and avoid asking for review.

Preview-only mode:

- Useful in Generator for agencies/support.
- Not recommended as a daily Shipping Zones mode.

## Biggest UX Problems

- Shipping Zones is conceptually correct but still too complex for daily price editing.
- The UI overuses setup language and Generator handoffs.
- `Needs update` needs a direct next action and old-to-new price context.
- Diagnostics is too prominent for everyday merchants.
- Settings can look like it updates WooCommerce when it only persists defaults.
- Unsupported enable/disable and future features should be hidden or clearly future.
- The same preview/apply panel is doing both setup and price-update jobs without enough copy adaptation.

## Recommended Product Flow

- Shipping Zones: daily management center for live status and supported managed price updates.
- Generator: initial setup and broad bulk setup or repair.
- Diagnostics: advanced/support health check.
- Settings: defaults and naming rules for future drafts/previews.
- Import / Export: later bulk tools or hidden until backend exists.
- Smart Form Sync: hidden or Coming Soon under Tools until scoped.

## Shipping Zones Daily Management Recommendation

Use a focused `Review & apply` price-update flow from the table.

Recommended pattern:

1. Merchant edits a managed Home or Office price.
2. Row shows old price to new price.
3. A pending action says `Review & apply`.
4. Review shows affected wilayas, method, old price, new price, and safety rules.
5. Merchant clicks `Update prices`.
6. Backend uses the existing preview/apply revalidation path.
7. Success says exactly what changed.

This is safer than one-click save and more practical than running the full Generator.

## Generator Role Recommendation

Generator should be limited to:

- Fresh setup.
- Continue existing setup.
- Preview-only planning.
- Creating missing zones.
- Adding missing methods.
- Bulk setup or broad setup repair.
- Coverage, methods, labels, and defaults.

It should not be required for routine managed price edits.

## Diagnostics, Settings, Import, And Sync Recommendations

- Diagnostics: move mentally under advanced/support. Keep full details for agencies.
- Settings: simplify as defaults only. Make clear that saving settings does not update existing WooCommerce zones.
- Import / Export: keep Coming Soon or hide until a real CSV backend exists.
- Smart Form Sync: hide or keep as a minor Coming Soon page until real YSF integration is scoped.

## Backend Capability Vs UI Expectation Table

| UI expectation                    | Current capability              | Recommendation                                |
| --------------------------------- | ------------------------------- | --------------------------------------------- |
| Live WooCommerce status           | Supported                       | Keep                                          |
| Managed Home/Office price updates | Supported through preview/apply | Make table flow clearer                       |
| Free shipping as price `0`        | Supported                       | Keep inline                                   |
| Bulk managed price updates        | Supported through preview/apply | Keep secondary                                |
| Create missing zones              | Supported                       | Keep in Generator                             |
| Add missing methods               | Supported                       | Keep in Generator/repair                      |
| Managed method label updates      | Supported through preview/apply | Keep out of daily table unless clearly scoped |
| Enable/disable methods            | Not supported                   | Hide until backend task                       |
| Zone-name updates                 | Preview only                    | Future task                                   |
| Deletes/reset/wipe                | Not supported                   | Do not add                                    |
| Manual adoption                   | Not supported                   | Do not add                                    |
| Manual/unknown method edits       | Not supported                   | Keep protected                                |
| CSV                               | Not supported                   | Coming Soon or hidden                         |
| Commune pricing                   | Not supported                   | Do not imply                                  |
| Provider imports                  | Not supported                   | Hide                                          |
| YSF sync                          | Not supported                   | Hide or Coming Soon                           |

## Lovable Brief Created

- `docs/LOVABLE-SHIPPING-ZONES-REWORK-BRIEF.md`

The brief is design-focused and explains product logic, desired flow, UI states, what to hide, what to show, sample content, and unsupported future features.

## Files Changed

- `docs/PRODUCT-FLOW-UX-AUDIT.md`
- `docs/LOVABLE-SHIPPING-ZONES-REWORK-BRIEF.md`
- `.agents/progress/yaxii-shipping-manager/TASK-010A-product-flow-ux-audit.md`

## Files Created

- `docs/PRODUCT-FLOW-UX-AUDIT.md`
- `docs/LOVABLE-SHIPPING-ZONES-REWORK-BRIEF.md`
- `.agents/progress/yaxii-shipping-manager/TASK-010A-product-flow-ux-audit.md`

## What Was Before

- TASK-010 redesigned the Shipping Zones page visually and preserved the existing preview/apply behavior.
- Existing docs described the table as a management center, but the product flow still pushed too much setup/review complexity into daily price editing.

## What Changed

- Added a full product-flow UX audit.
- Added a separate Lovable brief for a creative Shipping Zones rework.
- Recorded the current backend capability boundaries against UI expectations.

## What Still Remains Mocked

- No new mocks were added.
- Existing unsupported areas remain not implemented: CSV backend, commune pricing, provider imports, YSF sync, enable/disable, zone-name updates, deletes/reset, and manual adoption.

## Security Notes

- No product code changed.
- No REST endpoints changed.
- No new write path was added.
- No remote calls, telemetry, licensing, external assets, or Pro locks were added.

## WooCommerce Safety Notes

- No WooCommerce zones or methods were created, updated, deleted, adopted, or touched.
- The audit recommends continuing to route supported writes through preview/apply revalidation.
- Manual and unknown zones remain protected.

## WordPress.org Compliance Notes

- Docs avoid unsupported claims and keep future features clearly future.
- No external assets, remote dependencies, upsells, obfuscation, licensing, or tracking were added.

## Checks Run

- `git diff --check`
- `git status --short --untracked-files=all`

No PHP, npm, Composer, lint, typecheck, or build checks were required because only docs/report files changed.

## Check Results

- `git diff --check`: passed.
- `git status --short --untracked-files=all`: showed only the three expected new docs/report files before staging.
- No PHP, npm, Composer, lint, typecheck, or build checks were run because no product code changed.

## Known Risks

- This audit recommends UX changes but does not implement them.
- The next implementation should avoid accidentally adding a new direct write path and should reuse the existing preview/apply backend.
- If the Lovable output returns unsupported controls, those controls must be removed or clearly marked future before implementation.

## Blockers

- `.agents/skills/` is missing despite `AGENTS.md` referencing it. Repo-local `.agents/skills/` was present and used.
- `main` and `origin/main` do not contain TASK-010 commit `d1f3dd5`; safe sync should happen by fast-forward or PR/merge, not history rewrite.

## Next Recommended Task

TASK-010B: implement the Shipping Zones daily price-update UX rework using the existing preview/apply backend only. The scope should include clearer old-to-new price states, a focused `Review & apply` flow, reduced Generator prominence, and hidden unsupported enable/disable controls.

## Commit Hash

Pending until commit. The final commit hash is recorded in the task closeout response.
