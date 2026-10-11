/** Where a post stands for readers: a draft, scheduled (shown, time ahead) or live. */
export type PostState = 'draft' | 'scheduled' | 'live';

export const postStateOf = (
  post: { visible: boolean; publishOn: string },
  now = Date.now(),
): PostState => {
  if (!post.visible) return 'draft';
  return new Date(post.publishOn).getTime() > now ? 'scheduled' : 'live';
};

/** The accent "write" pill of the blog list, the drafts page and an organization's posts tab. */
export const WRITE_BUTTON_CLASS =
  'inline-flex min-h-11 items-center gap-2 rounded-pill bg-gradient-accent px-5 font-bold text-on-accent';
