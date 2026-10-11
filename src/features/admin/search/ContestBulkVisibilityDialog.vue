<script setup lang="ts">
import { computed, watch } from 'vue';
import { setContestsVisibility } from '@/api/contest-admin.api';
import type { BulkContestResult } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY } from '../contests/contest-editing.queries';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';

/** Confirms showing (`isVisible`) or hiding `keys`; `done` hands the per-key results to the list. */
const props = defineProps<{ keys: string[]; isVisible: boolean }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ done: [result: BulkContestResult] }>();
const mutation = useAdminMutation({
  mutate: () => setContestsVisibility({ keys: props.keys, isVisible: props.isVisible }),
  invalidates: () => [CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY, ['admin', 'contest']],
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
    :title="$t(`admin.search.contests.bulk.${verb}Title`, { count: keys.length })"
    :confirm-label="$t(`admin.search.contests.bulk.${verb}`)"
    :tone="isVisible ? 'neutral' : 'danger'"
    :busy="mutation.isPending.value"
    :width="520"
    @confirm="mutation.run(undefined)"
  >
    <div class="flex flex-col gap-3 text-sm">
      <p>{{ $t(`admin.search.contests.bulk.${verb}Body`) }}</p>
      <p class="font-mono text-xs break-words text-muted">{{ keys.join(', ') }}</p>
    </div>
    <template #error>
      <p v-if="mutation.failure.value" role="alert" class="text-sm text-negative">
        {{ failureTextOf(mutation.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
