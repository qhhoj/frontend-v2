# Clay — QHHOJ Design System (Master)

Clay is the QHHOJ design language (tokens, primitives, rules, rollout: `docs/design-language.md`). Clay & ivory is its default theme, Glass an optional theme family.

Default direction: **Clay & ivory** (user pick, 2026-10-08, mock-up "Palette", third option): light-first, calm, ivory paper, white opaque surfaces, hairline borders, solid clay buttons, no blur, no blobs; the dark twin is warm charcoal. **Glass** (the earlier approved "I · Glass") stays as two optional themes, `glass-dark` and `glass-light`. Typography and the checklist come from ui-ux-pro-max (`"crypto defi glassmorphism" --design-system --density 6`). Page overrides go in `pages/<page>.md`; they win over this file.

Source of truth for values is the code: `src/theme/tokens.css` (global tokens) and `src/theme/themes/<id>.css` (per-theme tokens). This file explains intent. Bit, the pixel mascot (`mascot.md`), keeps its sprite colours in every theme: they are sprite data, not theme tokens.

## Style

- **Clay (default)**: ivory ground, white cards (`bg-surface` = `--qh-surface-solid`) with a 1 px `--qh-line` hairline, no blur (`--qh-blur: 0px`), no background blobs (`--qh-blob-display: none`, blob colours transparent), one solid clay colour for primary actions (`--qh-gradient-accent` has two equal stops, so `bg-gradient-accent` is flat), no glow (`--qh-glow` is transparent).
- **Glass (optional)**: frosted cards (`backdrop-filter: blur(var(--qh-blur))`, 24 px, translucent fill, hairline) over 2-3 large blurred radial blobs (pink, violet; the third is hidden on narrow or short screens); pink to violet accent gradient on primary actions.
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

**Personal look.** Accent presets (Clay, Orchid, Ocean, Mint, Sunset, Gold, Mono) override the accent family per theme: `accent`, `accent-2`, `accent-text`, `accent-soft(-text)`, `on-accent`, `focus-ring`, `line-accent`, `gradient-accent`, `glow`, `surface-hover` and the three blobs. Each theme's own preset is Clay for Clay and Orchid for Glass. Verdict, first-solve, tier, coin and syntax colours never follow the accent. Values live in `src/theme/themes/*.css`; every preset is checked in all four themes at Glass 0/25/50/75/100 with blobs at full strength. In the flat Clay themes Glass and Glow do nothing (opaque surfaces, no blobs), and their controls are disabled with a reason.

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

- Display/headings: **Space Grotesk** 500-700. Body/UI: `--qh-font-body` (Verdana, then DejaVu Sans and the system sans). Numbers and code: **JetBrains Mono** (400, 600) with `tabular-nums`.
- Type scale (font size only; leading comes from the primitives): `text-tiny` 11, `text-caption` 12, `text-meta` 13, `text-sm` 14 (UI, tables), `text-base` 16 (prose, every input), `text-title` 17, `text-subtitle` 18, `text-section` 20, `text-display` 24, `text-page` 26 (the `page-title` h1 utility), `text-stat` 26 with `font-mono`, `text-hero` 40. No arbitrary `text-[Npx]` (`lint:tokens`). Hero rating number 60 px (`text-6xl`).
- Self-hosted via `@fontsource` (no Google Fonts request).

## Shape, depth, motion

- Radius by role: controls `rounded-control` (`--qh-radius-control`: pill, 12 px in the admin scope `.qh-admin`), inputs and code `rounded-cell` 12, inset tiles and notices `rounded-row` 16, cards and dialogs `rounded-card` 24, chips/tabs/segmented `rounded-pill`. `rounded-tile` 20 and `rounded-panel` 28 are legacy: no new uses. No `rounded-[…]` outside the lint allowlist.
- Control heights: `--qh-control` 44 px (md), `--qh-control-sm` 36 px (44 px on coarse pointers; the admin scope's default), `--qh-control-lg` 56 px (swap card submit).
- Z scale: `z-sticky` 10, `z-savebar` 20, `z-header` 30, `z-bit` 40, `z-overlay` 50, `z-toast` 1200 (above PrimeVue's 1000/1100 layers). No `z-[…]`.
- Depth is hairlines and tone steps in Clay. Glass blurs 24 px at Glass 0 (Clear), scaled down to 0 at Glass 100 (Solid, opaque `--qh-surface-solid`); the personal Glass level moves `--qh-surface-live` and `--qh-blur-live` only. One soft shadow, `shadow-float` (`--qh-shadow-float`), on floating surfaces only: modals, menus, popovers, toasts. No other drop shadows (the live-dot glow exists in Glass only). Control borders use `--qh-line-control` (3:1 on the ground); `--qh-line` stays the hairline of cards and dividers.
- Motion: `--qh-duration-fast` 150 ms and `--qh-duration` 200 ms, ease `--qh-ease`, on colour, border and opacity only; no layout-shifting hover.
- `prefers-reduced-motion`: durations 0, no transitions or animations. `prefers-reduced-transparency`: the card surface is opaque (`--qh-surface-solid`) and blur is 0. No `backdrop-filter` support: the card surface is opaque; inner tiles and hover rows keep their Glass tint. Clay is already opaque.

## Loading states

- Skeletons: `SkeletonBlock` in `--qh-skeleton`, pulsing 1.4 s between full and 45 % opacity; static under reduced motion. Shapes: `text` (1em tall, inline), `round`, `pill`, or a plain block; never a radius class.
- Shaped like the real content: a block inside a wrapper that carries the real text classes, fixed sizes for coins, badges and tiles, the real row count. Skeleton rows also reserve phone-only rows that would otherwise shift (the ranking scroll hint below `md`).
- `QueryState` owns the loading branch and shows the card's own `skeleton` slot; the error branch with retry is unchanged. Wrapper and blocks are `aria-hidden`; no loading text per block.
- Waiting means first data only (`isPending`). A wait is shown after 600 ms of continuous waiting; a wait that ends is over after 100 ms, so the gap between a navigation ending and the page's queries starting does not count as done.
- Bit swarm: after the 600 ms, 5 Bits (3 under 768 px) wander the viewport: random walk at 40-120 px/s, bouncing off the edges, small hops, leg steps, facing their direction. Fixed, `z-40`, `aria-hidden`, `pointer-events: none`, below menus and dialogs.
- When waiting ends, the Bits stop after 100 ms, blink once (160 ms), hold 1.5 s, then fade out over 300 ms. A new wait while they fade walks again.
- Under reduced motion one Bit (the cap) stands in the bottom-left corner, does not blink, stays through the 1.5 s hold, then disappears without a fade (the global 0 ms transition rule applies).
- Background refetches, polls and kept-data filter changes show neither skeletons nor Bits.
- One polite live region in the shell says the loading text ("Đang tải…") while the Bits walk; it still announces under reduced motion.
- 404: crying Bit in front of a pale "404" built from `--qh-skeleton` blocks; heading "Page not found", one line, "Back to home" (primary) and "Browse problems" (secondary), the requested path in mono.

## Components

- **Card**: `ui/Card.vue` (variant `glass` = `glass rounded-card`; `padding` or caller padding): a white hairline card in Clay, frosted in Glass. `GlassCard` is its old-name wrapper.
- **Pill nav / tabs**: `glass` pill container; active item `bg-accent-soft` + `text-accent-soft-text` + accent border (one active style for every tab set), others `text-muted` with a `bg-surface-hover` hover.
- **Primary button**: `bg-gradient-accent` + `text-on-accent`, 56 px tall (`h-14`) in the swap card, 44 px elsewhere.
- **Token pill**: pill with a coin (`coin-1` ... `coin-6`) and label; selected = accent border + accent tint.
- **Verdict badge**: 40 px circle (`size-10`), verdict tint, abbreviation + accessible full label.
- **Ranking cell**: `rounded-cell` block; first solve = `bg-first-solve` with a star: a stronger shade of the accepted green in every theme (deeper in the light themes, brighter in the dark ones; `themes.spec.ts` checks 3:1 against the accepted tint, the hue gap from the red wrong-answer tint and 4.5:1 text); pending = `?n`.
- **Overlays** (menus, popovers): opaque `bg-surface-solid`.
- **Appearance panel**: a 44 px palette button in the header opens an opaque popover with Style (Clay, Glass) and Mode (Light, Dark, Automatic), seven accent dots, Glass Clear, Frosted and Solid, "use site default" and a link to Settings › Appearance. It has a focus trap; Escape returns focus to the button.
- **Settings › Appearance** (`/settings/appearance`, public): an opt-in switch, Style and Mode, accent swatches in a 4 + 3 grid, Glass and Glow sliders, reset and a live preview.
- Disabled segments, swatches and sliders use a token fill, border and `cursor-not-allowed`, never `opacity`.

## Rules

- No raw colour values outside `src/theme/themes/*.css` (`npm run lint:tokens`). Status colours: `text-warning`/`bg-warning-bg` (the TLE pair) and `text-info`/`bg-info-bg` (the tag-5 pair); verdict colours only for verdicts.
- Text >= 4.5:1 on the worst ground, large text >= 3:1; accent fills and the accent border >= 3:1; focus ring 2 px `--qh-focus-ring`, offset 2 px, never removed.
- Meaning never by colour alone: verdicts carry text, frozen cells carry `?`, first solve carries a legend.
- Touch targets >= 44 px; real `<button>`/`<a>`; icon-only buttons have `aria-label`.
- Icons: Lucide only, no emoji.
- Every accent preset keeps the default's contrast rules (`themes.spec.ts`). Disabled controls keep full-contrast labels: no `opacity` on text.
- Responsive at 375, 768, 1024, 1440; wide tables scroll inside their card, never the page.

## Pre-delivery checklist

- [ ] A new theme defines the seven accent presets and `npm test` is green for all
- [ ] No emoji icons; Lucide only
- [ ] No raw colours in components
- [ ] Hover/focus states, 150-200 ms
- [ ] Contrast checked in all four themes
- [ ] Focus visible for keyboard nav
- [ ] Reduced motion and reduced transparency respected
- [ ] 375 / 768 / 1024 / 1440 px, no horizontal page scroll
- [ ] Loading: skeleton added for each new card, reduced motion checked
