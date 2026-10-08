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
Motion: blinking, the loading swarm and the 404 sob. Blinking and the sob are disabled under `prefers-reduced-motion`; the 404's falling tears are hidden there. Loading Bits walk: the walk frame moves each leg one pixel inward and drops the sprite one pixel (`translateY`, the stand frame has no offset), hops lift it 6 px, and it faces its direction of travel. Under reduced motion one Bit stands still. Every placement has an `aria-label` (decorative placements next to a heading use `aria-hidden`); the loading swarm is `aria-hidden`. Sprite data and palettes live in `src/mascot/bit-sprite.ts` and, for avatars, `src/mascot/avatar/avatar-sprites.ts`; these are the sprite files that `lint:tokens` skips.

Reference mock-up: canvas section 5, artboard "Claw D" (https://claude.ai/artifact/KjFHNR7yonzVtbF8BUNmYW).

## Avatar

Every user has a Bit avatar generated from the username (scheme C, "Kết hợp", chosen from the avatar design board). It is decorative: the name always sits next to it. Code: `src/mascot/avatar/` (`bit-avatar.ts` for the pure functions, `avatar-sprites.ts` for the data, `UserAvatar.vue`).

**Hash.** `h = fmix32(FNV-1a-32(UTF-8(NFC(username).toLowerCase())))`, with FNV offset `0x811C9DC5`, prime `0x01000193`, and the murmur3 finaliser `fmix32`. A username change gives a new Bit.

**Digits.** Read `h` as mixed-radix digits, lowest first: `d = h mod r; h = ⌊h / r⌋`. The order is fixed:

| Digit | Picks | r | Bits taken | Entries, in digit order |
|---|---|---|---|---|
| d0 | body palette | 12 | `h mod 12` | terracotta, marigold, leaf, jade, teal, sky, indigo, violet, orchid, rose, sand, slate |
| d1 | hat | 16 | `⌊h/12⌋ mod 16` | none, cap, crown, antenna, nightcap, beret, headband, hardhat, party, headset, flame, gear, pennant, heart, sprout, bow |
| d2 | tile colour | 8 | `⌊h/192⌋ mod 8` | sand, sage, sky, butter, lavender, mint, peach, stone |
| d3 | body pattern | 4 | `⌊h/1536⌋ mod 4` | none, patch, stripe, blush |
| d4 | eyes | 4 | `⌊h/6144⌋ mod 4` | open, closed, wink, side |

The 12 × 16 × 8 × 4 × 4 = 24 576 looks are the same for every name, in every theme. The digit lists and the data are in `avatar-sprites.ts`; never reorder or insert, since that changes every Bit.

**Allowed rule bends (avatars only).** Compared with the single Bit above, the avatar may: use the 12 palettes instead of terracotta and charcoal; add the 16 hats (rows 0–5 only, one `O` or `H` accent allowed); colour the tile square behind the body; add the body pattern (patch, stripe, blush, which change only a few body pixels); and use the 4 eye styles (wink and side glance rewrite pixels in rows 8–9). The body rows, legs, 1 px outline and six-role palette stay. Items beside the feet are not used, so the 24 px silhouette matches Bit.

**Banned and deleted.** Both get one fixed look that ignores the name: a grey Bit with no hat, closed eyes, and the grey palette on a grey tile (`#E8E2D8`). The status is also written as text next to the name, so colour is never the only signal.

**Sizes.** 24, 28, 32, 96 and 128 px. The 16×16 grid is scaled with cell edges at `⌊i · size / 16⌋`, and each row's runs of one colour become one rect, so `shape-rendering="crispEdges"` gives crisp pixels. 32, 96 and 128 are whole-pixel multiples; 24 and 28 mix 1 and 2 px columns. The tile corner radius is 22 % of the size (rounded to whole pixels), and the box never changes size, so it causes no layout shift. Skeletons reserve the same square.

**Where.** Home top users 24, submissions list rows 24, submission detail author 32, contest ranking rows 24, header user menu 28.
