import type { Schemas } from '../schemas';
import type { JsonBodyOf, QueryOf } from '../typed';

/** backend: contests/balloons/dto/balloons.dto.ts (BalloonResponse) */
export type Balloon = Schemas['BalloonResponse'];
/** backend: balloons.dto.ts BALLOON_STATES */
export type BalloonState = Schemas['BalloonState'];
/** The balloon list's query with every member chosen by the page. */
export type BalloonQuery = Required<QueryOf<'/contests/{key}/balloons'>>;
/** One delivery target: a team's participation and a problem. */
export type BalloonRef = Pick<Balloon, 'participationId' | 'problemId'>;
/** @uiOnly the two queue counts B6 adds to the page meta (`pendingTotal`, `deliveredTotal`); the paginated envelope documents a generic meta, so they are read by name at run time. */
export type BalloonCounts = { pendingTotal: number | null; deliveredTotal: number | null };
/** @uiOnly one page of the queue as the balloon screen reads it: the rows, the row total and the queue counts. */
export type BalloonPage = { items: Balloon[]; total: number; counts: BalloonCounts };

/** backend: contests/publish/dto/publish-problems.response.ts (PublishProblemsResponse) */
export type PublishProblemsResult = Schemas['PublishProblemsResponse'];
/** backend: publish-problems.response.ts (PublishedProblemResponse); `code` is null when the problem is gone. */
export type PublishedProblem = Schemas['PublishedProblemResponse'];
/** backend: contests/publish/dto/publish-problems.dto.ts (PublishProblemsDto), both choices always sent. */
export type PublishOptions = Required<JsonBodyOf<'/contests/{key}/publish-problems', 'post'>>;

/** backend: contests/feed/dto/feed-key.dto.ts (FeedKeyStatusResponse) */
export type FeedKeyStatus = Schemas['FeedKeyStatusResponse'];
/** backend: feed-key.dto.ts (MintedFeedKeyResponse): the only time the key is shown. */
export type MintedFeedKey = Schemas['MintedFeedKeyResponse'];
/** backend: libs/database FEED_KEY_MODES */
export type FeedKeyMode = Schemas['FeedKeyMode'];
/** backend: feed-key.dto.ts (MintFeedKeyDto) */
export type MintFeedKeyBody = JsonBodyOf<'/contests/{key}/feed-key', 'post'>;

/** backend: contests/export/dto (ContestExportStatusResponse) */
export type ContestExportStatus = Schemas['ContestExportStatusResponse'];
