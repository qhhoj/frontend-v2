<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import { deleteContest } from '@/api/contest-admin.api';
import type { EditableContest } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import AdminField from '../../ui/AdminField.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { INPUT, buttonClass } from '../../ui/controls';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { CONTEST_INDEX_KEY } from '../contest-editing.queries';

/**
 * The danger zone: deletes a hidden, unrated contest once its key is typed again. A visible contest is not offered the
 * button (the backend refuses it too); the rated and still-judging refusals come back from the server.
 */
const props = defineProps<{ contest: EditableContest }>();
const router = useRouter();
const queryClient = useQueryClient();
const isOpen = ref(false);
const typedKey = ref('');
const isVisible = computed(() => props.contest.settings?.isVisible ?? true);
const unavailable = computed(() =>
  isVisible.value ? translate('admin.contestOps.delete.visible') : undefined,
);

const mutation = useAdminMutation({
  mutate: () => deleteContest(props.contest.key, typedKey.value.trim()),
  invalidates: () => [CONTEST_INDEX_KEY, ['contests', 'list']],
  // The editor's own caches name a contest that is gone: dropped, not refetched into a 404.
  onSuccess: () => {
    queryClient.removeQueries({ queryKey: ['admin', 'contest', props.contest.key] });
    queryClient.removeQueries({ queryKey: ['admin', 'contest-actions', props.contest.key] });
  },
  onDone: () => {
    isOpen.value = false;
    void router.push({ name: 'admin-contests' });
  },
});

function open() {
  mutation.reset();
  typedKey.value = '';
  isOpen.value = true;
}
</script>

<template>
  <section
    data-testid="action-delete"
    class="flex flex-col gap-3 rounded-panel border border-negative bg-surface-solid p-5"
  >
    <h3 class="m-0 text-base font-semibold text-negative">
      {{ $t('admin.contestOps.delete.title') }}
    </h3>
    <p class="text-sm text-muted">{{ $t('admin.contestOps.delete.description') }}</p>
    <p v-if="unavailable" class="text-sm text-muted">{{ unavailable }}</p>
    <button v-else type="button" :class="buttonClass('danger')" class="self-start" @click="open">
      {{ $t('admin.contestOps.delete.button') }}
    </button>

    <ConfirmDialog
      v-model:visible="isOpen"
      :title="$t('admin.contestOps.delete.confirmTitle', { key: contest.key })"
      :confirm-label="$t('admin.contestOps.delete.confirm')"
      tone="danger"
      :busy="mutation.isPending.value"
      :can-confirm="typedKey.trim() === contest.key"
      @confirm="mutation.run(undefined)"
    >
      <p class="text-muted">{{ $t('admin.contestOps.delete.confirmBody') }}</p>
      <AdminField
        input-id="delete-contest-key"
        :label="$t('admin.contestOps.delete.keyLabel', { key: contest.key })"
      >
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
  </section>
</template>
