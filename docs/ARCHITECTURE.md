# Yaxii Shipping Manager — Architecture Notes

## Principle

Read first. Preview second. Write last.

WooCommerce shipping zones are store configuration. A bad write engine can break checkout. The plugin must never write to WooCommerce shipping zones until diagnostics and preview planning exist.

## Layers

1. WordPress Plugin Shell

- Bootstrap file
- Plugin constants
- Service registration
- Admin page
- Asset enqueue
- WooCommerce dependency guard

2. React Admin App

- Static Vite build
- Mounted inside one wp-admin page
- Hash or wp-admin-safe routing
- REST API client
- No SSR dependency
- No remote assets
- No Lovable telemetry

3. REST API

- Bootstrap endpoint
- Dataset endpoint
- Settings endpoint
- Diagnostics endpoint
- Preview endpoint
- Apply endpoint later

4. Dataset Layer

- Current Algeria dataset
- Legacy 58-compatible dataset mode
- Communes/cities dataset
- Dataset versioning
- UTF-8 Arabic/French names
- Validation tools
- No "68 wilayas" wording
- No delegated or provider-specific row treated as official unless verified

5. WooCommerce Read Layer

- Read zones
- Read zone methods
- Detect manual zones
- Detect Yaxii-managed zones
- Detect duplicates/conflicts
- Simulate checkout availability

6. Preview Planner

- Compare intended config with current Woo state
- Generate create/update/skip/conflict plan
- No writes

7. Apply Engine

- Applies only previewed plans
- Requires confirmation
- Skips manual zones by default
- Logs results
- Reports partial failures

## Ownership Model

Yaxii-managed zones must be detectable.

Preferred ownership markers:

- Stored plugin option mapping wilaya code to Woo zone/method IDs
- Zone naming convention
- Method title convention
- Future internal metadata if WooCommerce safely supports it

Manual zones are never overwritten by default.

## Data Storage

Small plugin settings:

- WordPress options
- autoload false for larger config

Diagnostics snapshots:

- transient/cache if needed

Logs:

- lightweight option or custom storage only when justified

No custom tables in MVP unless a later task proves they are necessary.

## Security

All REST endpoints require permission callbacks.

Read endpoints:

- manage_woocommerce or manage_options

Write endpoints:

- manage_woocommerce
- REST nonce
- explicit confirmation payload
- preview plan reference or payload validation

All request data:

- unslash
- sanitize
- validate

All output:

- escape late

## WooCommerce Safety

Use WooCommerce APIs/classes. Do not use raw SQL for zone writes.

Money:

- sanitize as decimal
- no float equality
- no hardcoded currency formatting

Checkout:

- Support native WooCommerce shipping zone behavior first.
- Do not modify checkout fields in MVP unless explicitly scoped.

## WordPress.org Rules

No telemetry.
No external CDN.
No hidden remote calls.
No licensing in free MVP.
No fake Pro locks.
No product marketplace in MVP.
No obfuscation.
No dashboard spam.
No misleading claims.

## Removed From MVP

- Products page
- Automations
- Multi-country switcher
- Pro locks
- Lovable error reporting
- Provider APIs
- Full YSF sync
- Commune-level pricing engine
- Dangerous reset actions
