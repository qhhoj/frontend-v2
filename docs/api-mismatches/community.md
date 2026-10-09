# Lane M5: blog, comments, tickets, home, flatpages, organizations

## M5-01

Routes: `PUT /posts/{id}/vote`, `PUT /comments/{id}/vote` (both answer `VoteResponse`).

- Document: `VoteResponse` is `{ score: number }`.
- Code needs: `viewerVote` (`-1 | 0 | 1`); `useVote` replaces the shown vote with the server's answer.
- Verdict: backend ask. The DTO class has `viewerVote!: VoteScore` and the service returns it, but the swagger plugin drops a property typed by an alias imported from `@libs/community`.
- File to change: `backend-v2/apps/api/src/modules/contributions/dto/vote.response.ts` (add `@ApiProperty({ enum: VOTE_SCORES })`, as `PostDetailResponse.viewerVote` does).
- Use sites: `votePost` in `src/api/blog.api.ts`, `voteComment` in `src/api/comments.api.ts`; the `VoteResponse` alias adds `viewerVote`.

## M5-02

Route: `GET /pages/{path}` (flatpages).

- Document: the operation has no `path` parameter (the controller reads the `*` wildcard), so the typed client rejects `{ path: { path } }`.
- Code needs: the nested url (`about/rules`) as the wildcard value. The typed client encodes it as one segment (`about%2Frules`); the server decodes it to the same `about/rules` (checked against fastify), so the wire changes but the result does not. `community.api.spec.ts` pins the new path.
- Verdict: backend ask. File to change: `backend-v2/apps/api/src/modules/site/public/flatpages.controller.ts` (add `@ApiParam({ name: 'path', description: 'Everything after /pages/' })`).
- Use site: `fetchFlatpage` in `src/api/flatpages.api.ts`.

## Checked, no mismatch

- `CommentResponse.viewerVote` exists in the document (the pre-check note was wrong); `Comment`, `CommentDetail`, `RecentComment` are plain aliases.
- `TicketListQuery`: the document makes every query member optional; the page keeps its filters complete, so the alias is `Required` except `open` (unset means both).
- The live ticket payload carries a `type` member (see `TicketPage.spec.ts`) that `TicketEventResponse` does not list; nothing reads it, so `TicketEvent` is the document's shape.
