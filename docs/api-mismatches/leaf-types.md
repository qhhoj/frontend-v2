# Lane M0: shared leaf types

No mismatches found.

`UserSummary`, `StatementLanguage`, `OrganizationSummary`, `PostListItem`, `VoteScore`, `SubmissionListItem` and the contest enums (`ContestFormatName`, `ContestPhase`, `ScoreboardVisibility`, `LabelStyle`) are aliases of the generated schemas. Every consumer compiled unchanged, so no consumer or fixture was edited.

Differences the swap brought, none breaking:

- `PostListItem` now carries `commentCount` (the document lists it; the hand-written type omitted it).
- `SubmissionListItem.user`, `.problem`, `.language` are the named schemas `UserSummaryResponse`, `SubmissionProblemResponse`, `SubmissionLanguageResponse`; the shapes are the same as before.
