import { apiGet, apiGetPage, apiSend } from './typed';
import type {
  CreatePasteBody,
  CreateSubmissionShareBody,
  EditShareBody,
  ShareListQuery,
  ShareReportOutcome,
  ShareReportQueue,
  ShareReportReason,
} from './types/shares';

export const fetchShare = (code: string) => apiGet('/shares/{code}', { path: { code } });
export const fetchShares = (query: ShareListQuery) => apiGetPage('/shares', { query });
export const createPasteShare = (body: CreatePasteBody) =>
  apiSend('post', '/shares/pastes', { body });
export const createSubmissionShare = (body: CreateSubmissionShareBody) =>
  apiSend('post', '/shares/submissions', { body });
export const editShare = (code: string, body: EditShareBody) =>
  apiSend('patch', '/shares/{code}', { path: { code }, body });
export const deleteShare = (code: string) =>
  apiSend('delete', '/shares/{code}', { path: { code } });
export const takedownShare = (code: string, reason: string) =>
  apiSend('post', '/shares/{code}/takedown', { path: { code }, body: { reason } });
export const restoreShare = (code: string) =>
  apiSend('post', '/shares/{code}/restore', { path: { code } });
export const reportShare = (code: string, reason: ShareReportReason, note: string) =>
  apiSend('post', '/shares/{code}/reports', {
    path: { code },
    body: note ? { reason, note } : { reason },
  });
export const fetchShareReports = (page: number, status: ShareReportQueue) =>
  apiGetPage('/shares/reports', { query: { page, status } });
export const settleShareReports = (code: string, outcome: ShareReportOutcome) =>
  apiSend('post', '/shares/{code}/reports/settle', { path: { code }, body: { outcome } });
