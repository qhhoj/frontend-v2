<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { deleteContest } from '@/api/contest-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import AdminField from '../../ui/AdminField.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { CONTEST_INDEX_KEY } from '../contest-editing.queries';

/**
 * "Xoá kỳ thi…" from the row menu, the editor header and the Actions tab: deletes once the key is typed again. Callers
 * offer it only for a hidden contest; the rated and still-judging refusals come back from the server, inside the dialog.
 */
const props = defineProps<{ contestKey: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ deleted: [] }>();
const queryClient = useQueryClient();
const typedKey = ref('');
const KEY = 'admin.contestOps.delete';

const mutation = useAdminMutation({
  mutate: () => deleteContest(props.contestKey, typedKey.value.trim()),
  invalidates: () => [CONTEST_INDEX_KEY, ['contests', 'list']],
  successText: () => translate(`${KEY}.done`, { key: props.contestKey }),
  // The editor's own caches name a contest that is gone: dropped, not refetched into a 404.
  onSuccess: () => {
    queryClient.removeQueries({ queryKey: ['admin', 'contest', props.contestKey] });
    queryClient.removeQueries({ queryKey: ['admin', 'contest-actions', props.contestKey] });
  },
  onDone: () => {
    visible.value = false;
    emit('deleted');
  },
});

watch(visible, (isOpen) => {
  if (!isOpen) return;
  typedKey.value = '';
  mutation.reset();
});
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t(`${KEY}.confirmTitle`, { key: contestKey })"
    :confirm-label="$t(`${KEY}.confirm`)"
    tone="danger"
    :busy="mutation.isPending.value"
    :can-confirm="typedKey.trim() === contestKey"
    @confirm="mutation.run(undefined)"
  >
    <p class="text-muted">{{ $t(`${KEY}.confirmBody`) }}</p>
    <AdminField input-id="delete-contest-key" :label="$t(`${KEY}.keyLabel`, { key: contestKey })">
      <template #default="{ id, describedBy }">
        <input
          :id="id"
          v-model="typedKey"
          :class="INPUT"
          :aria-describedby="describedBy"
          autocomplete="off"
          spellcheck="false"
        />
      </template>
    </AdminField>
    <template #error>
      <p v-if="mutation.failure.value" role="alert" class="text-sm text-negative">
        {{ failureTextOf(mutation.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
