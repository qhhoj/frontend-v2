import type { PostCreateBody, PostPatch } from '@/api/blog.api';
import type { UserChip } from '@/api/types/admin-common';
import type { PostDetail } from '@/api/types/blog';
import { translate } from '@/i18n';
import type { FieldErrors } from '@/features/admin/ui/admin-errors';
import { fromLocalInput, toLocalInput } from '@/features/admin/ui/datetime';

/** backend: libs/community BLOG_TITLE_MAX_LENGTH and the `ogImage` DTO limit. */
export const POST_LIMITS = { title: 100, ogImage: 150 } as const;
const IMAGE_PATTERN = /^(|https?:\/\/[^\s"'<>]+|\/[^\s"'<>]*)$/;

/** The editor's state: `publishOn` is the `datetime-local` value (empty: now). */
export interface PostForm {
  title: string;
  content: string;
  summary: string;
  ogImage: string;
  publishOn: string;
  visible: boolean;
  sticky: boolean;
  globalPost: boolean;
  authors: UserChip[];
}

/** A new post starts as a draft, published now once shown. */
export const emptyPostForm = (): PostForm => ({
  title: '',
  content: '',
  summary: '',
  ogImage: '',
  publishOn: '',
  visible: false,
  sticky: false,
  globalPost: false,
  authors: [],
});

export const postFormOf = (post: PostDetail): PostForm => ({
  title: post.title,
  content: post.content ?? '',
  summary: post.summary ?? '',
  ogImage: post.ogImage,
  publishOn: toLocalInput(String(post.publishOn)),
  visible: post.visible,
  sticky: post.sticky,
  globalPost: post.globalPost,
  authors: post.authors.map((author) => ({ id: author.id, username: author.username })),
});

/** `mode` is the visibility chosen: a scheduled post needs a time ahead. */
export function checkPostForm(form: PostForm, mode: PublishMode): FieldErrors {
  const errors: FieldErrors = {};
  const title = form.title.trim();
  if (title.length === 0 || title.length > POST_LIMITS.title)
    errors.title = translate('admin.postEditor.errors.title', { max: POST_LIMITS.title });
  if (form.content.trim().length === 0)
    errors.content = translate('admin.postEditor.errors.content');
  if (form.ogImage.length > POST_LIMITS.ogImage || !IMAGE_PATTERN.test(form.ogImage))
    errors.ogImage = translate('admin.postEditor.errors.ogImage');
  if (form.publishOn && fromLocalInput(form.publishOn) === null)
    errors.publishOn = translate('admin.postEditor.errors.publishOn');
  else if (mode === 'scheduled' && !isAhead(form.publishOn, Date.now()))
    errors.publishOn = translate('postEditor.errors.scheduleAhead');
  return errors;
}

/** The editor's visibility choice: a draft, public from its time (now when empty), or public later. */
export type PublishMode = 'draft' | 'public' | 'scheduled';

const isAhead = (publishOn: string, now: number) => {
  const at = fromLocalInput(publishOn);
  return at !== null && new Date(at).getTime() > now;
};

export const publishModeOf = (form: PostForm, now = Date.now()): PublishMode => {
  if (!form.visible) return 'draft';
  return isAhead(form.publishOn, now) ? 'scheduled' : 'public';
};

/** An hour from now, on the minute: the time a newly scheduled post starts with. */
const nextHour = (now: number) => toLocalInput(new Date(now + 3_600_000).toISOString());

/**
 * The visibility fields for `mode`. Making a post public keeps the time it went live (`liveSince`, for an edit of a live
 * post) or dates it now (an empty time); scheduling keeps a time ahead or proposes one an hour away.
 */
export function publishFieldsFor(
  form: PostForm,
  mode: PublishMode,
  liveSince: string | null,
  now = Date.now(),
): Pick<PostForm, 'visible' | 'publishOn'> {
  if (mode === 'draft') return { visible: false, publishOn: form.publishOn };
  if (mode === 'public') return { visible: true, publishOn: liveSince ?? '' };
  return {
    visible: true,
    publishOn: isAhead(form.publishOn, now) ? form.publishOn : nextHour(now),
  };
}

/** What the viewer may set beyond title, content, time and visibility (the backend refuses the rest with 403). */
export interface PostFieldRights {
  staff: boolean;
  pin: boolean;
  markGlobal: boolean;
}

/** The create body: staff-only fields and flags are sent only by those who may set them. */
export function createBodyOf(
  form: PostForm,
  rights: PostFieldRights,
  organization: string | null,
): PostCreateBody {
  const publishOn = fromLocalInput(form.publishOn);
  return {
    title: form.title.trim(),
    content: form.content,
    visible: form.visible,
    ...(publishOn ? { publishOn } : {}),
    ...(rights.staff ? { summary: form.summary, ogImage: form.ogImage } : {}),
    ...(rights.pin ? { sticky: form.sticky } : {}),
    ...(rights.markGlobal ? { globalPost: form.globalPost } : {}),
    ...(organization ? { organization } : {}),
  };
}

const sameIds = (left: UserChip[], right: UserChip[]) =>
  left.map((chip) => chip.id).join() === right.map((chip) => chip.id).join();

/** Only the changed fields, so an author's edit never sends a staff field it cannot change. */
export function patchOf(before: PostForm, after: PostForm): PostPatch {
  const patch: PostPatch = {};
  if (after.title.trim() !== before.title) patch.title = after.title.trim();
  for (const key of ['content', 'summary', 'ogImage'] as const)
    if (after[key] !== before[key]) patch[key] = after[key];
  for (const key of ['visible', 'sticky', 'globalPost'] as const)
    if (after[key] !== before[key]) patch[key] = after[key];
  // An emptied time means "now", as on create.
  if (after.publishOn !== before.publishOn)
    patch.publishOn = fromLocalInput(after.publishOn) ?? new Date().toISOString();
  if (!sameIds(before.authors, after.authors))
    patch.authorIds = after.authors.map((chip) => chip.id);
  return patch;
}
