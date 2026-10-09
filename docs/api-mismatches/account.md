# Account, profile, users and leaderboards: API mismatches

No mismatches found. The swap needed no `trustedUntilBackendFixed`.

Notes (not mismatches):

- `POST /profile/data` answers `QueuedResponse` (`queued: boolean`); the old hand-written type said `{ queued: true }`. No caller reads the flag.
- `verifySecurityKey` takes `Record<string, unknown>` (was `object`), as the document types `response`.
