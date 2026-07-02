# Release Packaging

Yaxii Shipping Manager is developed from a repository root that includes agent reports, local reference material, source tooling, and Plugin Check output. Run WordPress.org Plugin Check against a clean package, not the development folder.

## Package Strategy

Use `.distignore` when creating the release archive. The package must exclude development-only files:

- `.agents/`
- `.git/` and `.github/`
- `.gitignore` and `.gitattributes`
- `AGENTS.md` and `CLAUDE.md`
- Plugin Check report markdown files
- reference apps under `.agents/references/`
- `node_modules/`
- local logs, temporary files, screenshots, coverage, and source maps
- hidden Prettier and Git ignore files under `admin-app/`

The runtime package should include:

- `yaxii-shipping-manager.php`
- `src/`
- `data/`
- `assets/admin/`
- `vendor/` when Composer dependencies are installed for release
- `languages/`
- `readme.txt`
- GPL-compatible project docs that describe shipped behavior
- `admin-app/` source files when source availability for built admin assets is required by the release process, excluding `node_modules` and hidden dev config

## Build Steps

1. From `admin-app/`, run `npm run build` when admin source or runtime assets changed.
2. Confirm `assets/admin/` contains no source maps unless intentionally approved.
3. From the plugin root, create the archive with a tool that honors `.distignore`.
4. Extract the archive into a clean temporary folder.
5. Run Plugin Check against the extracted package folder.

## Package Smoke

Before release, scan the extracted package for:

- no `.agents`
- no `.git*`
- no `AGENTS.md`
- no `CLAUDE.md`
- no Plugin Check report markdown in the package root
- no reference apps
- no `node_modules`
- no hidden Prettier files
- `readme.txt` exists
- `languages/` exists
- no source maps under `assets/admin`

Official Plugin Check must be run on the clean package before submission.
