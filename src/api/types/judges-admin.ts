import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';

/** One language a judge can run, as the judge reports it. */
export type JudgeRuntime = Schemas['JudgeRuntimeResponse'];
/** A judging machine as the staff board shows it. */
export type Judge = Schemas['JudgeResponse'];
/** The fields a staff member may change (`PATCH /judges/{name}`). */
export type JudgePatch = JsonBodyOf<'/judges/{name}', 'patch'>;
/** The judging queue's health (`GET /judges/queue`). */
export type JudgeQueue = Schemas['JudgeQueueResponse'];
