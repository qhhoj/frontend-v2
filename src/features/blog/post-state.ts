/** Where a post stands for readers: a draft, scheduled (shown, time ahead) or live. */
export type PostState = 'draft' | 'scheduled' | 'live';

export const postStateOf = (
  post: { visible: boolean; publishOn: string },
  now = Date.now(),
): PostState => {
  if (!post.visible) return 'draft';
  return new Date(post.publishOn).getTime() > now ? 'scheduled' : 'live';
};
