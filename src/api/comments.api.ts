import type { CommentPageType, CommentReportOutcome } from './types/comments';
import type { VoteScore } from './types/votes';
import { apiGet, apiGetPage, apiSend } from './typed';
import type { JsonBodyOf } from './typed';

export type CommentDraft = JsonBodyOf<'/comments/pages/{type}/{key}', 'post'>;
export type CommentReportDraft = JsonBodyOf<'/comments/{id}/reports', 'post'>;

export const fetchCommentPage = (type: CommentPageType, key: string, page: number) =>
  apiGet('/comments/pages/{type}/{key}', { path: { type, key }, query: { page } });
export const fetchComment = (id: string) => apiGet('/comments/{id}', { path: { id } });
export const postComment = (type: CommentPageType, key: string, draft: CommentDraft) =>
  apiSend('post', '/comments/pages/{type}/{key}', { path: { type, key }, body: draft });
export const editComment = (id: string, body: string) =>
  apiSend('patch', '/comments/{id}', { path: { id }, body: { body } });
export const fetchRevisions = (id: string) => apiGet('/comments/{id}/revisions', { path: { id } });
export const voteComment = (id: string, score: VoteScore) =>
  apiSend('put', '/comments/{id}/vote', { path: { id }, body: { score } });
export const setCommentHidden = (id: string, hidden: boolean) =>
  apiSend('post', '/comments/{id}/hidden', { path: { id }, body: { hidden } });
export const fetchCommentVotes = (id: string) => apiGet('/comments/{id}/votes', { path: { id } });
export const lockCommentPage = (type: CommentPageType, key: string) =>
  apiSend('put', '/comments/pages/{type}/{key}/lock', { path: { type, key } });
export const unlockCommentPage = (type: CommentPageType, key: string) =>
  apiSend('delete', '/comments/pages/{type}/{key}/lock', { path: { type, key } });
export const previewComment = async (body: string) =>
  (await apiSend('post', '/comments/preview', { body: { body } })).bodyHtml;
export const deleteComment = (id: string) => apiSend('delete', '/comments/{id}', { path: { id } });
export const reportComment = (id: string, report: CommentReportDraft) =>
  apiSend('post', '/comments/{id}/reports', { path: { id }, body: report });
export const locateComment = (id: string) => apiGet('/comments/{id}/location', { path: { id } });
export const fetchCommentReports = (page: number) =>
  apiGetPage('/comments/reports', { query: { page } });
export const settleCommentReports = (id: string, outcome: CommentReportOutcome) =>
  apiSend('post', '/comments/{id}/reports/settle', { path: { id }, body: { outcome } });
