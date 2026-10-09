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
| Judging (submission pending or grading; `judging`) | hourglass held above the head, sand drains (rows 0–5) | blink in the loop | terracotta |
| Contest running (`contest`) | stopwatch above the head, hand ticks round the dial | blink in the loop | terracotta |
| Rating went up (`rankUp`) | up arrow above the head, bobs | blink in the loop | terracotta |
| Welcome, log in (`welcome`) | raised arm, 4 px (waves) | blink in the loop | terracotta |
| Sign-up, check email (`envelope`) | envelope held above the head, flap opens and shuts | blink in the loop | terracotta |
| Writing (`writing`) | quill beside the head, writes a line of dots | blink in the loop | terracotta |
| Security, two-factor (`security`) | padlock beside the head, shackle opens, clicks shut | blink in the loop | terracotta |
| Staff, admin area (`staff`) | hard hat (rows 0–5), double nod | blink in the loop | terracotta |
| Community (`community`) | three Bits on a podium, hop in turn; the third is the charcoal twin | blink in the loop | terracotta, charcoal (third) |

Antenna: a 2×2 knob (rows 2–3) on a 1 px stalk (rows 4–5); rows 0–1 stay empty. Every headgear's last row sits directly above the body (row 6).

New variants: keep body, eyes, legs and palette identical; at most 1–2 px of pose change; the silhouette filled solid black must still read.
Exception (approved): `welcome` (4B, raised arm) moves its arm 4 px, because the 2 px rule read as a bare wave. No other variant may exceed 2 px without a new approval.
Motion: blinking, the loading swarm, the 404 sob and the loops below.
Loops (`src/mascot/bit-frames.ts`, one loop per kind; `frameMs` is each frame's time): frames were run out of the approved preview's own frame engine and copied as data, so a change starts from the preview (the engine's grids and timings), not from a hand-edited frame. Blinks are part of each loop's frames, so a loop has no periodic blink of its own. `useSpriteLoop` (`src/mascot/use-sprite-loop.ts`, used by `BitLoop.vue`) runs one timer per Bit, only while it is mounted and on screen (IntersectionObserver where it exists); it stops off screen, holds its frame, and clears on unmount. Under reduced motion every loop shows frame 0 and runs no timer. The placement is decorative (`aria-hidden`) beside text that already says the state; `BitLoop` takes a `label` when it stands alone. The sprite of a loop keeps the box of its frame 0, so a loop never moves the layout; the skeleton of a placement reserves the same box. Blinking and the sob are disabled under `prefers-reduced-motion`; the 404's falling tears are hidden there. Loading Bits walk: the walk frame moves each leg one pixel inward and drops the sprite one pixel (`translateY`, the stand frame has no offset), hops lift it 6 px, and it faces its direction of travel. Under reduced motion one Bit stands still. Every placement has an `aria-label` (decorative placements next to a heading use `aria-hidden`); the loading swarm is `aria-hidden`. Sprite data and palettes live in `src/mascot/bit-sprite.ts` and, for avatars, `src/mascot/avatar/avatar-sprites.ts`; these are the sprite files that `lint:tokens` skips.

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

## Reserve (approved previews, not implemented)
The 18 options below were shown in the [approved preview](.superpowers/designs/bitmotion/index.html) (kept with the design work, not in this repo) and are not built. Pick one, then add its frames to `bit-frames.ts` and its kind to the table above.
- Judging: magnifier sweeps left and right (1B); gear, teeth alternate (1C).
- Contest: headband tail flutters (2A); flame flickers (2C).
- Rank up: trophy, highlight sweeps the cup (3A); party hat, confetti falls (3C).
- Welcome: small wave, 2 px (4A); bow (4C).
- Sign-up: party hat, confetti falls (5B); paper plane glides in (5C).
- Writing: pencil writes a line of dots (6A); beret, stalk wiggles (6C).
- Security: key, teeth flip and the key pushes in (7A); shield, a shine sweeps across (7B).
- Staff: wrench, jaws open and close (8B); headset, ear cups pulse (8C).
- Community: two Bits hop (9A); pennant, tail ripples (9B).
