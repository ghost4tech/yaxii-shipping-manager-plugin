# Dataset Runtime Contract

## Current Position

Yaxii Shipping Manager stores copied upstream source data separately from normalized runtime datasets.

Raw upstream source:

- `data/sources/s450r1-algeria-cities-2025/README.md`
- `data/sources/s450r1-algeria-cities-2025/cities.json`
- `data/sources/s450r1-algeria-cities-2025/SOURCE.md`

Runtime PHP reads only `data/algeria/`.

## Dataset Modes

### Current

Files:

- `data/algeria/current/metadata.json`
- `data/algeria/current/wilayas.json`
- `data/algeria/current/communes.json`

Metadata:

- Mode: `current`
- Version: `current-candidate-2025`
- Complete: `true`
- Verified: `false`
- Wilaya rows: derived from metadata
- Commune rows: derived from metadata

The current dataset is normalized candidate data and is not independently verified as official administrative truth.

### Legacy 58-Compatible Dataset

Files:

- `data/algeria/legacy-58/metadata.json`
- `data/algeria/legacy-58/wilayas.json`
- `data/algeria/legacy-58/communes.json`

Legacy mode is available as:

```text
Legacy 58-compatible dataset
```

It is generated from the current normalized dataset by filtering wilaya codes `01` through `58` and including communes whose `wilaya_code` is in that range.

It is derived from user-verified first 58 records of the current normalized dataset. It is not independently verified as official/legal administrative truth.

## Commands

Normalize runtime datasets:

```bash
node tools/normalize-s450r1-dataset.mjs
```

Validate runtime datasets:

```bash
node tools/validate-normalized-dataset.mjs
```

Validate the copied source:

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
- `wilaya_code=01`

Default behavior uses `mode=current&include=wilayas`.

The endpoint uses the same permission policy as bootstrap:

- WooCommerce active: `manage_woocommerce`
- WooCommerce inactive: `manage_options`

No dataset endpoint writes to WordPress, WooCommerce, or the filesystem.

## Mode-Aware Consumers

The active settings `datasetMode` is used by:

- Admin dataset loading
- Generator dataset selector
- Generator preview request
- Preview planner
- Diagnostics coverage
- WooCommerce Algeria states registration

Legacy mode should not report additional current-dataset wilayas as missing.

## Frontend Rule

The admin app must fetch dataset rows through REST.

Do not import these files directly into React:

- `data/sources/s450r1-algeria-cities-2025/cities.json`
- `data/algeria/current/wilayas.json`
- `data/algeria/current/communes.json`
- `data/algeria/legacy-58/wilayas.json`
- `data/algeria/legacy-58/communes.json`

The source dataset and normalized JSON must not be bundled into `assets/admin/*.js`.

## MVP Boundary

Communes are reference/mapping data in this phase. WooCommerce zones remain wilaya-level.

This dataset work does not implement:

- CSV import/export backend
- Commune-level checkout pricing
- Provider imports
- YSF sync
- Manual-zone adoption
