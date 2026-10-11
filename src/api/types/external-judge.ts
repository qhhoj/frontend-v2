import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';

export type ExternalJudgeStatus = Schemas['ExternalJudgeStatusResponse'];
export type ExternalJudgeTestResult = Schemas['ExternalJudgeTestResponse'];
export type ExternalJudgeLink = Schemas['ExternalJudgeLinkResponse'];
export type ExternalJudgeLanguage = Schemas['ExternalJudgeLanguageResponse'];
export type ExternalJudgeLinkState = Schemas['ProblemExternalJudgeResponse'];
export type ExternalJudgeSearchItem = Schemas['ExternalJudgeSearchItemResponse'];
export type ExternalJudgeSearchPage = Schemas['ExternalJudgeSearchResponse'];
export type ExternalJudgeVerified = Schemas['ExternalJudgeVerifyResponse'];
export type ExternalJudgeVerifiedLanguage = Schemas['ExternalJudgeVerifyLanguageResponse'];
export type ExternalJudgeRun = Schemas['SubmissionExternalRunResponse'];
export type ExternalJudgeLinkBody = JsonBodyOf<'/problems/{code}/external-judge', 'put'>;
export type ExternalJudgeSearchBody = JsonBodyOf<'/problems/{code}/external-judge/search', 'post'>;
