# TASK-008B-UX - Simplify Preview and Apply Experience

Date: 2026-06-28

## Goal

Simplify the final Generator Wizard preview/apply experience for merchants and agencies without weakening backend apply safety.

## Problem fixed

The previous final step exposed too much implementation detail in the main flow:

- preview hash
- contract version
- generated timestamp
- zone IDs
- method keys
- raw preview groups
- long visible typed confirmation phrase
- large method-addition row lists
- repeated preview-only copy

The final step now focuses on: what will happen, why it is safe, and one checkbox before apply.

## Files changed

- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/components/generator/PreviewPlanPanel.tsx`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-C4BS0DjA.js`
- `assets/admin/assets/main-wxc6Zwx8.css`
- `docs/APPLY-CONTRACT.md`
- `docs/APPLY-WORKFLOW.md`
- `docs/GENERATOR-WIZARD.md`

Deleted old build artifacts:

- `assets/admin/assets/main-CJt_0NmW.css`
- `assets/admin/assets/main-CmRdVyrB.js`

Untracked and not staged:

- `.agents/references/yaxii-shipping-hub-03/`

## Auto-preview behavior

The wizard now builds a memoized preview request and draft signature. When the user reaches the final step with a valid draft, the wizard automatically calls `/preview` once for that signature.

It calls preview again only when:

- the draft signature changes while on the final step, or
- the user clicks `Refresh preview`.

Loading copy:

> Checking your WooCommerce shipping setup...

The previous main `Preview changes` button is removed from the primary flow.

## Simplified summary behavior

The main preview card now shows merchant-level counts:

- Wilayas selected
- Zones to create
- Methods to add
- Updates later
- Manual zones skipped
- Conflicts
- Enabled methods
- Price summary

The main safety card stays visible:

- Manual zones will not be touched.
- No deletes will be made.
- Yaxii checks WooCommerce again before applying.

## Method grouping behavior

Method additions are grouped by method label and price instead of listing every method row in the main view.

Examples of rendered summaries:

- `Home delivery: 1 wilayas x 700 DZD`
- `Office / Stopdesk: 1 wilayas x 400 DZD`
- If many prices differ, the summary collapses remaining buckets into custom-price copy.

Affected wilayas are behind `View affected wilayas`.

That accordion shows the first 10 rows by default and includes `Show all` / `Show less` when needed. Zone IDs and method keys are not shown there.

## Confirmation behavior

The visible confirmation is now a checkbox:

> I reviewed this setup and understand Yaxii will update WooCommerce shipping zones and methods shown above.

The backend apply contract is unchanged. The frontend still submits:

- `confirmed: true`
- `confirmationText: APPLY YAXII SHIPPING PLAN`

only after the checkbox is checked.

Typed confirmation remains a backend contract field and should be reserved in the UI for future dangerous actions such as deletes, manual-zone adoption, or overwrites.

## Advanced details behavior

Technical details moved to collapsed `Advanced details`:

- Preview hash
- Contract version
- Generated timestamp
- Raw preview groups
- Zone IDs
- Method keys
- Ownership labels
- Planner warnings
- Unsupported update-only items

Main view no longer presents these as primary merchant content.

## Post-apply UX

After apply, the result card now uses compact result copy:

- `Shipping setup updated` when WooCommerce changed.
- `No changes made` when nothing was written.
- Separate counts for zones created and methods added.
- `Manual zones: Not touched`.
- Pending update notice when zone/method updates are still reserved for TASK-008C.

Buttons:

- `Refresh diagnostics`
- `Open WooCommerce zones`
- `Done`

Inside the wizard, `Done` closes the wizard. Outside the wizard's latest-preview panel, `Done` scrolls the admin page back to the top.

## What remains not implemented

- Existing method updates.
- Existing zone updates.
- Deletes.
- Manual-zone adoption.
- Manual-zone writes.
- Commune-level pricing.
- CSV backend.
- Provider imports.
- YSF sync.
- Checkout field changes.
- Typed confirmation UX for future dangerous actions.

## Runtime smoke result

LocalWP runtime worked:

- `wp option get siteurl`: `http://yaxii-ysz.local`
- `wp plugin status yaxii-shipping-manager`: active
- `wp plugin status woocommerce`: active, WooCommerce `10.9.1`

Browser automation blocker:

- No browser automation tool was exposed by tool discovery in this session.
- Local repo does not have Playwright installed.
- `chrome` / `msedge` commands were not available in PATH.

API/runtime smoke through WP-CLI:

- Existing home/office preview for wilaya `18` correctly produced update-only work and was blocked from apply.
- Controlled safe add-method smoke used wilaya `19` with enabled `custom_1`.
- Preview summary: `createZones: 0`, `addMethods: 1`, `updateMethods: 1`, `conflicts: 0`.
- Apply response: `applied: true`, `createdZones: 0`, `createdMethods: 1`, `skippedMethods: 1`.
- Zone `19` method count changed from `2` to `3`.
- Repeat preview no longer proposed the custom method addition: `addMethods: 0`.

No browser smoke was claimed.

## QA guard findings

- `clean-code-guard`: pass. The UX code keeps apply contract behavior intact and removes the visible typed phrase without adding fake success paths.
- `docs-guard`: pass. Updated docs describe actual final-step UI behavior and explicitly state the backend contract remains unchanged.
- `wp-guard`: pass. No PHP or REST permission behavior changed.
- `wp-rest-api`: pass. No endpoint or schema change was made.
- `woo-guard`: pass. No WooCommerce write path changed; existing writes remain in `SafeApplyEngine`.
- `wp-plugin-directory-guidelines`: pass. No remote calls, tracking, licensing, Pro locks, or external assets added.

## Checks run/results

- `npm run typecheck` in `admin-app` - pass.
- `npm run lint` in `admin-app` - pass with 8 existing fast-refresh warnings in shared UI files.
- `npm run build` in `admin-app` - pass.
- No source maps under `assets/admin` - pass.
- Forbidden string scan over production/admin sources, built assets, and changed docs - pass, no hits.
- Raw dataset bundling scan over built admin assets - pass, no hits.
- WooCommerce write scan - pass; existing allowed writes remain in `SafeApplyEngine`, no delete path found.
- `git diff --check` - pass.
- `git status --short --untracked-files=all` - run before report and before commit.

No PHP files changed, so `composer dump-autoload` and `php -l` were not required for this UX-only task.

## Risks

- Browser UX smoke could not be automated in this session because browser tooling was unavailable.
- The local runtime store now has an extra `custom_1` test method on managed wilaya `19` from the controlled smoke.
- Existing method updates still appear as a small pending-update note until TASK-008C implements safe updates.

## Next recommended task

TASK-008C: implement safe updates for existing Yaxii-managed method labels/prices with registry reconciliation, then run browser smoke with available automation or manual confirmation.

## Commit hash

Recorded in the final task response. The final commit hash cannot be embedded in the same committed report without changing that hash.
