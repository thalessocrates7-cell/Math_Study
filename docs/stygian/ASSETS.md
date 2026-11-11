# Stygian images: sources, use and web copies

The specification (`Downloads\MTH263_Stygian_Visual_Design_Specification`, §5 and §13) names an asset pack: `assets/`, `ASSET_MANIFEST.csv` and `README_FOR_CLAUDE.md`.

**The pack had not arrived by 2026-11-11.** The first look therefore uses the copies embedded in the specification `.docx` itself. They are the same pictures at a smaller size; `bg_01` is 1536 × 720.

When the pack arrives:

1. Run `node dev/stygian-assets.mjs <pack folder>`. It finds each original by its asset name, at any depth.
2. The web copies keep their names, so no code changes.
3. Read the pack's README and manifest, and replace the credits section below.
4. Look at the pages again.

## In use

| Asset | Role (spec) | Where | Web copies (`public/stygian/`) |
|---|---|---|---|
| `bg_01_forgotten_library_main` | The canonical atmosphere | Behind the Dashboard header, both environments. The Final Exam's copy is mirrored, so its moonlit window is on the right. Stygian only. | `-768` and `-1536`, as `.avif` (preferred) and `.webp` |

- Each picture is decoration: a CSS layer under a shade, so assistive technology never meets it.
- It is hidden:
  - in the light look,
  - with "prefers more contrast",
  - with forced colors,
  - in print.
- Phones load the 768-wide copy (about 20 KB) and wider screens the 1536-wide one (about 70–80 KB). Only the two Dashboards load either.
- When the pack's original is wider than 1536, the script also makes a 2400-wide copy for sharp screens. Add it to the `image-set` in `src/styles/app.css` (the "library atmosphere" section).

## Planned (later checkpoints), not served yet

| Asset | Spec role | Planned use |
|---|---|---|
| `bg_07_candlelit_books_desk` | Empty states and session decoration | The Review Queue's empty state (checkpoint 3) |
| `bg_01` again | Landing hero, sign-in backdrop | Checkpoint 4 |
| `decor_01_gold_divider_ornament` | Only between major sections | Polish (checkpoint 5) |
| `decor_02_corner_frame_ornament` | Hero and feature cards only | Polish (checkpoint 5) |
| `bg_09_darkened_walnut_texture_overlay` | Low opacity behind panels | Polish, only if contrast holds |
| `bg_05` window, `bg_06` shelves, `bg_08` carpet | Accents | Not planned yet: low-resolution in the `.docx` |
| `decor_03_library_book_crest` | Optional | Not the logo without the owner's approval |
| Red-moon cathedral, black marble | Optional alternatives | Not used: not the Forgotten Library look |

The screens and boards (`screen_*`, `board_*`) are design references only and are never served.

## Credits

The pictures were provided by the site's owner for this site. Licensing and credits follow the pack's `ASSET_MANIFEST.csv`. It has not been seen yet, so update this section when it arrives.
