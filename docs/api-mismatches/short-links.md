# Short links (F5)

## F5-01

- Route: `POST /short-links` (429 `rate_limited`).
- Document: no field carries the daily creation limit (20 new links per user, staff with `judge.manage_short_link` exempt).
- Code needs: the number for the 429 text ("tối đa 20 liên kết ngắn"); `SHORT_LINK_DAILY_LIMIT` in `src/api/types/short-links.ts` mirrors the backend constant.
- Verdict: backend ask (low priority). Expose the limit in the 429 error body; until then a change of the backend constant needs the same change here.
