# TASK-014E: Manual WooCommerce Zone Support and Adoption Audit

Date: 2026-07-03

## Goal

Audit whether and how Yaxii Shipping Manager should support manually created WooCommerce shipping zones, without implementing product changes.

## Git state

- Working directory: `C:\Users\Aymen\Local Sites\yaxii-ysz\app\public\wp-content\plugins\yaxii-shipping-manager`
- Git repository: yes, root is the plugin root.
- Starting branch: `task/014d-prevent-duplicate-generation-external-zone-statuses`
- Task branch: `task/014e-manual-zone-support-adoption-audit`
- TASK-014C commit `5e30a8e` exists locally.
- TASK-014D latest commit `5579656` exists locally.
- No nested `app/.git` repository was found.
- Pre-existing unrelated dirty files were present before this task and were not staged.

## Scope

Included:

- Audit current manual-zone behavior.
- Evaluate manual-zone product models.
- Recommend MVP and future adoption policy.
- Document adoption risks and required safety checks.
- Audit manual method management.
- Audit Yaxii COD Theme zones separately.
- Define MVP UX and future adoption waves.
- Create documentation and progress report only.

Excluded:

- Product code changes.
- Runtime asset changes.
- Yaxii COD Theme changes.
- Server writes or deployment.
- WooCommerce zone, method, or option writes.
- `yaxii_zone_map` writes.
- SafeApplyEngine changes.
- Generator behavior changes.
- Shipping Editor behavior changes.
- Adoption, conversion, delete, merge, CSV backend, provider imports, YSF sync, commune-level pricing, telemetry, licensing, Pro locks, remote assets, external fonts, or hidden calls.

## Docs/audits read

- `AGENTS.md`
- `CLAUDE.md`
- `.agents/skills/clean-code-guard/SKILL.md`
- `.agents/skills/docs-guard/SKILL.md`
- `.agents/skills/woo-guard/SKILL.md`
- `.agents/skills/wp-guard/SKILL.md`
- `.agents/skills/wp-rest-api/SKILL.md`
- `.agents/skills/wp-plugin-directory-guidelines/SKILL.md`
- `docs/YAXII-COD-COMPATIBILITY-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014C-yaxii-cod-readonly-compat-diagnostics.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014D-prevent-duplicate-generation-external-zone-statuses.md`
- `docs/SHIPPING-ZONES-TABLE.md`
- `docs/GENERATOR-WIZARD.md`
- `docs/RUNTIME-SMOKE.md`
- `docs/APPLY-ENGINE.md`
- `docs/APPLY-CONTRACT.md`
- `docs/PREVIEW-PLANNER.md`
- `docs/RESET-AND-CLEANUP-TOOL-PLAN.md`

## Files inspected

- `src/WooCommerce/ShippingDiagnosticsService.php`
- `src/WooCommerce/ShippingZoneReader.php`
- `src/WooCommerce/YaxiiCodCompatibilityDetector.php`
- `src/Apply/ManagedZoneRegistry.php`
- `src/Apply/SafeApplyEngine.php`
- `src/Preview/PreviewPlanner.php`
- `src/Apply/ApplyReadinessEvaluator.php`
- `admin-app/src/components/shipping-zones/`
- `admin-app/src/components/diagnostics/`
- `admin-app/src/components/generator/`
- `admin-app/src/lib/generator/diagnostics-guidance.ts`
- `admin-app/src/lib/shipping-zones/status.ts`
- `admin-app/src/types/shipping-zones.ts`

## Files changed

- `docs/MANUAL-ZONE-SUPPORT-ADOPTION-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014E-manual-zone-support-adoption-audit.md`

## Files created

- `docs/MANUAL-ZONE-SUPPORT-ADOPTION-AUDIT.md`
- `.agents/progress/yaxii-shipping-manager/TASK-014E-manual-zone-support-adoption-audit.md`

## What was before

TASK-014D clarified that manual WooCommerce zones show as `Manual WooCommerce zone`, remain read-only, expose only Diagnostics and WooCommerce-zone navigation, and have no edit/adopt/convert/delete/merge workflow.

Manual-zone support beyond read-only visibility was explicitly deferred to TASK-014E.

## What changed

Created a documentation-only audit that recommends keeping manual WooCommerce zones read-only for the WordPress.org MVP and reserving adoption for a future explicit, preview-first migration feature.

## What still remains mocked or not implemented

- Manual-zone adoption is not implemented.
- Manual-zone edit controls are not implemented.
- Manual flat-rate price edits without adoption are not implemented.
- Manual method enable/disable controls are not implemented.
- Manual zone rename/delete/merge/convert workflows are not implemented.
- Yaxii COD Theme bridge/conversion is not implemented.
- `yaxii_zone_map` synchronization is not implemented.
- CSV backend remains not implemented.
- Provider imports remain not implemented.
- YSF Sync remains future/disabled informational scope.
- Commune-level pricing remains not implemented.

## Current manual-zone behavior

- Detection: ordinary manual zones are inferred when a WooCommerce zone overlaps Algeria coverage but is not in `yaxii_shipping_manager_managed_zones` and does not have a Yaxii ownership hint.
- Shipping Editor: manual rows show `Manual WooCommerce zone`, read-only details, and only `Review Diagnostics` / `Open WooCommerce zones`.
- Diagnostics: advanced details list zones and ownership hints; manual or unknown zones stay protected.
- Generator: manual zones can trigger protected warnings and are skipped or blocked for affected selected wilayas.
- PreviewPlanner: manual zones are returned in `skipManualZones` as protected skips.
- SafeApplyEngine: only accepts `managed_registry` create/add/update/status work and cannot update manual zones.
- Removal: manual zones are protected and not removal candidates.

## Product models evaluated

- Model 1, read-only forever for MVP: recommended for MVP.
- Model 2, read-only now and adoption later: recommended future direction.
- Model 3, manage manual zones without adoption: rejected as unsafe.
- Model 4, adopt manual zones into Yaxii registry: possible future feature only.
- Model 5, duplicate-safe recreate only: acceptable MVP fallback path through WooCommerce-managed cleanup, not automated by YSM.

## Recommended MVP model

Manual WooCommerce zones should remain protected and read-only for the initial WordPress.org MVP. Yaxii Shipping Manager may show them, count them, explain skipped/blocked behavior, and link to WooCommerce zones. It should not edit, adopt, convert, merge, rename, delete, repair, or register them.

## Future adoption model

Future adoption should be a separate explicit wizard with a read-only dry-run endpoint, candidate/blocked zones, method mapping, typed confirmation, preview hash, stale-preview protection, immediate WooCommerce re-read, and reporting.

## Adoption risks

Future adoption must verify state-specific Algeria coverage, normalized wilaya match, no duplicate YSM/theme/external coverage, supported method types, readable method labels/costs/enabled state, explicit method mapping, no unsupported plugin/provider methods unless left untouched, registry writes only after verification, no hidden delete/merge, typed confirmation, preview hash/stale-preview protection, and rollback/reporting.

## Manual method management recommendation

Do not edit manual-zone methods unless the zone and specific method instances have first been adopted through an explicit adoption flow. Multiple flat rates, custom labels, non-flat-rate methods, free shipping, local pickup, conditional shipping, provider methods, and checkout/theme dependencies make unaudited manual method edits unsafe.

## Yaxii COD Theme zone recommendation

Yaxii COD Theme zones are theme-owned or external Yaxii zones, not ordinary manual zones. They should stay read-only in the MVP, should not be adopted or converted, and YSM should not write to `yaxii_zone_map`. A bridge-only future path requires a separate Yaxii COD Theme compatibility audit.

## Proposed MVP UX

- Shipping Editor: keep `Manual WooCommerce zone`; consider using `Protected zones` for aggregate counts/filters when manual, theme, and external rows are grouped.
- Row details: show zone name, matched wilaya, method labels, costs, enabled state, and ownership hint when readable.
- Actions: only `Review Diagnostics` and `Open WooCommerce zones` for manual rows.
- Generator: preselect only safe missing non-overlapping wilayas; skip or block manual-covered wilayas; keep preview-only review available.
- Diagnostics: add/keep clear manual-zone protection wording and advanced support details.
- Removal tool: show protected manual count and never remove manual zones.

## Future implementation waves

1. Adoption audit proof and runtime smoke design.
2. Adoption dry-run endpoint.
3. Adoption UI preview.
4. Adoption execution with typed confirmation.
5. Restore, rollback, and reporting.
6. Yaxii COD Theme bridge compatibility after a separate bridge audit.

## WordPress.org release recommendation

For initial WordPress.org release:

- Manual zones remain read-only.
- Adoption remains hidden.
- Copy can say manual zones are protected now, but should not promise an adoption date.
- Screenshots/readme may mention manual zones only as protected/read-only.
- Do not claim manual-zone management, adoption, automatic migration, or Yaxii COD Theme checkout bridge support.

## What should not be implemented yet

- Manual-zone adoption, edit, rename, delete, merge, or convert flows.
- Manual method price or enabled-state writes.
- Yaxii COD Theme conversion or bridge.
- `yaxii_zone_map` writes.
- Provider imports, CSV backend, YSF sync, commune-level pricing, telemetry, licensing, Pro locks, remote assets, external fonts, or hidden calls.

## Security notes

- Documentation-only task.
- No new REST routes, nonce/capability paths, option writes, remote calls, telemetry, tracking, licensing, obfuscation, or external assets were added.
- Future adoption is recommended only with REST nonce and capability checks plus typed confirmation.

## WooCommerce safety notes

- No WooCommerce writes were performed.
- No manual zones or methods were edited, adopted, converted, deleted, merged, or registered.
- The audit keeps current registry-owned-only apply behavior as the MVP policy.

## WordPress.org compliance notes

- The recommendation is local-first, transparent, and conservative.
- The audit avoids unverifiable release claims.
- Adoption, Pro locks, licensing, telemetry, remote calls, and hidden integrations are not recommended for MVP.

## Checks run

- `git diff --check`
- `git diff --cached --check`
- `git status --short --untracked-files=all`

No build was required because no product code or runtime assets changed.

## Check results

- `git diff --check`: passed. Git printed existing line-ending normalization warnings for unrelated dirty files already present in the worktree.
- `git diff --cached --check`: passed for the staged TASK-014E documentation files.
- `git status --short --untracked-files=all`: passed. It showed the two new TASK-014E files plus pre-existing unrelated dirty/untracked files that were not staged.
- Build/typecheck/lint: not run because this was documentation-only and no PHP, TypeScript, runtime asset, or package file changed.

## Known risks

- Current UI/reporting sometimes uses `manual` wording for a broader protected set that includes manual, theme, and external zones. This is a copy risk, not a write-safety risk.
- Country-level Algeria manual zones need a separate high-risk policy before any adoption feature.
- Future adoption would require runtime smoke on disposable stores with varied shipping method mixes.

## Blockers

None for this documentation-only audit.

## Next recommended task

TASK-014F: tighten protected-zone release copy and documentation wording, especially replacing ambiguous `Manual zones` aggregate labels with `Protected zones` where the UI includes manual, theme, and external protected rows.

## Commit hash, if committed

Final commit hash is reported in the task closeout.
