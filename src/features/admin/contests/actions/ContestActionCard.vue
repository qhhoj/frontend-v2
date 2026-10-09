<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ContestActionState } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../../shell/AdminBit.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_DANGER_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { isBusy } from './contest-actions';

/**
 * One background action of the contest: its button, the confirm that guards it, and its live state from the status endpoint.
 * `unavailable` names why the server would refuse the action now; the button is then not offered at all.
 */
const props = defineProps<{
  id: string;
  title: string;
  description: string;
  buttonLabel: string;
  confirmTitle: string;
  confirmLabel: string;
  permission?: string;
  unavailable?: string;
  state: ContestActionState;
  run: () => Promise<unknown>;
}>();
const { can } = usePermissions();
const isOpen = ref(false);
const isBusyNow = computed(() => isBusy(props.state));
const isLocked = computed(() => Boolean(props.permission && !can(props.permission)));
const statusText = computed(() =>
  props.state === 'running'
    ? translate('admin.contests.actions.status.running')
    : translate('admin.contests.actions.status.queued'),
);
const mutation = useAdminMutation({
  mutate: () => props.run(),
  onDone: () => {
    isOpen.value = false;
  },
});

/** A busy action opens nothing: the backend would queue a second job for the same contest. A refusal from an earlier try is cleared. */
function open() {
  if (isBusyNow.value) return;
  mutation.reset();
  isOpen.value = true;
}
</script>

<template>
  <article :data-testid="`action-${id}`" class="glass flex flex-col gap-3 rounded-panel p-5">
    <h3 class="font-display text-lg font-semibold">{{ title }}</h3>
    <p class="text-sm text-muted">{{ description }}</p>
    <p v-if="isLocked" class="text-sm text-muted">
      {{ $t('admin.ui.needsPermission', { permission }) }}
    </p>
    <p v-else-if="unavailable" class="text-sm text-muted">{{ unavailable }}</p>
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

    <ConfirmDialog
      v-model:visible="isOpen"
      :title="confirmTitle"
      :confirm-label="confirmLabel"
      tone="danger"
      :busy="mutation.isPending.value"
      @confirm="mutation.run(undefined)"
    >
      <slot name="confirm-body" />
      <template #error>
        <p v-if="mutation.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(mutation.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </article>
</template>
