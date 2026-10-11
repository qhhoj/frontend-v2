import { apiGet, apiSend } from './typed';
import type { ExternalJudgeLinkBody, ExternalJudgeSearchBody } from './types/external-judge';

/** Public: whether the external judge is configured and reachable (cached 60 s on the server). */
export const fetchExternalJudgeStatus = () => apiGet('/external-judge/status');

/** Asks the saved connection for its OJ list; needs `judge.change_settings`. */
export const testExternalJudgeConnection = () => apiSend('post', '/external-judge/test');

export const fetchExternalJudgeLink = (code: string) =>
  apiGet('/problems/{code}/external-judge', { path: { code } });

export const saveExternalJudgeLink = (code: string, body: ExternalJudgeLinkBody) =>
  apiSend('put', '/problems/{code}/external-judge', { path: { code }, body });

export const removeExternalJudgeLink = (code: string) =>
  apiSend('delete', '/problems/{code}/external-judge', { path: { code } });

export const searchExternalJudge = (code: string, body: ExternalJudgeSearchBody) =>
  apiSend('post', '/problems/{code}/external-judge/search', { path: { code }, body });

export const verifyExternalJudgeProblem = (code: string, oj: string, problemId: string) =>
  apiSend('post', '/problems/{code}/external-judge/verify', {
    path: { code },
    body: { oj, problemId },
  });
