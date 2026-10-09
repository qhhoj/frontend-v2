# Lane M3: submissions, judges, similarity and event streams

No mismatches found.

Differences the swap brought, none breaking:

- `RejudgeBody.results` is `SubmissionResult[]` (the hand-written type said `string[]`); `RejudgeFilter.results` in `src/features/admin/rejudge/rejudge-filter.ts` and the rejudge count spec follow.
- `SubmissionProgressEvent` now carries `problemId` and `userId` (the document lists them; the hand-written type omitted them).
- `SubmissionDetail` no longer `extends SubmissionListItem` in the type system; both are generated schemas with the same members.
- `SimilarityScope` stays a UI shape (`@uiOnly`): the document takes both `problem` and `contest` optional, the page sends exactly one.
- `openEventStream(path, ...)` keeps taking a route path and adds the `/api/internal` prefix itself (pinned by `events.spec.ts` and used by the ticket and announcement feeds of other lanes), so the stream addresses are not built with `apiUrl`. Handler payloads are typed at the caller with `StreamData`.
