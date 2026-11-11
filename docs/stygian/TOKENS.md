# Stygian tokens: the specification's colors, and where they had to change

Source: `Downloads\MTH263_Stygian_Visual_Design_Specification` (v2.1, 2026-11-11), §3–§6.
The tokens live in `src/styles/tokens.css` as `light-dark(light, stygian)`. `npm run contrast`
(`dev/contrast.mjs`) checks every text pair (4.5:1) and every control or graphic pair (3:1) in both looks.

## The looks

- **Stygian is the default** for everyone, whatever the device prefers. The light look is a saved choice:
  - the sidebar's **Dark Mode** switch (on = Stygian),
  - the phone top bar's sun/moon button,
  - **Settings → Theme** ("Stygian" or "Light").
- The stored values did not change, so there is no data migration (`students.theme` and the `mth_theme` cookie):
  - `system` (nobody chose yet) and `dark` → Stygian;
  - `light` → the light look.
- The old gray dark look is retired. Students who had chosen "Dark" now see Stygian.
- The light look is exactly as before: every light value is unchanged, and its titles stay in Inter.

## Mapping

| Role | Token | Spec | Used in Stygian | Why it differs |
|---|---|---|---|---|
| Page | `--bg` | `#0B080B` | `#0B080B` | |
| Sidebar, top bar, tab bar, cards | `--surface`, `--chrome-bg` | `#15121A` | `#15121A` | |
| Raised panels, the primary study card | `--surface-2`, `--surface-raised` | `#211A20` | `#211A20` | |
| Hover | `--surface-hover` | `#2A2025` | `#2A2025` | |
| Filled buttons, the current sidebar item, chosen chips | `--accent` (hover, pressed) | `#7A1F2B` (`#932B35`) | same, pressed `#681A25` | |
| Text on those fills | `--on-accent` | ivory | `#F4EDE3` (8.8:1) | |
| Text and math | `--text` | `#F4EDE3` | `#F4EDE3` | |
| Secondary text | `--text-2` | `#B8AA99` | `#B8AA99` | |
| Dates, captions, hints | `--muted` | — | `#A39584` | A step dimmer than secondary text, so the existing three-level text hierarchy stays. At least 4.5:1 on every surface. |
| Card outlines, dividers | `--border` | `#4A3628` | `#4A3628` | |
| Outlines of inputs and buttons | `--border-strong` | — | `#8A6B45` | A control's outline needs 3:1 (WCAG 1.4.11); `#4A3628` is 1.6:1. |
| Hairlines at the shell's edges, the raised card's edge | `--chrome-edge`, `--border-raised` | aged gold/brown | `#5C452C` | Decorative only. |
| Links and small accent text; the current item's marker; a chosen chip's edge | `--accent-text`, `--nav-marker`, `--selected-edge` | antique gold `#D4AF37` | `#D4AF37` | Oxblood text is 1.8:1 on the surface, so small accent text uses the gold. |
| Focus ring | `--focus-ring` | moonlight `#A9B8C9` | `#A9B8C9` (9.2:1) | |
| Progress fills, checkbox and radio dots, due counts | `--chart-accent`, `--count-bg` | oxblood `#7A1F2B` | crimson `#BE3B4E` | A fill must reach 3:1 against its track and the card; oxblood is 1.8:1. Same hue, lighter. |
| The countdown | `--accent-numeral` | — | rose `#E8798A` (6.6:1) | The boards show the countdown in rose. |
| Success | `--success-icon` / `-text` | `#2E7D32` | `#5DB362` / `#8FD694` | `#2E7D32` is 3.6:1, too dark for text. |
| Warning | `--warning-icon` / `-text` | `#C48F32` | `#C48F32` | Passes as it is (6.5:1). |
| Error | `--danger-icon` / `-text` | `#A33338` | `#D9555B` / `#F08A8F` | `#A33338` is 2.7:1, below 3:1 even for icons. |
| Information (tips, info alerts) | `--info-text` on `--info-soft` | `#496B93` | `#B4CBE6` on `#17212F` | `#496B93` is 3.4:1, too dark for text. |
| Foundation | `--diff-f*` | moonlight | `#A9B8C9` on `#1A2330`; badge `#A9B8C9` with `#14181E` text | |
| Core | `--diff-c*` | antique gold / ivory | `#D4AF37` on `#2B230F`; badge `#D4AF37` with `#1A1408` text | |
| Challenge | `--diff-ch*` | oxblood | `#F4E3E0` on wine `#5A1822`; badge `#7A1F2B` with ivory; lines `#C8485B` | Oxblood as text or a line is too dark, so lines use a lighter crimson. |
| Got it / Shaky / Lost in charts | `--chart-got`, `-shaky`, `-lost` | — | `#27A37A`, `#C08708`, `#C1403F` (unchanged) | Checked with the dataviz palette validator on `#15121A`: lightness band, chroma, color-blind separation ΔE 9.7, normal vision 17.6, all at least 3:1. |

## Type

- Playfair Display (`next/font/google`, `--font-display`) sets page, section, card and dialog titles (`h1`, `h2`) and the "MTH 263" name.
- Body text, controls, numbers and small labels beside the problem stay in Inter.
- Math keeps KaTeX, in ivory.

## Text over the library picture

- The Dashboard header sits over `bg_01` (see `ASSETS.md`).
- To check it, every header word's box was recorded, the words were hidden, and the brightest pixel under each box was measured from a screenshot.
- Each word must keep 4.5:1 against that brightest pixel. The results are in `ADAPTIVE_PROGRESS.md` (Stygian section).
