import { computed, reactive, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import { createPost, deletePost, updatePost } from '@/api/blog.api';
import type { PostDetail } from '@/api/types/blog';
import { hasPermission } from '@/lib/permissions';
import { useSessionStore } from '@/stores/session.store';
import type { FieldErrors } from '@/features/admin/ui/admin-errors';
import { useAdminMutation } from '@/features/admin/ui/use-admin-mutation';
import { usePostQuery } from '../blog.queries';
import { checkPostForm, createBodyOf, emptyPostForm, patchOf, postFormOf } from './post-form';
import type { PostForm, PostFieldRights } from './post-form';

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

/** The blog post editor (legacy `BlogPostCreate` / `BlogPostEdit` / `BlogPostDelete`): `postId` null writes a new post. */
export function usePostEditor(postId: () => string | null, organization: () => string | null) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const rights = usePostFieldRights();
  const query = usePostQuery(() => postId() ?? '');
  const post = computed(() => (postId() ? query.data.value : undefined));
  const { form, baseline, reset } = usePostFormState(postId, () => post.value);
  const clientErrors = ref<FieldErrors>({});
  const isNothingToSave = ref(false);
  /** The lists only: a deleted post's own detail query would refetch a 404 before the page leaves. */
  const refreshLists = () => queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });

  const writer = useAdminMutation({
    mutate: () => {
      const id = postId();
      return id === null
        ? createPost(createBodyOf(form, rights.value, organization()))
        : updatePost(id, patchOf(baseline.value!, form));
    },
    invalidates: () => [['admin', 'posts']],
    onDone: (saved: PostDetail) => {
      void refreshLists();
      if (postId() === null) void router.replace({ name: 'post-edit', params: { id: saved.id } });
      else reset(saved);
    },
  });

  const remover = useAdminMutation({
    mutate: (id: string) => deletePost(id),
    invalidates: () => [['admin', 'posts']],
    onDone: () => {
      void refreshLists();
      void router.push({ name: 'blog' });
    },
  });

  function save() {
    writer.reset();
    isNothingToSave.value = false;
    clientErrors.value = checkPostForm(form);
    if (Object.keys(clientErrors.value).length > 0) return;
    const isEdit = postId() !== null && baseline.value !== null;
    if (isEdit && Object.keys(patchOf(baseline.value!, form)).length === 0) {
      isNothingToSave.value = true;
      return;
    }
    void writer.run(undefined);
  }

  const errors = computed(() => ({ ...writer.fieldErrors.value, ...clientErrors.value }));
  return { query, post, form, rights, errors, isNothingToSave, writer, remover, save };
}
