# Short links (F5)

## F5-01

- Route: `POST /short-links` (429 `rate_limited`).
- Document: no field carries the daily creation limit (20 new links per user, staff with `judge.manage_short_link` exempt).
- Code needs: the number for the 429 text ("tối đa 20 liên kết ngắn"); `SHORT_LINK_DAILY_LIMIT` in `src/api/types/short-links.ts` mirrors the backend constant.
- Verdict: backend ask (low priority). Expose the limit in the 429 error body; until then a change of the backend constant needs the same change here.

## F5-02

- Route: `POST /short-links`, field `expiresAt`.
- Document: the backend accepts a past `expiresAt`, so a link can be created already dead.
- Code does: the create form refuses an expiry that is not after now (`ShortLinkCreateForm.vue`), so staff cannot slip.
- Verdict: backend ask. Refuse a past `expiresAt` with `invalid` on `expiresAt` (as integration clients do); the form already maps `invalid` per field only for `path` and `code`, so add the mapping when this lands.
