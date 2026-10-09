# Lane M4: contests, rankings and contest editing

No mismatches found.

Every contest type and call now comes from the generated schema. Differences the swap brought, none breaking:

- `ContestSummary` and `RankingLinkPatch` have no class of that name in the document: `ContestSummary` is `Omit<ContestListItemResponse, 'viewer'>`, `RankingLinkPatch` is the body of `PATCH /contests/{key}/ranking-link` (`UpdateRankingLinkDto`).
- The public contest page and the editor read the same `ContestDetailResponse`, so `ContestDetail` and `EditableContest` now carry `settings`, `virtualCount` and `descriptionHtml` too, and `EditableContest.problems` / `viewer` have the full member lists (`solverCount`, `viewerResult`, `isCurrent`, `liveStatus`, `liveParticipation`). Only test fixtures changed.
- Ranking users carry `organization` and `rating` (nullable); `ProblemCell` is the document's `{ [key]: number | boolean | null }`.
- `prepareContestData` takes the document's body: `results` is the `SubmissionResult` code list, not `string[]`.
