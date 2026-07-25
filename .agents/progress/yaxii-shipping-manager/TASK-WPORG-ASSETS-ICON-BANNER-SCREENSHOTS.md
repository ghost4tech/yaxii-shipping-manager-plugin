# TASK-WPORG-ASSETS-ICON-BANNER-SCREENSHOTS — Add WordPress.org Display Assets

Date: 2026-07-25

## Goal

Publish the user-supplied logo, cover, and screenshot images to the WordPress.org SVN `assets/` folder (plugin directory display assets: icon, banner, screenshots) with WordPress.org-compliant filenames and dimensions.

## Scope

SVN display-assets only. No plugin code, version, or runtime behavior changed. `readme.txt`'s `== Screenshots ==` captions were corrected to match the actual screenshot content (see below).

## Source files (user-provided)

Found untracked in the plugin repo root at `images/`:

- `yaxii-shipping-manager-logo.png` — 1254×1254, RGB
- `yaxii-shipping-manager-cover.png` — 2172×724, RGB
- `screenshot1.png` … `screenshot5.png` — ~1742×878 each, RGBA

## Files created (SVN working copy, `assets/`)

- `icon-128x128.png`, `icon-256x256.png` — center-cropped/resized from the logo (already square, no crop needed) via .NET `System.Drawing` (no ImageMagick/sharp available on this machine).
- `banner-772x250.png`, `banner-1544x500.png` — center-cropped from the cover image (source ratio 3.0 vs. target ratio 3.088; cropped narrowly from the sides, no visible content lost — verified visually) and resized with high-quality bicubic interpolation.
- `screenshot-1.png` … `screenshot-5.png` — renamed copies of the source screenshots (no resize needed; WordPress.org does not require exact screenshot dimensions).

Renaming rationale: WordPress.org's plugin-directory asset pipeline only recognizes specific filenames (`icon-{size}.png`, `banner-{size}.png`, `screenshot-{n}.png`) — arbitrary names like `yaxii-shipping-manager-logo.png` would not be picked up or displayed at all. Given the readme short-description length warning encountered earlier in this project, dimensions were verified/generated to exactly match the claimed sizes rather than trusting filename claims against un-resized source images.

## Screenshot/caption accuracy check (judgment call, user-confirmed)

Visually inspected all 5 screenshots against the existing `readme.txt` Screenshots section before publishing. Found a mismatch: the existing captions described a Settings page (#4) and a "Remove Yaxii setup confirmation" dialog (#5), but the actual images are: Shipping Editor, Generator-Coverage step, Generator-Preview step, Generator-Generate/success step, and Diagnostics — no Settings or Remove-confirmation screen was among the 5 provided images.

Flagged to the user with a side-by-side comparison; user chose to keep these 5 images and have the captions rewritten to accurately describe them (rather than holding off or using generic captions). `readme.txt` Screenshots section rewritten accordingly:

1. Shipping Editor showing wilaya-level zones, home and office/stopdesk delivery prices, and per-method status controls.
2. Setup wizard coverage step: choose the current 69-wilaya dataset or the legacy 58-wilaya compatible dataset before generating zones.
3. Setup wizard preview step: review the exact zones and methods to be created before anything is applied to WooCommerce.
4. Setup wizard confirmation after generating, summarizing zones created and methods added.
5. Diagnostics page showing WooCommerce readiness checks, pass/warning counts, and Algeria setup coverage.

## Files changed

- `readme.txt` (repo root) — Screenshots section captions only; no other section touched.
- `release/yaxii-shipping-manager/readme.txt` — synced.
- SVN working copy: `trunk/readme.txt`, `tags/1.0.0/readme.txt` — synced (readme content identical between trunk/tag, same as prior tasks).

## Files created

- `.agents/progress/yaxii-shipping-manager/TASK-WPORG-ASSETS-ICON-BANNER-SCREENSHOTS.md` (this report)
- SVN working copy `assets/`: 9 files (2 icon sizes, 2 banner sizes, 5 screenshots) — see above.
- Rebuilt `release/yaxii-shipping-manager.zip` (readme caption change only; not uploaded to SVN, per the "never upload the zip" rule).

## What was before

Top-level SVN `assets/` was empty (intentionally, per the original release task — no final marketing assets had been supplied/approved yet).

## What changed

`assets/` now contains WordPress.org-compliant icon, banner, and screenshot files as listed above. `readme.txt` Screenshots section corrected to match actual screenshot content. Short description remains 146 characters (unaffected by this task).

## What still remains mocked

No change — same as prior reports.

## Security notes

No code changed. No remote calls, telemetry, or tracking introduced. Source images were read only from the user-supplied `images/` folder; no external downloads.

## WooCommerce safety notes

Not applicable — display-asset task only.

## WordPress.org compliance notes

- Filenames and pixel dimensions match WordPress.org's documented plugin-asset conventions exactly (`icon-128x128.png`, `icon-256x256.png`, `banner-772x250.png`, `banner-1544x500.png`, `screenshot-1.png`…`screenshot-5.png`), avoiding a repeat of the readme short-description dimension/length mismatch warning seen in the prior task.
- Screenshot captions corrected to avoid describing screens (Settings, Remove-confirmation) that are not actually shown — avoids a "no misleading claims" compliance issue.
- No hidden files, non-image files, or unrelated content in `assets/` (verified by scan).

## Checks run

- Verified actual pixel dimensions of all 7 source images (`file` command).
- Generated icon/banner at exact target dimensions via .NET `System.Drawing` center-crop + high-quality resize (not just renamed).
- Visually inspected generated `icon-256x256.png` and `banner-1544x500.png` for cropping artifacts — clean, no important content cut off.
- Visually inspected all 5 screenshots against existing readme captions — found and corrected a real mismatch (see above), confirmed with user before publishing.
- Forbidden-file scan of SVN `assets/` — clean (only the 9 expected PNGs, no hidden/non-image files).
- Short-description length re-check after readme edit — still 146 characters.
- `svn status` — new adds in `assets/`, plus the two already-expected `readme.txt` modifications; no other files touched.

## Check results

All checks passed.

## Known risks

- Banner source image aspect ratio (3.0) doesn't exactly match WordPress.org's expected banner ratio (3.088); a narrow center-crop was applied. Visually verified as lossless to the important content, but should be reviewed once live on the plugin page.
- No `icon.svg` provided (only raster icon sizes) — acceptable per WordPress.org guidelines (raster icon sizes are sufficient; SVG is optional).

## Blockers

None.

## SVN status before commit

```
A       assets\banner-1544x500.png
A       assets\banner-772x250.png
A       assets\icon-128x128.png
A       assets\icon-256x256.png
A       assets\screenshot-1.png
A       assets\screenshot-2.png
A       assets\screenshot-3.png
A       assets\screenshot-4.png
A       assets\screenshot-5.png
M       tags\1.0.0\readme.txt
M       trunk\readme.txt
```

## SVN commit

Approved by user. Committed:

```
svn commit -m "Add plugin icon, banner, and screenshots for 1.0.0" assets trunk/readme.txt tags/1.0.0/readme.txt
```

**Revision: 3622031.** Verified live via `svn list` on the SVN `assets/` URL — all 9 files present.

## Public URL

`https://wordpress.org/plugins/yaxii-shipping-manager`

## Next task

None required. The plugin directory listing should now show the icon, banner, and 5 screenshots after WordPress.org's next asset sync.

## Commit hash

See git commit containing this report (readme.txt caption change + report only; `images/` source folder and `assets/` SVN files are not part of the git repo).
