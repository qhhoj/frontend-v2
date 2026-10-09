<script setup lang="ts">
import { computed, ref } from 'vue';
import { setDisqualified } from '@/api/contest-editing.api';
import type { Participation } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { formatDateTime } from '@/lib/format';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import type { AdminQueryKey } from '../../ui/use-admin-mutation';
import { participationKindKey } from './participations';

/** One participation's removal from the board: a confirmed disqualify, or an immediate restore (it only undoes). */
const props = defineProps<{ contestKey: string; participation: Participation }>();
const locale = useLocaleStore();
const isOpen = ref(false);
const kindText = computed(() => {
  const kind = participationKindKey(props.participation.virtual);
  return translate(kind.key, kind.params ?? {});
});
const invalidate = (): AdminQueryKey[] => [['admin', 'participations', props.contestKey]];

const disqualify = useAdminMutation({
  mutate: () => setDisqualified(props.contestKey, props.participation.id, true),
  invalidates: invalidate,
  onDone: () => {
    isOpen.value = false;
  },
});
const restore = useAdminMutation({
  mutate: () => setDisqualified(props.contestKey, props.participation.id, false),
  invalidates: invalidate,
});
</script>

<template>
  <div class="flex flex-col items-start gap-1">
    <button
      v-if="participation.isDisqualified"
      type="button"
      :class="ADMIN_BUTTON_CLASS"
      :aria-busy="restore.isPending.value || undefined"
      @click="restore.run(undefined)"
    >
      {{ $t('admin.contests.participants.restore') }}
    </button>
    <button v-else type="button" :class="ADMIN_DANGER_CLASS" @click="isOpen = true">
      {{ $t('admin.contests.participants.disqualify') }}
    </button>
    <AdminStatus
      v-if="restore.failure.value"
      kind="refused"
      :text="failureTextOf(restore.failure.value)"
    />

    <ConfirmDialog
      v-model:visible="isOpen"
      :title="
        $t('admin.contests.participants.disqualifyTitle', { username: participation.user.username })
      "
      :body="
        $t('admin.contests.participants.disqualifyBody', {
          kind: kindText,
          time: formatDateTime(participation.realStart, locale.locale),
        })
      "
      :confirm-label="$t('admin.contests.participants.disqualify')"
      tone="danger"
      :busy="disqualify.isPending.value"
      @confirm="disqualify.run(undefined)"
    >
      <template #error>
        <p v-if="disqualify.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(disqualify.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </div>
</template>
