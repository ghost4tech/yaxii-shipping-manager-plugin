# Dataset Runtime Contract

## Current Position

Yaxii Shipping Manager stores the copied upstream S450R1 source separately from the normalized runtime dataset.

Raw upstream source:

- `data/sources/s450r1-algeria-cities-2025/README.md`
- `data/sources/s450r1-algeria-cities-2025/cities.json`
- `data/sources/s450r1-algeria-cities-2025/SOURCE.md`

Normalized runtime data:

- `data/algeria/current/metadata.json`
- `data/algeria/current/wilayas.json`
- `data/algeria/current/communes.json`
- `data/algeria/legacy-58/metadata.json`

Runtime PHP code reads only `data/algeria/`. It must not read from `data/sources/`.

## Current Mode

The current mode is generated from the S450R1 candidate source into the Yaxii-owned schema.

Current metadata:

- Mode: `current`
- Version: `current-candidate-2025`
- Complete: `true`
- Verified: `false`
- Wilaya rows: `69`
- Commune rows: `1541`

The dataset is complete as normalized candidate data, but it is not independently verified as official administrative truth. UI and docs must keep this distinction.

## Legacy 58 Mode

Legacy compatibility is represented only by metadata:

- `mode`: `legacy_58`
- `available`: `false`
- `complete`: `false`
- `verified`: `false`

Do not guess a 58-row mapping. Populate legacy mode only after an auditable mapping or cross-source comparison is implemented.

## Commands

Normalize from the raw S450R1 source:

```bash
node tools/normalize-s450r1-dataset.mjs
```

Validate the normalized runtime dataset:

```bash
node tools/validate-normalized-dataset.mjs
```

The source import validator remains:

```bash
node tools/validate-s450r1-source.mjs
```

## REST Contract

Read-only dataset endpoint:

```text
GET /wp-json/yaxii-shipping-manager/v1/dataset
```

Supported query parameters:

- `mode=current|legacy_58`
- `include=summary|wilayas|communes`
- `wilaya_code=01` for filtering communes when `include=communes`

Default behavior uses `mode=current&include=wilayas`.

The endpoint uses the same permission policy as bootstrap:

- WooCommerce active: `manage_woocommerce`
- WooCommerce inactive: `manage_options`

No dataset endpoint writes to WordPress, WooCommerce, or the filesystem.

## Frontend Rule

The admin app must fetch dataset rows through REST.

Do not import these files directly into React:

- `data/sources/s450r1-algeria-cities-2025/cities.json`
- `data/algeria/current/wilayas.json`
- `data/algeria/current/communes.json`
- `data/algeria/current/metadata.json`

The full source dataset and normalized JSON must not be bundled into `assets/admin/*.js`.

## MVP Boundary

Communes are reference/mapping data in this phase.

Do not implement commune-level checkout pricing in the MVP unless a real WooCommerce custom shipping method is explicitly scoped.

This dataset work does not implement:

- WooCommerce diagnostics
- Preview planner
- Safe apply engine
- CSV import/export backend
- YSF sync
- WooCommerce shipping-zone writes
