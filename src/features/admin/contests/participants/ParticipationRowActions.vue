<script setup lang="ts">
import { ref } from 'vue';
import {
  deleteParticipation,
  moveParticipationStart,
  recomputeParticipation,
} from '@/api/contest-admin.api';
import type { Participation } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AdminField from '../../ui/AdminField.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../../ui/classes';
import { fromLocalInput, toLocalInput } from '../../ui/datetime';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import type { AdminQueryKey } from '../../ui/use-admin-mutation';

/** A participation's editor actions besides disqualify: move its start, recompute its score, delete a stray row. */
const props = defineProps<{ contestKey: string; participation: Participation }>();
const isStartOpen = ref(false);
const isDeleteOpen = ref(false);
const typedStart = ref('');
const invalidate = (): AdminQueryKey[] => [
  ['admin', 'participations', props.contestKey],
  ['admin', 'contest', props.contestKey],
  ['contests', 'ranking'],
];

const moveStart = useAdminMutation({
  mutate: (start: string) =>
    moveParticipationStart(props.contestKey, props.participation.id, start),
  invalidates: invalidate,
  onDone: () => {
    isStartOpen.value = false;
  },
});
const recompute = useAdminMutation({
  mutate: () => recomputeParticipation(props.contestKey, props.participation.id),
});
const remove = useAdminMutation({
  mutate: () => deleteParticipation(props.contestKey, props.participation.id),
  invalidates: invalidate,
  onDone: () => {
    isDeleteOpen.value = false;
  },
});

function openStart() {
  moveStart.reset();
  typedStart.value = toLocalInput(props.participation.realStart);
  isStartOpen.value = true;
}
function confirmStart() {
  const start = fromLocalInput(typedStart.value);
  if (start) void moveStart.run(start);
}
function openDelete() {
  remove.reset();
  isDeleteOpen.value = true;
}
</script>

<template>
  <div class="flex flex-wrap items-start gap-1.5">
    <button type="button" :class="ADMIN_BUTTON_CLASS" @click="openStart">
      {{ $t('admin.contestOps.participants.moveStart') }}
    </button>
    <button
      type="button"
      :class="ADMIN_BUTTON_CLASS"
      :aria-busy="recompute.isPending.value || undefined"
      @click="recompute.run(undefined)"
    >
      {{ $t('admin.contestOps.participants.recompute') }}
    </button>
    <button type="button" :class="ADMIN_BUTTON_CLASS" @click="openDelete">
      {{ $t('admin.contestOps.participants.delete') }}
    </button>
    <AdminStatus
      v-if="recompute.isDone.value"
      kind="queued"
      :text="$t('admin.contestOps.participants.recomputeQueued')"
    />
    <AdminStatus
      v-if="recompute.failure.value"
      kind="refused"
      :text="failureTextOf(recompute.failure.value)"
    />

    <ConfirmDialog
      v-model:visible="isStartOpen"
      :title="
        $t('admin.contestOps.participants.moveStartTitle', {
          username: participation.user.username,
        })
      "
      :confirm-label="$t('admin.ui.save')"
      :busy="moveStart.isPending.value"
      :can-confirm="Boolean(fromLocalInput(typedStart))"
      @confirm="confirmStart"
    >
      <p class="text-muted">{{ $t('admin.contestOps.participants.moveStartBody') }}</p>
      <AdminField
        :input-id="`participation-start-${participation.id}`"
        :label="$t('admin.contestOps.participants.startLabel')"
      >
        <template #default="{ id, describedBy }">
          <input
            :id="id"
            v-model="typedStart"
            type="datetime-local"
            :class="ADMIN_INPUT_CLASS"
            :aria-describedby="describedBy"
          />
        </template>
      </AdminField>
      <template #error>
        <p v-if="moveStart.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(moveStart.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>

    <ConfirmDialog
      v-model:visible="isDeleteOpen"
      :title="
        $t('admin.contestOps.participants.deleteTitle', { username: participation.user.username })
      "
      :body="$t('admin.contestOps.participants.deleteBody')"
      :confirm-label="$t('admin.contestOps.participants.delete')"
      tone="danger"
      :busy="remove.isPending.value"
      @confirm="remove.run(undefined)"
    >
      <template #error>
        <p v-if="remove.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(remove.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </div>
</template>
