# QHHOJ

The domain glossary for all three repos lives in backend-v2: [GLOSSARY.md](https://github.com/qhhoj/backend-v2/blob/main/GLOSSARY.md). The terms below are the ones that only exist in the UI.

- **Bit**: the pixel mascot (`src/mascot/`, notes in `design-system/qhhoj/mascot.md`). Each placement picks a mood; never the Anthropic or Claude mark.
- **Clay**: the design language and its default theme, "Clay & ivory". Its parts are the kit in `src/components/ui/`; Glass is the optional second theme family.
- **Official mode**: a site-wide state the backend announces through `GET /site` (`officialMode`, `officialModeEndsAt`) while an official contest runs; it locks some controls (`src/features/official-mode/`).
- **Ghost**: a row imported from a CSV into a contest's replay for someone who took part off-site; it has no account (`src/features/admin/contests/ghosts/`).
- **Replay**: the finished contest played back in time, with real and ghost rows (`src/features/contests/replay/`). Not a virtual run, which is a Participation.
- **Balloon**: the physical balloon a volunteer delivers for a first solve; the balloon queue is `src/features/contests/balloons/`.
- **Flatpage**: a static page (about, rules) edited by staff and served by a catch-all route; admin folder `features/admin/pages/`.
- **pp**: performance points, the `performancePoints` sort and the profile's pp tab.
- **cumtime**: the cumulative time shown under a points cell (`showsCumtime`, `src/lib/ranking-cells.ts`).

**Ranking / board / scoreboard / leaderboard / standings**: the contest's table of rows is the ranking (the `ranking.*` texts, `Ranking*` files); "board" is the same table in prose, as in "board frozen" and "board hidden"; the site-wide table of users is the leaderboard (`LEADERBOARD_SORTS`, `/users`). Avoid scoreboard and standings in new code.
