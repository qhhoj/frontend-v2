<script setup lang="ts">
import { ref, watch } from 'vue';
import { editComment, fetchComment } from '@/api/comments.api';
import { COMMENT_MAX_LENGTH } from '@/api/types/comments';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_INPUT_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';

/** A moderator's edit of someone's comment (`judge.change_comment`): the full Markdown is loaded on open, saved as one `edit` revision. */
const props = defineProps<{ commentId: string | null }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ saved: [] }>();
const body = ref('');
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const localError = ref<string | null>(null);

const save = useAdminMutation({
  mutate: ({ id, text }: { id: string; text: string }) => editComment(id, text),
  invalidates: () => [['admin', 'comments'], ['admin', 'comment-reports'], ['comments']],
  onDone: () => {
    emit('saved');
    visible.value = false;
  },
});

/** Each open starts from the stored text, never a draft left from the last comment; a late answer for an earlier open is dropped. */
let openCount = 0;
watch(visible, async (isOpen) => {
  const thisOpen = ++openCount;
  if (!isOpen || !props.commentId) return;
  save.reset();
  localError.value = null;
  loadError.value = null;
  body.value = '';
  isLoading.value = true;
  try {
    const text = (await fetchComment(props.commentId)).body ?? '';
    if (thisOpen === openCount) body.value = text;
  } catch {
    if (thisOpen === openCount) loadError.value = translate('admin.comments.edit.loadFailed');
  } finally {
    if (thisOpen === openCount) isLoading.value = false;
  }
});

function submit() {
  if (!props.commentId || isLoading.value || loadError.value) return;
  localError.value = body.value.trim() ? null : translate('admin.comments.edit.blank');
  if (body.value.length > COMMENT_MAX_LENGTH)
    localError.value = translate('admin.comments.edit.tooLong', { max: COMMENT_MAX_LENGTH });
  if (localError.value) return;
  void save.run({ id: props.commentId, text: body.value });
}
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('admin.comments.edit.title')"
    :confirm-label="$t('admin.comments.edit.save')"
    :busy="save.isPending.value"
    :can-confirm="!isLoading && !loadError"
    :width="640"
    @confirm="submit"
  >
    <p v-if="isLoading" class="text-sm text-muted" aria-live="polite">
      {{ $t('admin.comments.edit.loading') }}
    </p>
    <AdminField
      v-else
      v-slot="{ id, describedBy }"
      :label="$t('admin.comments.edit.label')"
      :hint="$t('admin.comments.edit.hint')"
      :error="localError ?? undefined"
      input-id="moderator-comment-body"
    >
      <textarea
        :id="id"
        v-model="body"
        rows="10"
        :class="[ADMIN_INPUT_CLASS, 'min-h-48 resize-y font-mono text-sm']"
        :aria-describedby="describedBy"
        :aria-invalid="localError ? 'true' : undefined"
      />
    </AdminField>
    <template #error>
      <AdminStatus v-if="loadError" kind="refused" :text="loadError" />
      <AdminStatus
        v-if="save.failure.value"
        kind="refused"
        :text="failureTextOf(save.failure.value)"
      />
    </template>
  </ConfirmDialog>
</template>
