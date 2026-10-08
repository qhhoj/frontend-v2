/** backend: apps/api/src/modules/submissions/actions/dto/bulk-rejudge.dto.ts (BulkRejudgeDto) */
export interface RejudgeBody {
  problem: string;
  idFrom?: string;
  idTo?: string;
  languages?: string[];
  results?: string[];
  force?: boolean;
  dryRun?: boolean;
}

/** backend: BulkRejudgeResponse. `allowed`: within the limit of 10 or the caller holds `judge.rejudge_submission_lot`. */
export interface RejudgeResult {
  count: number;
  dryRun: boolean;
  allowed: boolean;
}
