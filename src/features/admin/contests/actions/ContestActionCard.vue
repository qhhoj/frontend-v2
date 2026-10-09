<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ContestActionState } from '@/api/types/contest-editing';
import { translate } from '@/i18n';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../../shell/AdminBit.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_DANGER_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { isBusy } from './contest-actions';

/** One background action of the contest: its button, the confirm that guards it, and its live state from the status endpoint. */
const props = defineProps<{
  id: string;
  title: string;
  description: string;
  buttonLabel: string;
  confirmTitle: string;
  confirmLabel: string;
  permission?: string;
  state: ContestActionState;
  run: () => Promise<unknown>;
}>();
const { can } = usePermissions();
const isOpen = ref(false);
const isBusyNow = computed(() => isBusy(props.state));
const isLocked = computed(() => Boolean(props.permission && !can(props.permission)));
const statusText = computed(() => translateState(props.state));
const mutation = useAdminMutation({
  mutate: () => props.run(),
  onDone: () => {
    isOpen.value = false;
  },
});

function translateState(state: ContestActionState): string {
  return state === 'running'
    ? translate('admin.contests.actions.status.running')
    : translate('admin.contests.actions.status.queued');
}

/** A busy action opens nothing: the backend would queue a second job for the same contest. */
function open() {
  if (!isBusyNow.value) isOpen.value = true;
}
</script>

<template>
  <article :data-testid="`action-${id}`" class="glass flex flex-col gap-3 rounded-panel p-5">
    <h3 class="font-display text-lg font-semibold">{{ title }}</h3>
    <p class="text-sm text-muted">{{ description }}</p>
    <p v-if="isLocked" class="text-sm text-muted">
      {{ $t('admin.ui.needsPermission', { permission }) }}
    </p>
    <button
      v-else
      type="button"
      :class="ADMIN_DANGER_CLASS"
      class="self-start"
      :aria-disabled="isBusyNow || undefined"
      @click="open"
    >
      {{ buttonLabel }}
    </button>
    <AdminStatus v-if="isBusyNow" kind="queued" :text="statusText">
      <AdminBit placement="queued" />
    </AdminStatus>
    <AdminStatus
      v-if="mutation.failure.value"
      kind="refused"
      :text="failureTextOf(mutation.failure.value)"
    />

    <ConfirmDialog
      v-model:visible="isOpen"
      :title="confirmTitle"
      :confirm-label="confirmLabel"
      tone="danger"
      :busy="mutation.isPending.value"
      @confirm="mutation.run(undefined)"
    >
      <slot name="confirm-body" />
    </ConfirmDialog>
  </article>
</template>
