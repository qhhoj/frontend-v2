import { translate } from '@/i18n';

/** The backend's catch-all problem type; its `fullName` is Vietnamese-only, so it is translated. */
export const UNCATEGORIZED_TYPE_NAME = 'uncategorized';

/** Display label for a problem type: the catch-all gets its i18n label, other types their `fullName`. */
export const problemTypeLabel = (type: { name: string; fullName: string }): string =>
  type.name === UNCATEGORIZED_TYPE_NAME ? translate('problems.uncategorized') : type.fullName;
