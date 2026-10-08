import { translate } from '@/i18n';

const groupsOfFour = (text: string) => text.match(/.{1,4}/g) ?? [];

/** `JBSWY3DPEHPK3PXP` → `JBSW Y3DP EHPK 3PXP`, for typing into an app by hand. */
export const groupSecret = (secret: string) => groupsOfFour(secret).join(' ');

/** `K7QM2XRA9PTD4WLE` → `K7QM-2XRA-9PTD-4WLE`, as shown and printed; every code field strips the dashes again. */
export const formatScratchCode = (code: string) => groupsOfFour(code).join('-');

/** The downloaded file: who it is for, then one code per line. */
export const scratchCodesText = (codes: readonly string[], username: string) =>
  [
    translate('settings.codes.fileHeader', { username }),
    '',
    ...codes.map(formatScratchCode),
    '',
  ].join('\n');
