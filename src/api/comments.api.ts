import { apiRequest } from './client';
import type {
  Comment,
  CommentDetail,
  CommentPageType,
  CommentRevision,
  CommentThreadPage,
  CommentVoteEntry,
} from './types/comments';
import type { VoteResponse, VoteScore } from './types/votes';

const pagePath = (type: CommentPageType, key: string) =>
  `/comments/pages/${type}/${encodeURIComponent(key)}`;
const commentPath = (id: string) => `/comments/${encodeURIComponent(id)}`;

export interface CommentDraft {
  body: string;
  /** Set for a reply. */
  parentId?: string;
}

export const fetchCommentPage = (type: CommentPageType, key: string, page: number) =>
  apiRequest<CommentThreadPage>(pagePath(type, key), { query: { page } });
export const fetchComment = (id: string) => apiRequest<CommentDetail>(commentPath(id));
export const postComment = (type: CommentPageType, key: string, draft: CommentDraft) =>
  apiRequest<Comment>(pagePath(type, key), { method: 'POST', body: draft });
export const editComment = (id: string, body: string) =>
  apiRequest<Comment>(commentPath(id), { method: 'PATCH', body: { body } });
export const fetchRevisions = (id: string) =>
  apiRequest<CommentRevision[]>(`${commentPath(id)}/revisions`);
export const voteComment = (id: string, score: VoteScore) =>
  apiRequest<VoteResponse>(`${commentPath(id)}/vote`, { method: 'PUT', body: { score } });
export const setCommentHidden = (id: string, hidden: boolean) =>
  apiRequest<CommentDetail>(`${commentPath(id)}/hidden`, { method: 'POST', body: { hidden } });
export const fetchCommentVotes = (id: string) =>
  apiRequest<CommentVoteEntry[]>(`${commentPath(id)}/votes`);
export const lockCommentPage = (type: CommentPageType, key: string) =>
  apiRequest<void>(`${pagePath(type, key)}/lock`, { method: 'PUT' });
export const unlockCommentPage = (type: CommentPageType, key: string) =>
  apiRequest<void>(`${pagePath(type, key)}/lock`, { method: 'DELETE' });
