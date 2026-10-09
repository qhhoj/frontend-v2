# Admin screens (M7)

## M7-01

Resolved (backend ba5db96): the document carries the `SettingKey` enum; `withKnownKey` is gone.

- Route: `GET /admin/settings`, `PATCH /admin/settings/{key}`, `POST /admin/settings/{key}/revisions/{revisionId}/restore` (`SettingResponse.key`).
- Document: `key: string`.
- Code needs: the registry's 15 keys as an enum, so the screen can index its per-key tables (`SettingKey`).
- Verdict: backend ask. Declare `key` with the registry key union in `apps/api/src/modules/settings/` (the `SettingResponse` DTO).

## M7-02

Resolved (backend ba5db96): `changes` is `{ before, after }` per field; the cast in `fetchFlatpageRevisions` is gone.

- Route: `GET /admin/site/pages/{id}/revisions` (`FlatpageRevisionResponse.changes`).
- Document: `changes: { [key: string]: unknown }`.
- Code needs: `{ [field]: { before: unknown; after: unknown } }`, which is what the backend sends.
- Verdict: backend ask. Type the value of `changes` in `flatpage-admin.response.ts` (`FlatpageRevisionResponse`).
