import type { CannedReply, CannedReplyBody, CannedReplyPatch } from '@/api/types/tickets';
import {
  CANNED_REPLIES_MAX,
  CANNED_REPLY_BODY_MAX_LENGTH,
  CANNED_REPLY_ORDER_MAX,
  CANNED_REPLY_TITLE_MAX_LENGTH,
} from '@/api/types/tickets';
import { translate } from '@/i18n';
import { failureTextOf, isConflict, isNotFound } from '../ui/admin-errors';
import type { FieldErrors } from '../ui/admin-errors';

/** @uiOnly the dialog's fields; `order` is text so an empty box means "put it last". */
export interface CannedReplyForm {
  title: string;
  body: string;
  order: string;
}
/** @uiOnly the request a save sends. */
export type CannedReplySave =
  | { kind: 'create'; body: CannedReplyBody }
  | { kind: 'update'; id: string; body: CannedReplyPatch };

const DIALOG = 'admin.cannedReplies.dialog';
/** Code points, as the backend's `Length` counts them (a surrogate pair is one). */
const lengthOf = (text: string) => [...text].length;
const isWholeOrder = (text: string) =>
  /^\d+$/.test(text.trim()) && Number(text) <= CANNED_REPLY_ORDER_MAX;
const orderOf = (text: string) => (text.trim() === '' ? undefined : Number(text));

export const toCannedReplyForm = (reply: CannedReply | null): CannedReplyForm => ({
  title: reply?.title ?? '',
  body: reply?.body ?? '',
  order: reply ? String(reply.order) : '',
});

function textError(field: 'title' | 'body', text: string, max: number): string | undefined {
  if (text === '') return translate(`${DIALOG}.${field}Required`);
  const used = lengthOf(text);
  return used > max ? translate(`${DIALOG}.${field}TooLong`, { used, max }) : undefined;
}

/** The same rules as the backend DTO, so most refusals never leave the browser. */
export function checkCannedReplyForm(form: CannedReplyForm): FieldErrors {
  const errors: FieldErrors = {};
  const title = textError('title', form.title.trim(), CANNED_REPLY_TITLE_MAX_LENGTH);
  const body = textError('body', form.body.trim(), CANNED_REPLY_BODY_MAX_LENGTH);
  if (title) errors.title = title;
  if (body) errors.body = body;
  if (form.order.trim() !== '' && !isWholeOrder(form.order))
    errors.order = translate(`${DIALOG}.orderInvalid`, { max: CANNED_REPLY_ORDER_MAX });
  return errors;
}

function changesOf(reply: CannedReply, form: CannedReplyForm): CannedReplyPatch {
  const changes: CannedReplyPatch = {};
  const order = orderOf(form.order);
  if (form.title.trim() !== reply.title) changes.title = form.title.trim();
  if (form.body.trim() !== reply.body) changes.body = form.body.trim();
  if (order !== undefined && order !== reply.order) changes.order = order;
  return changes;
}

/** Create sends the trimmed text (and the order when given); update sends only what changed. */
export function cannedReplySave(reply: CannedReply | null, form: CannedReplyForm): CannedReplySave {
  if (reply) return { kind: 'update', id: reply.id, body: changesOf(reply, form) };
  const order = orderOf(form.order);
  return {
    kind: 'create',
    body: {
      title: form.title.trim(),
      body: form.body.trim(),
      ...(order === undefined ? {} : { order }),
    },
  };
}

/** 409 is the 100 cap (C10), 404 a reply deleted elsewhere; anything else reads as usual. */
export function cannedReplyRefusal(error: unknown): string {
  if (isConflict(error)) return translate('admin.cannedReplies.full', { max: CANNED_REPLIES_MAX });
  if (isNotFound(error)) return translate('admin.cannedReplies.gone');
  return failureTextOf(error);
}
