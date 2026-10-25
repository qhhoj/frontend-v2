<script setup lang="ts">
import { computed, watch } from 'vue';
import { disqualifyParticipations } from '@/api/contest-admin.api';
import type { BulkDisqualifyResult } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import type { AdminQueryKey } from '../../ui/use-admin-mutation';

/** Confirms disqualifying (or reinstating) the ticked rows; `done` hands the per-row results to the tab. */
const props = defineProps<{
  contestKey: string;
  ids: string[];
  usernames: string[];
  disqualified: boolean;
}>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ done: [result: BulkDisqualifyResult] }>();
/** The backend writes the contest's banned-users list too, so the settings are refetched (a stale General save would undo it). */
const invalidates = (): AdminQueryKey[] => [
  ['admin', 'participations', props.contestKey],
  ['admin', 'contest', props.contestKey],
  ['contests', 'ranking'],
];
const mutation = useAdminMutation({
  mutate: () => disqualifyParticipations(props.contestKey, props.ids, props.disqualified),
  invalidates,
  onDone: (result: BulkDisqualifyResult) => {
    visible.value = false;
    emit('done', result);
  },
});
watch(visible, (isOpen) => isOpen && mutation.reset());
const verb = computed(() => (props.disqualified ? 'disqualify' : 'reinstate'));
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t(`admin.contests.participants.bulk.${verb}Title`, { count: ids.length })"
    :confirm-label="$t(`admin.contests.participants.bulk.${verb}`)"
    :tone="disqualified ? 'danger' : 'neutral'"
    :busy="mutation.isPending.value"
    :width="520"
    @confirm="mutation.run(undefined)"
  >
    <div class="flex flex-col gap-3 text-sm">
      <p>{{ $t(`admin.contests.participants.bulk.${verb}Body`) }}</p>
      <p class="font-mono text-caption leading-4 break-words text-muted">
        {{ usernames.join(', ') }}
      </p>
    </div>
    <template #error>
      <p v-if="mutation.failure.value" role="alert" class="text-sm text-negative">
        {{ failureTextOf(mutation.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
