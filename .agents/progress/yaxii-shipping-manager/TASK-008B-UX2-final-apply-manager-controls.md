# TASK-008B-UX2 - Final Apply UX Cleanup and Shipping Manager Controls Audit

Date: 2026-06-28

## Goal

Clean up the final wizard Preview/Apply step into a simple merchant action screen, and audit/fix confusing Shipping Zones controls so the plugin does not feel broken.

## Scope

- Frontend UX only.
- No PHP, REST schema, or WooCommerce write-engine changes.
- No existing method price or label updates.
- No zone/method deletes.
- No manual-zone adoption or manual-zone writes.
- No CSV backend, commune-level pricing, provider imports, YSF sync, telemetry, licensing, Pro locks, external assets, or remote calls.

## Problem fixed

The final wizard step still showed too many technical/status surfaces for merchants, and the Shipping Zones screen had draft-only controls that looked like they might update WooCommerce.

## Files changed

- `admin-app/src/components/generator/GeneratorWizard.tsx`
- `admin-app/src/components/generator/PreviewPlanPanel.tsx`
- `admin-app/src/routes/index.tsx`
- `assets/admin/.vite/manifest.json`
- `assets/admin/assets/main-C_AWwjNt.js`
- `assets/admin/assets/main-Dgo52jlk.css`
- `docs/APPLY-WORKFLOW.md`
- `docs/GENERATOR-WIZARD.md`

Deleted old build artifacts:

- `assets/admin/assets/main-C4BS0DjA.js`
- `assets/admin/assets/main-wxc6Zwx8.css`

Untracked and not staged:

- `.agents/references/yaxii-shipping-hub-03/`

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-008B-UX2-final-apply-manager-controls.md`

## What was before

- The final wizard step showed metric tiles, setup cards, safety cards, apply cards, duplicate diagnostics entry points, and technical-feeling copy.
- Empty/safe previews could say `No safe apply changes found`.
- Unsupported update-only previews looked blocked instead of clearly saying the next task will handle updates.
- Preview-only setup mode still displayed the normal apply path.
- Shipping Zones controls changed local draft state but did not make that boundary obvious.

## What changed

## Final step UX changes

- Replaced the final step with one main status/action card and one short setup summary.
- Added merchant-facing final states:
  - `ready_to_apply`: `Ready to prepare shipping`
  - `setup_already_created`: `Shipping setup already exists`
  - `updates_pending_next`: `Setup exists. Updates are coming next.`
  - `blocked`: `Needs review before applying`
- Apply checkbox copy is now `I reviewed this setup`.
- Safety copy is short: `Manual zones will not be touched. No deletes will be made.`
- `Check diagnostics` appears once inside the main action card.
- `View affected wilayas` and `Advanced details` remain collapsed.
- Preview hash, contract version, generated timestamp, raw groups, zone IDs, and method keys stay out of the main view.
- Final footer button was renamed from `Use draft and close` to `Done`.

## Setup mode behavior changes

- Fresh setup copy now says `Create a new shipping setup for selected wilayas.`
- Continue existing setup copy now says Yaxii adds only missing managed zones or methods and protects manual zones.
- Preview changes mode now hides the apply action and shows: `Preview-only mode. Switch setup mode if you want to apply changes.`
- The final step badge reflects the selected setup mode instead of always saying preview-only.

## Shipping Manager controls audit

Control classification after audit:

- Shipping Zones price inputs: draft/local only.
- Bulk price action: draft/local only.
- Percent adjustment: draft/local only.
- Free shipping action: draft/local only.
- Disable/enable method and row actions: draft/local only.
- Settings `Save settings`: functional settings persistence only; does not update WooCommerce zones or existing methods.
- CSV import/export buttons: coming soon / not implemented and disabled.

## Controls fixed/disabled/marked coming soon

- Added a `Local draft controls only` notice to Shipping Zones.
- Renamed selected-row controls:
  - `Set local price` to `Apply draft price`
  - `Adjust local` to `Preview draft %`
  - `Make free` to `Mark free in draft`
  - `Disable method` to `Disable in draft`
  - `Enable rows` / `Disable rows` to draft-specific labels
- Per-cell controls now say `Add draft method`, `Draft off`, and `Free draft`.
- The confirmation dialog now says `Update local draft only?` and `Update draft only`.
- Bulk price parsing now accepts zero/free values for local draft updates.

## What still remains mocked

- Existing method price updates.
- Existing method label updates.
- Existing zone updates.
- Zone and method deletes.
- Manual-zone adoption.
- Manual-zone writes.
- CSV backend.
- Commune-level pricing.
- Provider imports.
- YSF sync.
- Checkout field changes.

## Security notes

- No PHP code changed.
- No REST endpoints or permission callbacks changed.
- No new external assets, tracking, licensing, or remote calls were added.
- Frontend still sends the backend-required apply confirmation phrase only after checkbox confirmation.

## WooCommerce safety notes

- No WooCommerce write path changed.
- Existing allowed writes remain limited to `SafeApplyEngine`.
- Runtime smoke did not run apply or create/update WooCommerce configuration.
- Manual zones remain protected by the existing planner/apply contract.

## WordPress.org compliance notes

- No telemetry, licensing, Pro locks, remote dependencies, obfuscation, external CDN assets, or public-site links were added.
- Copy describes actual behavior and labels unsupported work as coming in a later task.

## Runtime smoke result

LocalWP runtime was available:

- `wp option get siteurl`: `http://yaxii-ysz.local`
- `wp plugin status yaxii-shipping-manager`: active, version `0.1.0`
- `wp plugin status woocommerce`: active, WooCommerce `10.9.1`
- Admin user available through WP-CLI: `dev` user ID `1`

Browser automation blocker:

- `agent-browser open http://yaxii-ysz.local/wp-admin/admin.php?page=yaxii-shipping-manager` failed with a network timeout before any page snapshot.
- No browser UI smoke was claimed.

WP-CLI/REST smoke:

- Internal REST preview as admin user returned `createZones: 0`, `addMethods: 0`, `updateMethods: 0`, `conflicts: 0`, and `canApplyLater: false` for the current fully managed setup.
- Sample checkout zone matching for `DZ:01` returned zone `3`, `Yaxii - 01 Adrar - أدرار`.
- Sample checkout methods still resolve:
  - `Home delivery: 700`
  - `Office delivery: 400`
- Zone `3` still has exactly 2 shipping methods, so the smoke did not create duplicates.
- WooCommerce zone count stayed at 69.

## QA guard findings

- `clean-code-guard`: pass. Removed confusing duplicated UI surfaces without adding fake success paths or new abstractions.
- `docs-guard`: pass. Updated docs describe actual frontend behavior and keep unsupported updates scoped to TASK-008C.
- `wp-guard`: pass. No PHP, WordPress output, request handling, or capability behavior changed.
- `wp-rest-api`: pass. No REST route or schema changed.
- `woo-guard`: pass. No WooCommerce write path changed; existing writes remain in `SafeApplyEngine`.
- `wp-plugin-directory-guidelines`: pass. No WordPress.org-risky monetization, tracking, remote dependency, or obfuscation added.
- Required `.agent/skills/` path was missing. Existing repo-local `.agents/skills/` was used instead.

## Checks run

- `npm run typecheck` in `admin-app`
- `npm run lint` in `admin-app`
- `npm run build` in `admin-app`
- Source map scan under `assets/admin`
- Forbidden string scan over `src`, `admin-app/src`, `assets/admin`, and changed docs
- Raw dataset bundling scan over built admin assets
- WooCommerce write scan over `src`
- WP-CLI LocalWP runtime smoke
- `git diff --check`
- `git status --short --untracked-files=all`

## Check results

- `npm run typecheck`: pass.
- `npm run lint`: pass with 8 pre-existing fast-refresh warnings in shared UI files.
- `npm run build`: pass.
- Source map scan: pass, no `.map` files under `assets/admin`.
- Targeted forbidden string scan: pass over production/admin source, built assets, and changed docs.
- Full docs forbidden string scan: existing policy docs still mention banned terms as prohibitions; no new production/UI hit was added.
- Raw dataset bundling scan: pass, no hits.
- WooCommerce write scan: pass. Allowed existing writes only in settings persistence, registry persistence, and `SafeApplyEngine`; no delete calls or existing-method update path found.
- `git diff --check`: pass.
- PHP checks: not run because no PHP files changed.
- `composer dump-autoload`: not run because no PHP/autoload files changed.

## Known risks

- Browser smoke is blocked by `agent-browser` network timeout against the LocalWP host.
- The local smoke store is already fully managed from TASK-008A/TASK-008B testing, so the runtime preview exercised the setup-already-created path rather than a fresh missing-work path.
- UI state derivation is frontend-only; backend readiness state names remain unchanged.

## Blockers

- Automated browser UI smoke could not be completed because `agent-browser` could not reach `yaxii-ysz.local`.

## Next recommended task

TASK-008C: implement safe updates for existing Yaxii-managed method labels/prices with registry reconciliation and a controlled runtime smoke.

## Commit hash

Recorded in the final task response. The final commit hash cannot be embedded in the same committed report without changing that hash.
