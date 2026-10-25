<script setup lang="ts">
import { ref, watch } from 'vue';
import { addParticipation } from '@/api/contest-admin.api';
import type { AddParticipationBody } from '@/api/contest-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import AdminField from '../../ui/AdminField.vue';
import { failureTextOf, fieldErrorsOf } from '../../ui/admin-errors';
import { INPUT } from '../../ui/controls';
import { provideDateValidity } from '../../ui/form/date-validity';
import AdminDateTimeField from '../../ui/form/AdminDateTimeField.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';

/** Adds a user's live participation or a new virtual run by hand; an empty start lets the server pick its default. */
const props = defineProps<{ contestKey: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ added: [username: string] }>();
const username = ref('');
const kind = ref<AddParticipationBody['kind']>('live');
const start = ref<string | null>(null);
const { hasUnreadableDate } = provideDateValidity();

const mutation = useAdminMutation({
  mutate: () =>
    addParticipation(props.contestKey, {
      user: username.value.trim(),
      kind: kind.value,
      realStart: start.value ?? undefined,
    }),
  successText: () =>
    translate('admin.contestOps.participants.added', { username: username.value.trim() }),
  invalidates: () => [
    ['admin', 'participations', props.contestKey],
    ['admin', 'contest', props.contestKey],
  ],
  onDone: () => {
    emit('added', username.value.trim());
    visible.value = false;
  },
});

watch(visible, (isOpen) => {
  if (!isOpen) return;
  mutation.reset();
  username.value = '';
  kind.value = 'live';
  start.value = null;
});
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('admin.contestOps.participants.addTitle')"
    :confirm-label="$t('admin.contestOps.participants.add')"
    :busy="mutation.isPending.value"
    :can-confirm="username.trim().length > 0 && !hasUnreadableDate"
    :width="520"
    @confirm="mutation.run(undefined)"
  >
    <div class="flex flex-col gap-4">
      <AdminField
        input-id="add-participation-user"
        :label="$t('admin.contestOps.participants.userLabel')"
        :error="fieldErrorsOf(mutation.failure.value).user"
      >
        <template #default="{ id, describedBy, invalid }">
          <input
            :id="id"
            v-model="username"
            :class="INPUT"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            autocomplete="off"
            spellcheck="false"
          />
        </template>
      </AdminField>
      <fieldset class="flex flex-col gap-2">
        <legend class="mb-1.5 text-sm font-semibold">
          {{ $t('admin.contestOps.participants.kindLabel') }}
        </legend>
        <label class="flex min-h-11 items-center gap-2">
          <input
            v-model="kind"
            type="radio"
            value="live"
            class="size-4 accent-accent"
          />
          {{ $t('admin.contestOps.participants.kindLive') }}
        </label>
        <label class="flex min-h-11 items-center gap-2">
          <input
            v-model="kind"
            type="radio"
            value="virtual"
            class="size-4 accent-accent"
          />
          {{ $t('admin.contestOps.participants.kindVirtual') }}
        </label>
      </fieldset>
      <AdminDateTimeField
        v-model="start"
        input-id="add-participation-start"
        :label="$t('admin.contestOps.participants.startLabel')"
        :hint="$t('admin.contestOps.participants.startHint')"
      />
    </div>
    <template #error>
      <p
        v-if="mutation.failure.value && !fieldErrorsOf(mutation.failure.value).user"
        role="alert"
        class="text-sm text-negative"
      >
        {{ failureTextOf(mutation.failure.value) }}
      </p>
    </template>
  </ConfirmDialog>
</template>
