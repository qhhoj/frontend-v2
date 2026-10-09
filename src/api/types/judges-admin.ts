/** One language a judge can run, as the judge reports it (`GET /judges` `runtimes`). */
export interface JudgeRuntime {
  language: string;
  name: string;
  version: string;
  priority: number;
}

/** A judging machine as the staff board shows it (backend `judges/dto/judge.response.ts`). */
export interface Judge {
  id: string;
  name: string;
  description: string;
  online: boolean;
  isBlocked: boolean;
  isDisabled: boolean;
  startTime: string | null;
  /** Mean of the last 6 pings, in seconds. */
  ping: number | null;
  load: number | null;
  lastIp: string | null;
  problemCount: number;
  runtimes: JudgeRuntime[];
}

/** The fields a staff member may change (`PATCH /judges/:name`, no nulls). */
export interface JudgePatch {
  isBlocked?: boolean;
  isDisabled?: boolean;
  description?: string;
}
