import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';
import type { UserSummary } from './problems';

// The editor reads these names from one place; the public contest types in `./contests` stay untouched.
export type { ContestFormatName, ContestPhase, LabelStyle, ScoreboardVisibility } from './contests';

/** backend: `UserSummaryResponse` (id and username). */
export type UserSummaryView = UserSummary;

/** backend: `ContestProblemResponse` as an editor reads it. */
export type EditableContestProblem = Schemas['ContestProblemResponse'];

/** backend: `ContestProblemOutputPrefixResponse`; null is the judge default. */
export type ContestOutputPrefix = Schemas['ContestProblemOutputPrefixResponse'];

/**
 * backend: `ContestSettingsResponse` (editors only). The id lists are user, organization or judge ids; `users` names the users.
 * The access codes are hashed and never returned: `hasRankingAccessCode` says one is set.
 */
export type ContestSettings = Schemas['ContestSettingsResponse'];

export type EditableContestViewer = Schemas['ContestViewerResponse'];

/** backend: `ContestDetailResponse` as the editor reads it. `settings` is null for a viewer who may not edit. */
export type EditableContest = Schemas['ContestDetailResponse'];

/** backend: `ContestProblemDto`: one entry of the contest's ordered problem list. */
export type ContestProblemBody = Schemas['ContestProblemDto'];

/** backend: `CreateContestDto` (the create body; every optional member may be left out). */
export type ContestBody = JsonBodyOf<'/contests', 'post'>;

/** backend: `UpdateContestDto` (PATCH): only the members that changed are sent. */
export type ContestPatch = JsonBodyOf<'/contests/{key}', 'patch'>;

/** backend: `AnnouncementResponse`. */
export type Announcement = Schemas['AnnouncementResponse'];

export type OfficialRankingRow = Schemas['OfficialRankingRowResponse'];

/** backend: `OfficialRankingResponse`: the stored official table, or 404 when none is stored (read as null). */
export type OfficialRanking = Schemas['OfficialRankingResponse'];

/** backend: `RankingLinkResponse`. The token is the public part of the URL. */
export type RankingLink = Schemas['RankingLinkResponse'];

/** backend: `UpdateRankingLinkDto`: `expiryAmount` for M (minutes) and D (days), `expiresAt` for A (at a time). */
export type RankingLinkPatch = JsonBodyOf<'/contests/{key}/ranking-link', 'patch'>;

/** backend: libs/contests `ContestActionState`: `queued` waits for the worker, `running` is being worked on now. */
export type ContestActionState = Schemas['ContestActionState'];

/** backend: `ContestActionsResponse`. */
export type ContestActions = Schemas['ContestActionsResponse'];

/** backend: `ContestDataStatusResponse`: the submissions export (a zip) and when it may be prepared again. */
export type ContestDataStatus = Schemas['ContestDataStatusResponse'];

/** backend: `ParticipationSummaryResponse`: what a disqualify answers (no user, no score). */
export type ParticipationSummary = Schemas['ParticipationSummaryResponse'];

/** backend: `ParticipationResponse`: one row of the participations list. */
export type Participation = Schemas['ParticipationResponse'];

/** backend: `PrepareDataDto`: the submissions export filter; empty fields are left out. */
export type PrepareDataBody = JsonBodyOf<'/contests/{key}/data', 'post'>;
