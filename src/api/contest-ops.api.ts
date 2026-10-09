import { apiGet, apiSend, apiUrl } from './typed';
import type { MintFeedKeyBody, PublishOptions } from './types/contest-ops';

export const publishProblems = (key: string, body: PublishOptions) =>
  apiSend('post', '/contests/{key}/publish-problems', { path: { key }, body });

export const fetchFeedKey = (key: string) => apiGet('/contests/{key}/feed-key', { path: { key } });
export const mintFeedKey = (key: string, body: MintFeedKeyBody) =>
  apiSend('post', '/contests/{key}/feed-key', { path: { key }, body });
export const revokeFeedKey = (key: string) =>
  apiSend('delete', '/contests/{key}/feed-key', { path: { key } });
export const releaseFeedKey = (key: string) =>
  apiSend('post', '/contests/{key}/feed-key/release', { path: { key } });

export const fetchContestExport = (key: string) =>
  apiGet('/contests/{key}/export', { path: { key } });
export const prepareContestExport = (key: string) =>
  apiSend('post', '/contests/{key}/export', { path: { key } });
/** A plain link: the zip downloads with the session cookie, no envelope. */
export const contestExportDownloadUrl = (key: string) =>
  apiUrl('/contests/{key}/export/download', { path: { key } });
/** The resolver addresses shown on the Data tab; the SPA never calls them (HTTP Basic with the feed key). */
export const contestFeedUrl = (key: string) => apiUrl('/contests/{key}/feed', { path: { key } });
export const contestFeedStreamUrl = (key: string) =>
  apiUrl('/events/contests/{key}/feed', { path: { key } });
