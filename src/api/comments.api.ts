import type { CommentPageType, CommentReportOutcome, CommentReportQueue } from './types/comments';
import type { VoteScore } from './types/votes';
import { apiGet, apiGetPage, apiSend } from './typed';
import type { JsonBodyOf, QueryOf } from './typed';

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
/** `open`: comments with open reports, newest report first; `settled`: resolved or dismissed ones, newest settlement first. */
export const fetchCommentReports = (page: number, status: CommentReportQueue = 'open') =>
  apiGetPage('/comments/reports', { query: { page, status } });
export const settleCommentReports = (id: string, outcome: CommentReportOutcome) =>
  apiSend('post', '/comments/{id}/reports/settle', { path: { id }, body: { outcome } });
/** Up to 50 comments, one outcome; each id answers `code` null (settled) or the refusal's code. */
export const settleManyCommentReports = (ids: string[], outcome: CommentReportOutcome) =>
  apiSend('post', '/comments/reports/settle', { body: { ids, outcome } });
/** Backend `CommentModerationController` (`judge.change_comment`): locked pages, newest lock first, 50 a page. */
export const fetchCommentLocks = (page: number) =>
  apiGetPage('/comments/locks', { query: { page } });

export type AdminCommentQuery = NonNullable<QueryOf<'/admin/comments'>>;
/** Backend `CommentAdminController` (`judge.change_comment`): every comment of the site, newest first, 30 a page. */
export const fetchAdminComments = (query: AdminCommentQuery) =>
  apiGetPage('/admin/comments', { query });
/** Up to 50 at once; each id answers `code` null (done) or the refusal's code. */
export const setCommentsHidden = (ids: string[], hidden: boolean) =>
  apiSend('post', '/admin/comments/hidden', { body: { ids, hidden } });
