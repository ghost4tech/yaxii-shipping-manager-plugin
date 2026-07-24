# Task title
WordPress.org contributor metadata fix for plugin release metadata

# Date
2026-07-24

# Goal
Fix the readme contributor metadata to match the submitting WordPress.org username and rebuild a clean release archive.

# Scope
- Update `readme.txt`:
  - `Contributors: ghost4tech`
- Keep plugin name and slug unchanged.
- Rebuild and verify the release folder and zip.
- Run package hygiene checks.
- Attempt Plugin Check.

# Files changed
- `readme.txt`

# Files created
- `release/yaxii-shipping-manager.zip` (generated release artifact)
- `.agents/progress/yaxii-shipping-manager/TASK-UPDATE-WPORG-CONTRIBUTOR-METADATA.md`

# What was before
- `readme.txt` had `Contributors: yaxii` while submitting username is `ghost4tech`.
- Existing release zip in prior state did not include the updated contributor metadata after edits.

# What changed
- Updated `readme.txt` to:
  - `Contributors: ghost4tech`
- Rebuilt `release/yaxii-shipping-manager` into `release/yaxii-shipping-manager.zip` from updated source state.

# What still remains mocked
- None introduced by this task.

# Security notes
- No code paths or runtime behavior changed.
- No new data collection or network behavior.

# WooCommerce safety notes
- No WooCommerce-related code changes were made.

# WordPress.org compliance notes
- Plugin name preserved: `Yaxii Shipping Manager`.
- Slug/text domain preserved: `yaxii-shipping-manager`.
- Header version confirmed as `1.0.0`.
- Readme stable tag confirmed as `1.0.0`.
- Contributor metadata now matches submitting username.

# Checks run
- `rg -n "^Contributors:|^Stable tag:" readme.txt`
- `rg -n "^Version:|YAXII_SHIPPING_MANAGER_VERSION" yaxii-shipping-manager.php`
- Release readme extraction from zip and metadata search via `tar -xOf`.
- Release archive hygiene scan via `tar -tf` for forbidden entries.
- `wp plugin check . --allow-root` (blocked by environment).
- `git diff --check -- readme.txt`

# Check results
- Source readme: `Contributors: ghost4tech`, `Stable tag: 1.0.0`.
- Plugin header: `Version: 1.0.0` unchanged.
- Release readme in zip: `Contributors: ghost4tech`, `Stable tag: 1.0.0`.
- Hygiene scan: PASS (no `.agents`, `.tmp`, `docs`, `node_modules`, `.git`, `.map` entries).
- Plugin Check: failed in environment (database connection/CLI availability issue).
- Git diff check: no whitespace errors.

# Known risks
- Plugin Check could not execute fully in this environment.

# Blockers
- Plugin Check requires a functional WordPress CLI environment with database connectivity and/or plugin check subcommand availability.

# Next recommended task
- Re-run `wp plugin check . --format=txt --allow-root` in a fully configured WP-CLI + DB environment before submission.

# Commit hash
e39e5d1
