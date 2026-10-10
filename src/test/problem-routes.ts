import type { ProblemDetail } from '@/api/types/problems';
import type { SubmissionDetail } from '@/api/types/submissions';
import {
  problemDetail,
  problemMeta,
  profile,
  signedIn,
  signedOut,
  submissionDetail,
  submissionItem,
  submissionStats,
} from './fixtures';
import { ok, page } from './mock-api';

/** What the shell asks of an anonymous visitor. */
export const anonymousViewer = { 'GET /auth/me': signedOut };
/** A signed-in viewer: the session and the profile the account theme and the dock read. */
export const signedInViewer = (overrides: Parameters<typeof signedIn>[0] = {}) => ({
  'GET /auth/me': signedIn(overrides),
  'GET /profile': ok(profile()),
});
/** `GET /problems/:code` for one problem (add `GET /problems/<code>/editorial` yourself where a test opens that tab). */
export const problemPageRoutes = (detail: ProblemDetail = problemDetail()) => ({
  [`GET /problems/${encodeURIComponent(detail.code)}`]: ok(detail),
  /** The rail's "my submissions" of a signed-in viewer. */
  'GET /submissions': page([]),
});
/** The detail and the source of one submission. */
export const submissionPageRoutes = (detail: SubmissionDetail = submissionDetail()) => ({
  [`GET /submissions/${detail.id}`]: ok(detail),
  [`GET /submissions/${detail.id}/source`]: ok({ id: detail.id, source: 'int main() {}\n' }),
});
/** The submission list page: rows, stats and the language list of the filter rail. */
export const submissionListRoutes = {
  'GET /submissions': page([submissionItem()]),
  'GET /submissions/stats': ok(submissionStats()),
  'GET /problems/meta': ok(problemMeta()),
};
