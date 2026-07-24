# Task title
Update WordPress.org owner contributor metadata to official Yaxii identity

# Date
2026-07-24

# Goal
Set the README contributor metadata to include the official WordPress.org owner account while keeping release identity and behavior unchanged.

# Scope
- Update `readme.txt` contributor line to `Contributors: yaxii, ghost4tech`.
- Keep plugin name, slug/text domain, plugin version, and stable tag unchanged.
- Rebuild the release folder and zip after the metadata change.
- Verify release zip contributor metadata and perform package hygiene checks.
- Attempt Plugin Check if available in the environment.

# Files changed
- `readme.txt`

# Files created
- `release/yaxii-shipping-manager.zip` (rebuilt release artifact)
- `.agents/progress/yaxii-shipping-manager/TASK-UPDATE-WPORG-OWNER-CONTRIBUTOR-METADATA.md`

# What was before
- `readme.txt` had `Contributors: ghost4tech`.
- Existing release zip was still based on previous readme content from `HEAD`.

# What changed
- Updated source readme contributor line to `Contributors: yaxii, ghost4tech`.
- Rebuilt release folder via `rebuild-release` flow and refreshed `release/yaxii-shipping-manager.zip`.
- Confirmed source and release readme both contain:
  - `Contributors: yaxii, ghost4tech`
  - `Stable tag: 1.0.0`
- Confirmed plugin metadata still `Version: 1.0.0` in `yaxii-shipping-manager.php`.

# What still remains mocked
- No runtime behavior or product feature changes were introduced.

# Security notes
- No code path behavior changes.
- No runtime or transport changes.

# WooCommerce safety notes
- No WooCommerce code or schema changes in this task.

# WordPress.org compliance notes
- Plugin name remains `Yaxii Shipping Manager`.
- Slug/text domain remains `yaxii-shipping-manager`.
- Version remains `1.0.0`.
- Stable tag remains `1.0.0`.

# Checks run
- `Select-String -Path readme.txt -Pattern "^Contributors:|^Stable tag:"`
- `tar -xOf release/yaxii-shipping-manager.zip "yaxii-shipping-manager/readme.txt"`
- `Select-String -Path yaxii-shipping-manager.php -Pattern "Version:"`
- Package zip scan against hidden/internal/prohibited entries:
  - `.agents`, `docs`, `node_modules`, `.tmp`, `.git`, `.codex`, `.github`, `release`, `data/sources`, `*.map`, etc.
- `wp plugin check . --allow-root`

# Check results
- Source readme: `Contributors: yaxii, ghost4tech`, `Stable tag: 1.0.0`.
- Release zip readme: `Contributors: yaxii, ghost4tech`, `Stable tag: 1.0.0`.
- Plugin header: `Version: 1.0.0`.
- Package hygiene: PASS.
- Plugin Check: Blocked by environment (`Error establishing a database connection.`).

# Known risks
- Release zip was rebuilt from repository source and then refreshed from working readme, so release hygiene depends on the current packaging script behavior in the environment.

# Blockers
- Plugin Check could not complete due database connectivity issue in the local WP-CLI environment.

# Next recommended task
- Re-run `wp plugin check . --allow-root` after provisioning a usable WordPress database context for authoritative plugin review.

# Commit hash
TBD (set after commit)
