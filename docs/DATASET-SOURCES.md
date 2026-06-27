# Dataset Sources

## Primary Candidate Source

Yaxii Shipping Manager uses `S450R1/algeria-cities-2025` as the primary candidate source for TASK-002A dataset hardening.

- Repository: https://github.com/S450R1/algeria-cities-2025.git
- Copied source commit: `ba0cd7d5aeb9aec54fcde69c073f9dfc34f94de2`
- Local copied files:
  - `data/sources/s450r1-algeria-cities-2025/README.md`
  - `data/sources/s450r1-algeria-cities-2025/cities.json`
  - `data/sources/s450r1-algeria-cities-2025/SOURCE.md`

## License Decision

The upstream README says: "Public domain. Use it however you want."

Public-domain source material is acceptable as candidate data for a GPL-compatible WordPress.org plugin, provided the provenance is preserved and the plugin does not add restrictions around the copied data. This task records the source URL, commit hash, copied files, and upstream license statement in `SOURCE.md`.

## Why This Is Candidate Data

The source provides Algeria wilaya and commune records in a local JSON file with Arabic and Latin names. The copied JSON parses as UTF-8, includes metadata fields, and contains `wilayas` and `communes` arrays.

This task does not claim final official verification. The source is treated as candidate data until the project normalizes it into a Yaxii schema and validates labels, counts, delegated areas, and compatibility behavior.

## What Still Needs Normalization

- Convert the source field names into a stable Yaxii dataset schema.
- Decide how current dataset identifiers are represented in plugin settings.
- Decide how the legacy 58-compatible dataset maps or filters records.
- Keep source provenance separate from normalized runtime data.
- Add version metadata owned by Yaxii Shipping Manager.
- Decide whether commune records are shipped as reference data, backend-only data, or a separately loaded admin asset.

## Normalized Runtime Dataset

TASK-002B generates the Yaxii-owned runtime dataset under `data/algeria/`.

- Current runtime metadata: `data/algeria/current/metadata.json`
- Current runtime wilayas: `data/algeria/current/wilayas.json`
- Current runtime communes: `data/algeria/current/communes.json`
- Legacy placeholder metadata: `data/algeria/legacy-58/metadata.json`

See `docs/DATASET.md` for the runtime REST contract and frontend bundling rules.

## Frontend Bundling Rule

The full source JSON should not be bundled into `assets/admin/*.js`. It is larger than the admin UI needs at initial load and should stay as dataset source material until a backend or build step creates the exact runtime payload required by the UI.

## Legacy Dataset Warning

The legacy mode should be described as `Legacy 58-compatible dataset`. It still needs a mapping/filtering decision and must not be presented as the current official dataset.

Do not use "68 wilayas" wording. Current UI copy should say `Current Algeria dataset` and `Legacy 58-compatible dataset`.
