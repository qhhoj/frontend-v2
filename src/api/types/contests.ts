import type { Schemas } from '../schemas';
import type { QueryOf } from '../typed';
/** backend: libs/contests/src/contest-time.ts */
export type ContestPhase = Schemas['ContestPhase'];
/** backend: libs/database contest.schema.ts CONTEST_FORMAT_NAMES */
export type ContestFormatName = Schemas['ContestFormatName'];
/** backend: contest.schema.ts SCOREBOARD_VISIBILITIES: Visible, Hidden, hidden during the Contest, hidden during the Participation. */
export type ScoreboardVisibility = Schemas['ScoreboardVisibility'];
export type LabelStyle = Schemas['ContestLabelStyle'];

/** backend: libs/contests LIVE_STATUSES; the viewer's own live participation in the contest. */
export type LiveStatus = NonNullable<ContestListViewer['liveStatus']>;

/** backend: contest-list.response.ts ContestListItemResponse without the viewer and the list-only editor block: the fields of every contest view. */
export type ContestSummary = Omit<ContestListItem, 'viewer' | 'editor'>;

/** backend: contest-list.response.ts ContestListViewerResponse: the signed-in viewer's own state in one contest. */
export type ContestListViewer = Schemas['ContestListViewerResponse'];

/** backend: contest-list.response.ts ContestListItemResponse; `viewer` is null for a signed-out visitor. */
export type ContestListItem = Schemas['ContestListItemResponse'];

/** backend: contest-detail.response.ts ContestProblemViewerResultResponse */
export type ProblemViewerResult = Schemas['ContestProblemViewerResultResponse'];

/** backend: contest-detail.response.ts ContestProblemResponse */
export type ContestProblem = Schemas['ContestProblemResponse'];

/** backend: contest-detail.response.ts ParticipationSummaryResponse */
export type ParticipationSummary = Schemas['ParticipationSummaryResponse'];

/** backend: contest-detail.response.ts ContestViewerResponse; non-null for a visitor too (then all false and null). */
export type ContestViewer = Schemas['ContestViewerResponse'];

/** backend: contest-detail.response.ts ContestDetailResponse (settings are editor-only and unused here). */
export type ContestDetail = Schemas['ContestDetailResponse'];

/** backend: participation.response.ts CurrentParticipationResponse */
export type CurrentParticipation = Schemas['CurrentParticipationResponse'];

/** backend: announcements/dto/announcement.response.ts */
export type Announcement = Schemas['AnnouncementResponse'];

/** backend: stats/dto/contest-stats.response.ts */
export type ContestProblemResults = Schemas['ContestProblemResultsResponse'];
export type ContestProblemStats = Schemas['ContestProblemStatsResponse'];
export type ContestLanguageStats = Schemas['ContestLanguageStatsResponse'];
export type ContestStats = Schemas['ContestStatsResponse'];

/** backend: contests/core/dto/contest-list.dto.ts (the filters the SPA uses). */
export type ContestListQuery = QueryOf<'/contests'>;

/**
 * backend: libs/contests/src/formats/format.ts ProblemCell; the keys depend on the contest's `formatName`.
 * - default, ioi, ioi16, ultimate, final_submission: `time`, `points`.
 * - icpc: `time` (s from start), `points`, `tries`, `pending` (boolean, frozen boards only).
 * - vnoj: `time` (s from start), `points`, `penalty` (wrong tries), `pending` (number of pending submissions).
 */
export type ProblemCell = NonNullable<ProblemViewerResult['cell']>;

/** backend: contests/ranking/dto/ranking.response.ts */
export type RankingProblem = Schemas['RankingProblemResponse'];
export type RankingRow = Schemas['RankingRowResponse'];
export type Ranking = Schemas['RankingResponse'];
