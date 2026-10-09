import type { QuotaChanges } from '@/api/types/organization-usage';
import { MEBIBYTE } from '@/lib/quota';

/** The editor's boxes as typed; '' means "site default". */
export interface QuotaForm {
  credits: string;
  storageMib: string;
}
/** Backend `UpdateQuotaDto` limits: credits ≤ 1 000 000, storage ≤ 2^40 bytes (1 048 576 MiB). */
const MAX_CREDITS = 1_000_000;
const MAX_STORAGE_MIB = 1_048_576;
const WHOLE_NUMBER = /^\d+$/;

export const quotaFormOf = (quota: {
  monthlyCredits: number | null;
  storageBytes: number | null;
}): QuotaForm => ({
  credits: quota.monthlyCredits === null ? '' : String(quota.monthlyCredits),
  storageMib: quota.storageBytes === null ? '' : String(Math.round(quota.storageBytes / MEBIBYTE)),
});

const isValid = (text: string, max: number) =>
  text.trim() === '' || (WHOLE_NUMBER.test(text.trim()) && Number(text.trim()) <= max);

/** Values are i18n keys; an empty box is always valid. */
export function quotaFormErrors(form: QuotaForm): { credits?: string; storageMib?: string } {
  return {
    ...(isValid(form.credits, MAX_CREDITS) ? {} : { credits: 'admin.quota.errors.credits' }),
    ...(isValid(form.storageMib, MAX_STORAGE_MIB)
      ? {}
      : { storageMib: 'admin.quota.errors.storage' }),
  };
}

const valueOf = (text: string, scale: number): number | null =>
  text.trim() === '' ? null : Number(text.trim()) * scale;

/** The PATCH body: only boxes that differ from what was loaded; an emptied box sends null. */
export function quotaBodyOf(form: QuotaForm, original: QuotaForm): QuotaChanges {
  return {
    ...(form.credits.trim() === original.credits
      ? {}
      : { quotaMonthlyCredits: valueOf(form.credits, 1) }),
    ...(form.storageMib.trim() === original.storageMib
      ? {}
      : { quotaStorageBytes: valueOf(form.storageMib, MEBIBYTE) }),
  };
}
