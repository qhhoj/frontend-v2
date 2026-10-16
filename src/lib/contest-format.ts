import { translate } from '@/i18n';

/** The user-facing name of a contest format id (`default` is the points format, never shown as "Default"). */
export const formatLabel = (formatName: string): string => translate(`formats.${formatName}`);
