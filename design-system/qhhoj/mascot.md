# Bit — the QHHOJ pixel mascot

Bit is a 16×16 pixel creature built on the Pixel piece theme of 5DChess (same author). It is an original design: never use the Anthropic or Claude logo, asterisk mark or wordmark, and never present Bit as official Claude or Anthropic artwork.

## Canvas
- 16×16 grid, transparent background, centred.
- Hard pixels only: no anti-aliasing, gradients, blur, glow, shadows or dithering.
- Scale with nearest-neighbour only (×8 → 128 px, ×16 → 256 px); in CSS use `image-rendering: pixelated`.
- No text, letters or logos on or above the creature; six palette colours only.

## Body (never changes)
```
row 6   ...HBBBBBBBBB...   highlight pixel top-left
row 7   ...BBBBBBBBB....
row 8   ..BBBEBBBEBBB...   one-pixel side nubs
row 9   ...BBEBBBEBB....   eyes 1×2, three body pixels apart
row 10  ...BBBBBBBBB....   may be one shade row (S)
row 11  ...O.O...O.O....   four stubby legs
row 12  ...O.O...O.O....
row 13  ...O.O...O.O....
```
`B` body · `S` shade · `H` highlight · `E` eye · `A` accent · `O` outline · `.` transparent.
After drawing, add a 1 px outline (`O`) on every transparent pixel that touches a filled, non-outline pixel (4-neighbourhood).
Blink frame: the top pixel of each two-pixel eye becomes `B`, the bottom one `S`.

## Palette
| Role | Terracotta (default) | Charcoal (night twin) |
|---|---|---|
| Outline | `#5A2A18` | `#121110` |
| Body | `#D97757` | `#3D3A36` |
| Shade | `#B85C3D` | `#2A2825` |
| Highlight | `#F4B89C` | `#6B6660` |
| Eyes | `#1F1E1D` | `#F0A27E` |
| Accent | `#F2C14E` | `#C9A227` |

These are sprite colours, not theme tokens: Bit keeps them in every theme (they live in the sprite data, exempt from `lint:tokens` like image assets).

## Variants (headgear in rows 0–5 only, 1–3 shapes, accent or highlight colour)
| Where | Headgear | Eyes | Palette |
|---|---|---|---|
| Home hero | graduation cap with tassel | blink every few seconds | terracotta |
| Accepted | crown | open | terracotta |
| Wrong answer / errors | sweat drop (highlight colour) beside the head | closed | terracotta |
| 404 | crying: no headgear; one highlight tear pixel under each eye, two falling drops (highlight colour, outline), 1 px sob in steps | closed | terracotta |
| Empty lists | nightcap | closed | charcoal |
| Loading swarm | cap, nightcap (charcoal twin), crown, antenna, none, one per Bit; 5 on desktop, 3 under 768 px (cap, nightcap, crown), 1 under reduced motion (cap) | open, blink once when the Bits stop | terracotta (one charcoal) |

Antenna: a 2×2 knob (rows 2–3) on a 1 px stalk (rows 4–5); rows 0–1 stay empty. Every headgear's last row sits directly above the body (row 6).

New variants: keep body, eyes, legs and palette identical; at most 1–2 px of pose change; the silhouette filled solid black must still read.
Motion: blinking, the loading swarm and the 404 sob. Blinking and the sob are disabled under `prefers-reduced-motion`; the 404's falling tears are hidden there. Loading Bits walk: the walk frame moves each leg one pixel inward and drops the sprite one pixel (`translateY`, the stand frame has no offset), hops lift it 6 px, and it faces its direction of travel. Under reduced motion one Bit stands still. Every placement has an `aria-label` (decorative placements next to a heading use `aria-hidden`); the loading swarm is `aria-hidden`. Sprite data and palettes live in `src/mascot/bit-sprite.ts`, the one source file that `lint:tokens` skips.

Reference mock-up: canvas section 5, artboard "Claw D" (https://claude.ai/artifact/KjFHNR7yonzVtbF8BUNmYW).
