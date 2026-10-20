import type { SubmissionCase } from '@/api/types/submissions';
import { translate } from '@/i18n';

/** Judge text a case may carry, in reading order. */
const DETAIL_FIELDS = [
  { field: 'feedback', labelKey: 'submission.cases.feedback' },
  { field: 'extendedFeedback', labelKey: 'submission.cases.extendedFeedback' },
  { field: 'output', labelKey: 'submission.cases.output' },
] as const;

export interface CaseDetail {
  field: string;
  label: string;
  text: string;
}

/** The judge text of one test, labelled, empty fields left out. */
export const caseDetails = (testCase: SubmissionCase): CaseDetail[] =>
  DETAIL_FIELDS.flatMap(({ field, labelKey }) =>
    testCase[field] ? [{ field, label: translate(labelKey), text: testCase[field] }] : [],
  );
