# QHHOJ Design System (Master)

Default direction: **Clay & ivory** (user pick, 2026-10-08, mock-up "Palette", third option): light-first, calm, ivory paper, white opaque surfaces, hairline borders, solid clay buttons, no blur, no blobs; the dark twin is warm charcoal. **Glass** (the earlier approved "I · Glass") stays as two optional themes, `glass-dark` and `glass-light`. Typography and the checklist come from ui-ux-pro-max (`"crypto defi glassmorphism" --design-system --density 6`). Page overrides go in `pages/<page>.md`; they win over this file.

Source of truth for values is the code: `src/theme/tokens.css` (global tokens) and `src/theme/themes/<id>.css` (per-theme tokens). This file explains intent. Bit, the pixel mascot (`mascot.md`), keeps its sprite colours in every theme: they are sprite data, not theme tokens.

## Style

- **Clay (default)**: ivory ground, white cards (`bg-surface` = `--qh-surface-solid`) with a 1 px `--qh-line` hairline, no blur (`--qh-blur: 0px`), no background blobs (`--qh-blob-display: none`, blob colours transparent), one solid clay colour for primary actions (`--qh-gradient-accent` has two equal stops, so `bg-gradient-accent` is flat), no glow (`--qh-glow` is transparent).
- **Glass (optional)**: frosted cards (`backdrop-filter: blur(var(--qh-blur))`, 24 px, translucent fill, hairline) over 2-3 large blurred radial blobs (pink, violet; the third is hidden on narrow or short screens); pink to violet accent gradient on primary actions and first-solve cells.
- Components never know which: they use `glass rounded-card`, `bg-surface`, `bg-gradient-accent`; the theme decides what those render.
- Tone: big friendly numbers, pill controls, token-pill tags with a "coin", swap-card submit panel, podium for top 3.

## Colour roles (clay-light / clay-dark)

| Role | Token | clay-light | clay-dark |
|---|---|---|---|
| Ground | `--qh-ground` | `#FAF9F5` | `#1A1816` |
| Card | `--qh-surface` = `--qh-surface-solid` | `#FFFFFF` | `#24211E` |
| Inner tile / input | `--qh-surface-strong` | `#F6F3EC` | `#2D2926` |
| Hover row | `--qh-surface-hover` | `#F1EDE4` | `#352F2B` |
| Hairline | `--qh-line` | `#E8E2D8` | `#39342F` |
| Text | `--qh-text` | `#141413` | `#F2EEE8` |
| Muted text | `--qh-text-muted` | `#5E5A52` | `#C9C1B6` |
| Accent fill (buttons) | `--qh-accent` | `#B4532F` | `#D97757` |
| Second accent (gradient end, SVG stops) | `--qh-accent-2` | `#9A3F22` | `#E8825F` |
| Accent as text/link, focus ring | `--qh-accent-text`, `--qh-focus-ring` | `#A64A28`, `#A64A28` | `#EE9A7A`, `#F4A98B` |
| Rating chart line start | `--qh-chart-line-start` | `var(--qh-accent)` | `var(--qh-accent)` |
| Text on accent fill | `--qh-on-accent` | `#FFFFFF` | `#1A1816` |

Moved from the mock-up where measured contrast demanded it: link and focus ring `#B4532F` to `#A64A28` (4.26:1 on the hover row), positive/AC text `#15803D` to `#166534` (4.18:1 on the AC tint), `tier-master` `#B45309` to `#9A3412`, `accent-2` `#D97757` to `#9A3F22` (white on it is 3.12:1), dark button text is charcoal, not white (white on `#D97757` is 3.12:1). Lowest text pair per theme, as measured by the spec's formulas: clay-light 4.59:1, clay-dark 4.80:1.

## Glass roles (glass-dark / glass-light)

| Role | Token | glass-dark | glass-light |
|---|---|---|---|
| Ground | `--qh-ground` | `#0D0A1A` | `#F6F2FF` |
| Glass fill | `--qh-surface` | `rgba(255,255,255,.04)` | `rgba(255,255,255,.55)` |
| Opaque fallback | `--qh-surface-solid` | `#1B1530` | `#FFFFFF` |
| Text | `--qh-text` | `#F3EEFF` | `#1B1230` |
| Muted text | `--qh-text-muted` | `#CFC5EA` | `#5A4D78` |
| Accent fill (pink) | `--qh-accent` | `#FC72FF` | `#A21CAF` |
| Accent fill (violet) | `--qh-accent-2` | `#7B61FF` | `#5B3FD6` |
| Accent as text/link | `--qh-accent-text` | `#FDB8FF` | `#A21CAF` |
| Text on accent gradient | `--qh-on-accent` | `#140A1F` | `#FFFFFF` |
| Rating chart line start | `--qh-chart-line-start` | `var(--qh-accent-2)` | `var(--qh-accent-2)` |

Blob peaks are 24 % (pink) and 28 % (violet) in glass-dark. The mock-up's muted `#B7A9D6` (4.11:1) and pink text `#FC72FF` (3.82:1) failed 4.5:1, hence `#CFC5EA` and `#FDB8FF`. Lowest text pair: glass-dark 4.93:1, glass-light 4.55:1.

Verdicts (text + tint, always with a text label and an icon): AC green, WA red, TLE/MLE amber, RTE/OLE/IR violet, CE/IE slate, pending neutral, partial = 3-step green. Rating tiers follow legacy classes (newbie ... grandmaster). Code syntax: six `--qh-syntax-*` tokens per theme. Every theme is checked by `src/theme/themes.spec.ts` on the worst ground it can produce.

## Typography

- Display/headings: **Space Grotesk** 500-700. Body/UI: **Inter** 400-700. Numbers and code: **JetBrains Mono** (400, 600) with `tabular-nums`.
- Base 16 px (browser default). Hero rating number 60 px (`text-6xl`), card numbers 26 px.
- Self-hosted via `@fontsource` (no Google Fonts request).

## Shape, depth, motion

- Radii (tokens): `rounded-cell` 12 px, `rounded-row` 16 px, `rounded-tile` 20 px (inner tiles, submit), `rounded-card` 24 px, `rounded-panel` 28 px (swap card), `rounded-pill` 999 px.
- Depth is hairlines and tone steps in Clay; Glass has blur 24 px. No drop shadows (the live-dot glow exists in Glass only).
- Motion: `--qh-duration-fast` 150 ms and `--qh-duration` 200 ms, ease `--qh-ease`, on colour, border and opacity only; no layout-shifting hover.
- `prefers-reduced-motion`: durations 0, no transitions or animations. `prefers-reduced-transparency`: the card surface is opaque (`--qh-surface-solid`) and blur is 0. No `backdrop-filter` support: the card surface is opaque; inner tiles and hover rows keep their Glass tint. Clay is already opaque.

## Loading states

- Skeletons: `SkeletonBlock` in `--qh-skeleton`, pulsing 1.4 s between full and 45 % opacity; static under reduced motion. Shapes: `text` (1em tall, inline), `round`, `pill`, or a plain block; never a radius class.
- Shaped like the real content: a block inside a wrapper that carries the real text classes, fixed sizes for coins, badges and tiles, the real row count. Skeleton rows also reserve phone-only rows that would otherwise shift (the ranking scroll hint below `md`).
- `QueryState` owns the loading branch and shows the card's own `skeleton` slot; the error branch with retry is unchanged. Wrapper and blocks are `aria-hidden`; no loading text per block.
- Waiting means first data only (`isPending`). A wait is shown after 600 ms of continuous waiting; a wait that ends is over after 100 ms, so the gap between a navigation ending and the page's queries starting does not count as done.
- Bit swarm: after the 600 ms, 5 Bits (3 under 768 px) wander the viewport: random walk at 40-120 px/s, bouncing off the edges, small hops, leg steps, facing their direction. Fixed, `z-40`, `aria-hidden`, `pointer-events: none`, below menus and dialogs.
- When waiting ends, the Bits stop after 100 ms, blink once (160 ms), hold 1.5 s, then fade out over 300 ms. A new wait while they fade walks again.
- Under reduced motion one Bit (the cap) stands in the bottom-left corner, does not blink, and disappears at once when the wait ends (no fade: the global 0 ms transition rule applies).
- Background refetches, polls and kept-data filter changes show neither skeletons nor Bits.
- One polite live region in the shell says the loading text ("Đang tải…") while the Bits walk; it still announces under reduced motion.
- 404: crying Bit in front of a pale "404" built from `--qh-skeleton` blocks; heading "Page not found", one line, "Back to home" (primary) and "Browse problems" (secondary), the requested path in mono.

## Components

- **Card**: `GlassCard` (`glass rounded-card`; callers add padding): a white hairline card in Clay, frosted in Glass.
- **Pill nav**: `glass` pill container, active item `bg-surface-hover` + `text-content`, others `text-muted`.
- **Primary button**: `bg-gradient-accent` + `text-on-accent`, 56 px tall (`h-14`) in the swap card, 44 px elsewhere.
- **Token pill**: pill with a coin (`coin-1` ... `coin-6`) and label; selected = accent border + accent tint.
- **Verdict badge**: 40 px circle (`size-10`), verdict tint, abbreviation + accessible full label.
- **Ranking cell**: `rounded-cell` block; first solve = `bg-first-solve` with a star: pink-violet in Glass, gold/amber in Clay (kept apart from the red wrong-answer tint; `themes.spec.ts` checks the hue gap and 4.5:1 text); pending = `?n`.
- **Overlays** (menus, popovers): opaque `bg-surface-solid`.

## Rules

- No raw colour values outside `src/theme/themes/*.css` (`npm run lint:tokens`).
- Text >= 4.5:1 on the worst ground, large text >= 3:1; accent fills and the accent border >= 3:1; focus ring 2 px `--qh-focus-ring`, offset 2 px, never removed.
- Meaning never by colour alone: verdicts carry text, frozen cells carry `?`, first solve carries a legend.
- Touch targets >= 44 px; real `<button>`/`<a>`; icon-only buttons have `aria-label`.
- Icons: Lucide only, no emoji.
- Responsive at 375, 768, 1024, 1440; wide tables scroll inside their card, never the page.

## Pre-delivery checklist

- [ ] No emoji icons; Lucide only
- [ ] No raw colours in components
- [ ] Hover/focus states, 150-200 ms
- [ ] Contrast checked in all four themes
- [ ] Focus visible for keyboard nav
- [ ] Reduced motion and reduced transparency respected
- [ ] 375 / 768 / 1024 / 1440 px, no horizontal page scroll
- [ ] Loading: skeleton added for each new card, reduced motion checked
