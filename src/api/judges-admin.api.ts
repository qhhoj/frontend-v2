import { apiGet, apiSend } from './typed';
import type { JsonBodyOf } from './typed';
import type { JudgePatch } from './types/judges-admin';

export const fetchJudges = () => apiGet('/judges');
export const createJudge = (body: JsonBodyOf<'/judges', 'post'>) =>
  apiSend('post', '/judges', { body });
export const updateJudge = (name: string, patch: JudgePatch) =>
  apiSend('patch', '/judges/{name}', { path: { name }, body: patch });
export const rotateJudgeKey = (name: string) =>
  apiSend('post', '/judges/{name}/key', { path: { name } });
export const disconnectJudge = (name: string, force: boolean) =>
  apiSend('post', '/judges/{name}/disconnect', { path: { name }, body: { force } });
/** Only an offline judge (409 `judge_online` otherwise). */
export const deleteJudge = (name: string) =>
  apiSend('delete', '/judges/{name}', { path: { name } });
/** QU/P/G counts, per priority, per language with usable online judges, per pinned judge. */
export const fetchJudgeQueue = () => apiGet('/judges/queue');
