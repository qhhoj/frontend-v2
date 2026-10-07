# QHHOJ Design System (Master)

Generated with ui-ux-pro-max (`"crypto defi glassmorphism" --design-system --density 6`), then adapted to the approved **I · Glass** direction (2026-10-08). Typography and checklist come from the tool; palette, style and component rules are Glass. Page overrides go in `pages/<page>.md`; they win over this file.

Source of truth for values is the code: `src/theme/tokens.css` (global tokens) and `src/theme/themes/<id>.css` (per-theme tokens). This file explains intent.

## Style

- Glassmorphism on a deep ground: frosted cards (`backdrop-filter: blur(var(--qh-blur))`, 4 % white fill, 1 px hairline border) over 2–3 large blurred radial blobs (pink, violet).
- Consumer-DeFi tone: big friendly numbers, pill controls, token-pill tags with a gradient "coin", swap-card submit panel, podium for top 3.
- One accent gradient (pink → violet) for primary actions and first-solve cells only.

## Colour roles (glass-dark / glass-light)

| Role | Token | Dark | Light |
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

Measured on the worst ground (blob centre + glass + hover tint): the mockup's muted `#B7A9D6` (4.11) and pink text `#FC72FF` (3.82) fail 4.5:1. Fixes: blob peaks lowered to 24 % (pink) / 28 % (violet), muted `#CFC5EA`, pink never used as text (`--qh-accent-text` `#FDB8FF`), lighter verdict/tier text in dark and darker in light. Every theme is checked by `src/theme/themes.spec.ts`; worst pair is 5.57 (dark) and 4.61 (light).

Verdicts (text + tint, always with a text label and an icon): AC green, WA red, TLE/MLE amber, RTE/OLE/IR violet, CE/IE slate, pending violet-grey, partial = 3-step green. Rating tiers follow legacy classes (newbie … grandmaster).

## Typography

- Display/headings: **Space Grotesk** 500–700. Body/UI: **Inter** 400–700. Numbers and code: **JetBrains Mono** with `tabular-nums`.
- Base 15–16 px, line-height 1.5. Hero numbers 64 px, card numbers 26 px.
- Self-hosted via `@fontsource` (no Google Fonts request).

## Shape, depth, motion

- Radii: 12 (cells), 16 (rows), 20 (inner tiles, submit), 24 (cards), 28 (swap card), pill 999.
- Blur 24 px; no drop shadows except the live-dot glow.
- Motion 150–200 ms ease-out on colour/opacity only; no layout-shifting hover.
- `prefers-reduced-motion`: no transitions or blob drift. `prefers-reduced-transparency` or no `backdrop-filter` support: blur off, opaque `--qh-surface-solid`.

## Components

- **Glass card**: `glass rounded-card p-6`.
- **Pill nav**: glass pill container, active item `bg-surface-hover` + `text-content`, others `text-muted`.
- **Primary button**: accent gradient, `text-on-accent`, 56 px tall in the swap card, 44 px elsewhere.
- **Token pill**: 40 px pill, 28 px gradient coin + label; selected = accent border + accent tint.
- **Verdict badge**: 40 px circle, verdict tint, abbreviation + accessible full label.
- **Ranking cell**: 12 px radius block; first solve = accent gradient tint; pending = `?n`.

## Rules

- No raw colour values outside `src/theme/themes/*.css` (`npm run lint:tokens`).
- Text ≥ 4.5:1 on the worst ground, large text ≥ 3:1; focus ring 2 px `--qh-focus-ring`, offset 2 px, never removed.
- Meaning never by colour alone: verdicts carry text, frozen cells carry `?`, first solve carries a legend.
- Touch targets ≥ 44 px; real `<button>`/`<a>`; icon-only buttons have `aria-label`.
- Icons: Lucide only, no emoji.
- Responsive at 375, 768, 1024, 1440; wide tables scroll inside their card, never the page.

## Pre-delivery checklist

- [ ] No emoji icons; Lucide only
- [ ] No raw colours in components
- [ ] Hover/focus states, 150–200 ms
- [ ] Contrast checked in both themes
- [ ] Focus visible for keyboard nav
- [ ] Reduced motion and reduced transparency respected
- [ ] 375 / 768 / 1024 / 1440 px, no horizontal page scroll
