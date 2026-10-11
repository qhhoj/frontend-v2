import { apiSend } from './typed';
import type { JsonBodyOf } from './typed';

/** Contest editors' one-off operations: per-problem rejudge and rescore, hand-edited participations, delete. */

export type ProblemRejudgeOptions = JsonBodyOf<'/contests/{key}/problems/{code}/rejudge', 'post'>;
export const rejudgeContestProblem = (key: string, code: string, body: ProblemRejudgeOptions) =>
  apiSend('post', '/contests/{key}/problems/{code}/rejudge', { path: { key, code }, body });
export const rescoreContestProblem = (key: string, code: string) =>
  apiSend('post', '/contests/{key}/problems/{code}/rescore', { path: { key, code } });

export type AddParticipationBody = JsonBodyOf<'/contests/{key}/participations', 'post'>;
export const addParticipation = (key: string, body: AddParticipationBody) =>
  apiSend('post', '/contests/{key}/participations', { path: { key }, body });
export const moveParticipationStart = (key: string, id: string, realStart: string) =>
  apiSend('patch', '/contests/{key}/participations/{id}', {
    path: { key, id },
    body: { realStart },
  });
export const deleteParticipation = (key: string, id: string) =>
  apiSend('delete', '/contests/{key}/participations/{id}', { path: { key, id } });
export const recomputeParticipation = (key: string, id: string) =>
  apiSend('post', '/contests/{key}/participations/{id}/recompute', { path: { key, id } });

export const deleteContest = (key: string, confirm: string) =>
  apiSend('delete', '/contests/{key}', { path: { key }, query: { confirm } });

export const updateAnnouncement = (
  key: string,
  id: string,
  body: { title: string; description: string },
) => apiSend('patch', '/contests/{key}/announcements/{id}', { path: { key, id }, body });
export const previewAnnouncement = (key: string, description: string) =>
  apiSend('post', '/contests/{key}/announcements/preview', {
    path: { key },
    body: { description },
  });
