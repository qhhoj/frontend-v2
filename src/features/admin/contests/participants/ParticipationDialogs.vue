<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Participation } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import { formatInZone } from '../../ui/form/site-time';
import { failureTextOf } from '../../ui/admin-errors';
import AdminDateTimeField from '../../ui/form/AdminDateTimeField.vue';
import { participationKindKey } from './participations';
import type { ParticipationActions } from './use-participation-actions';

/** The confirm dialogs of the participation row menu: move the start, disqualify, delete. */
const props = defineProps<{ actions: ParticipationActions }>();
/** Kept after a dialog closes, so its text does not blank while it fades and focus can still find the row. */
const row = ref<Participation | null>(null);
watch(
  () => props.actions.open.value,
  (open) => {
    if (open) row.value = open.row;
  },
  { immediate: true },
);
const isOpen = (dialog: string) =>
  computed({
    get: () => props.actions.open.value?.dialog === dialog,
    set: (shown: boolean) => {
      if (!shown) props.actions.close();
    },
  });
const isMoveOpen = isOpen('moveStart');
const isDisqualifyOpen = isOpen('disqualify');
const isDeleteOpen = isOpen('delete');
const username = computed(() => row.value?.user.username ?? '');
const kindText = computed(() => {
  if (!row.value) return '';
  const kind = participationKindKey(row.value.virtual);
  return translate(kind.key, kind.params ?? {});
});

const start = ref<string | null>(null);
watch(isMoveOpen, (shown) => {
  if (shown) start.value = row.value?.realStart ?? null;
});
const { disqualify, moveStart, remove } = props.actions;
/** Focus lands on the row's status after a dialog closes: the menu that opened it is gone by then. */
const statusCell = () =>
  row.value ? document.getElementById(`participation-status-${row.value.id}`) : null;
</script>

<template>
  <ConfirmDialog
    v-model:visible="isMoveOpen"
    :title="$t('admin.contestOps.participants.moveStartTitle', { username })"
    :confirm-label="$t('admin.ui.save')"
    :busy="moveStart.isPending.value"
    :can-confirm="Boolean(start)"
    :width="520"
    @confirm="row && start && moveStart.run({ row, start })"
  >
    <div class="flex flex-col gap-4">
      <p class="m-0 text-muted">{{ $t('admin.contestOps.participants.moveStartBody') }}</p>
      <AdminDateTimeField
        v-if="row"
        v-model="start"
        :input-id="`participation-start-${row.id}`"
        :label="$t('admin.contestOps.participants.startLabel')"
      />
    </div>
    <template #error>
      <p v-if="moveStart.failure.value" role="alert" class="text-sm text-negative">
        {{ failureTextOf(moveStart.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>

  <ConfirmDialog
    v-model:visible="isDisqualifyOpen"
    :return-focus-to="statusCell"
    :title="$t('admin.contests.participants.disqualifyTitle', { username })"
    :body="
      $t('admin.contests.participants.disqualifyBody', {
        kind: kindText,
        time: row ? formatInZone(row.realStart) : '',
      })
    "
    :confirm-label="$t('admin.contests.participants.disqualify')"
    tone="danger"
    :busy="disqualify.isPending.value"
    @confirm="row && disqualify.run(row)"
  >
    <template #error>
      <p v-if="disqualify.failure.value" role="alert" class="text-sm text-negative">
        {{ failureTextOf(disqualify.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>

  <ConfirmDialog
    v-model:visible="isDeleteOpen"
    :title="$t('admin.contestOps.participants.deleteTitle', { username })"
    :body="$t('admin.contestOps.participants.deleteBody')"
    :confirm-label="$t('admin.contestOps.participants.deleteConfirm')"
    tone="danger"
    :busy="remove.isPending.value"
    @confirm="row && remove.run(row)"
  >
    <template #error>
      <p v-if="remove.failure.value" role="alert" class="text-sm text-negative">
        {{ failureTextOf(remove.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
