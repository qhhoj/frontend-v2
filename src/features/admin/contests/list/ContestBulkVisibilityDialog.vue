<script setup lang="ts">
import { computed, watch } from 'vue';
import { setContestsVisibility } from '@/api/contest-admin.api';
import type { BulkContestResult } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import { CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY } from '../contest-editing.queries';
import { failureTextOf } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';

/** Confirms showing (`isVisible`) or hiding `keys`; hiding is reversible, so neither is a danger action. `done` hands the per-key results to the list. */
const props = defineProps<{ keys: string[]; isVisible: boolean }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ done: [result: BulkContestResult] }>();
const mutation = useAdminMutation({
  mutate: () => setContestsVisibility({ keys: props.keys, isVisible: props.isVisible }),
  invalidates: () => [CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY, ['admin', 'contest']],
  successText: (result: BulkContestResult) =>
    translate('admin.contests.list.bulk.done', { done: result.done }),
  onDone: (result: BulkContestResult) => {
    visible.value = false;
    emit('done', result);
  },
});
watch(visible, (isOpen) => isOpen && mutation.reset());
const verb = computed(() => (props.isVisible ? 'show' : 'hide'));
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t(`admin.contests.list.bulk.${verb}Title`, { count: keys.length })"
    :confirm-label="$t(`admin.contests.list.bulk.${verb}Confirm`)"
    tone="neutral"
    :busy="mutation.isPending.value"
    :width="520"
    @confirm="mutation.run(undefined)"
  >
    <div class="flex flex-col gap-3 text-sm">
      <p>{{ $t(`admin.contests.list.bulk.${verb}Body`) }}</p>
      <p class="font-mono text-caption leading-4 break-words text-muted">{{ keys.join(', ') }}</p>
    </div>
    <template #error>
      <p v-if="mutation.failure.value" role="alert" class="text-sm text-negative">
        {{ failureTextOf(mutation.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
