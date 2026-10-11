import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import { createPost, updatePost } from '@/api/blog.api';
import type { PostCreateBody } from '@/api/blog.api';
import type { PostDetail } from '@/api/types/blog';
import { hasPermission } from '@/lib/permissions';
import { useSessionStore } from '@/stores/session.store';
import type { FieldErrors } from '@/features/admin/ui/admin-errors';
import { useAdminMutation } from '@/features/admin/ui/use-admin-mutation';
import { usePostQuery } from '../blog.queries';
import {
  checkPostForm,
  createBodyOf,
  emptyPostForm,
  patchOf,
  postFormOf,
  publishFieldsFor,
  publishModeOf,
} from './post-form';
import type { PostForm, PostFieldRights, PublishMode } from './post-form';

/** What the signed-in viewer may set; the backend checks the same permissions. */
function usePostFieldRights() {
  const session = useSessionStore();
  return computed<PostFieldRights>(() => ({
    staff: hasPermission(session.user, 'judge.edit_all_post'),
    pin: hasPermission(session.user, 'judge.pin_post'),
    markGlobal: hasPermission(session.user, 'judge.mark_global_post'),
  }));
}

/**
 * The form follows the post on screen: blank for a new post, filled once per post id from the loaded copy (the router
 * reuses this page between `/blog/new` and each `/blog/:id/edit`). `baseline` is what the server holds, so a save sends
 * only the changes.
 */
function usePostFormState(postId: () => string | null, post: () => PostDetail | undefined) {
  const form = reactive<PostForm>(emptyPostForm());
  const baseline = ref<PostForm | null>(null);
  let filledFor: string | null | undefined;
  const reset = (loaded: PostDetail) => {
    filledFor = loaded.id;
    baseline.value = postFormOf(loaded);
    Object.assign(form, postFormOf(loaded));
  };
  watch(
    [postId, post],
    ([id, loaded]) => {
      if (id === null && filledFor !== null) {
        filledFor = null;
        baseline.value = null;
        Object.assign(form, emptyPostForm());
      } else if (id !== null && loaded?.id === id && filledFor !== id) reset(loaded);
    },
    { immediate: true },
  );
  return { form, baseline, reset };
}

/** `draft` saves as a draft; `publish` makes a draft public now and keeps a chosen schedule; `keep` saves the visibility as chosen. */
export type SaveIntent = 'draft' | 'publish' | 'keep';

const isLive = (post: PostDetail) =>
  post.visible && new Date(post.publishOn).getTime() <= Date.now();

const targetModeOf = (intent: SaveIntent, current: PublishMode): PublishMode => {
  if (intent === 'draft') return 'draft';
  return intent === 'publish' && current === 'draft' ? 'public' : current;
};

/**
 * The visibility radio: an explicit choice (editing the time never flips it), read again from each saved copy. A live
 * post made public again keeps the time it went live.
 */
function usePublishMode(form: PostForm, baseline: Ref<PostForm | null>, isPostLive: Ref<boolean>) {
  const chosen = ref<PublishMode>('draft');
  watch(baseline, (saved) => (chosen.value = saved ? publishModeOf(saved) : 'draft'), {
    immediate: true,
  });
  const fieldsFor = (next: PublishMode) =>
    publishFieldsFor(form, next, isPostLive.value ? (baseline.value?.publishOn ?? null) : null);
  const mode = computed<PublishMode>({
    get: () => chosen.value,
    set: (next) => {
      chosen.value = next;
      Object.assign(form, fieldsFor(next));
    },
  });
  return { mode, fieldsFor };
}

/** The create or edit request; a save that leaves the post live opens it, a draft or scheduled one stays in the editor. */
function usePostWriter(
  postId: () => string | null,
  { form, baseline, reset }: ReturnType<typeof usePostFormState>,
  body: () => PostCreateBody,
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useAdminMutation({
    mutate: () => {
      const id = postId();
      return id === null ? createPost(body()) : updatePost(id, patchOf(baseline.value!, form));
    },
    invalidates: () => [['admin', 'posts']],
    onDone: (saved: PostDetail) => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void queryClient.invalidateQueries({ queryKey: ['organizations', 'posts'] });
      if (isLive(saved)) void router.push({ name: 'post', params: { id: saved.id } });
      else if (postId() === null)
        void router.replace({ name: 'post-edit', params: { id: saved.id } });
      else reset(saved);
    },
  });
}

/**
 * The blog post editor (legacy `BlogPostCreate` / `BlogPostEdit`): `postId` null writes a new post, for the organization
 * chosen in `organization` (a slug; null for a personal post).
 */
export function usePostEditor(postId: () => string | null, organization: Ref<string | null>) {
  const rights = usePostFieldRights();
  const query = usePostQuery(() => postId() ?? '');
  const post = computed(() => (postId() ? query.data.value : undefined));
  const state = usePostFormState(postId, () => post.value);
  const { form, baseline } = state;
  const isPostLive = computed(() => (post.value ? isLive(post.value) : false));
  const { mode, fieldsFor } = usePublishMode(form, baseline, isPostLive);
  const writer = usePostWriter(postId, state, () =>
    createBodyOf(form, rights.value, organization.value),
  );
  const clientErrors = ref<FieldErrors>({});
  const isNothingToSave = ref(false);
  const hasChanges = () => !baseline.value || Object.keys(patchOf(baseline.value, form)).length > 0;

  /** Checks the form as it would be saved before changing the radio, so a refused save leaves the choice alone. */
  function save(intent: SaveIntent) {
    writer.reset();
    isNothingToSave.value = false;
    const target = targetModeOf(intent, mode.value);
    clientErrors.value = checkPostForm({ ...form, ...fieldsFor(target) }, target);
    if (Object.keys(clientErrors.value).length > 0) return;
    mode.value = target;
    if (hasChanges()) void writer.run(undefined);
    else isNothingToSave.value = true;
  }

  const isDirty = computed(() =>
    baseline.value ? hasChanges() : form.title !== '' || form.content !== '',
  );
  const errors = computed(() => ({ ...writer.fieldErrors.value, ...clientErrors.value }));
  return {
    query,
    post,
    form,
    mode,
    rights,
    errors,
    isDirty,
    isPostLive,
    isNothingToSave,
    writer,
    save,
  };
}
