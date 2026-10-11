<script setup lang="ts">
import { needsPermissionText } from '../../ui/permission-text';
import { computed, ref } from 'vue';
import type { ContestActionState } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, buttonClass } from '../../ui/controls';
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
  successText: () => translate('admin.contests.actions.queuedToast', { action: props.title }),
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
  <article :data-testid="`action-${id}`" :class="[CARD, 'flex flex-col gap-3 p-5']">
    <h3 class="m-0 text-base font-semibold">{{ title }}</h3>
    <p class="text-sm text-muted">{{ description }}</p>
    <p v-if="isLocked" class="text-sm text-muted">
      {{ needsPermissionText(permission!) }}
    </p>
    <p v-else-if="unavailable" class="text-sm text-muted">{{ unavailable }}</p>
    <button
      v-else
      type="button"
      :class="buttonClass('secondary')"
      class="self-start"
      :aria-disabled="isBusyNow || undefined"
      @click="open"
    >
      {{ buttonLabel }}
    </button>
    <AdminStatus v-if="isBusyNow" kind="queued" :text="statusText" />

    <ConfirmDialog
      v-model:visible="isOpen"
      :title="confirmTitle"
      :confirm-label="confirmLabel"
      tone="neutral"
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
