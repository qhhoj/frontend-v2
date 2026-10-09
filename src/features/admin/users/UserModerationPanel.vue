<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQueryClient } from '@tanstack/vue-query';
import type { UserPage } from '@/api/types/users';
import { banUser } from '@/api/users.api';
import { unbanUser } from '@/api/users-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS, ADMIN_INPUT_CLASS } from '../ui/classes';
import { banReasonProblem } from './users-list';
import { invalidateUserModeration } from './users.queries';

const props = defineProps<{ user: UserPage }>();
const { t } = useI18n();
const queryClient = useQueryClient();
const reason = ref('');
const reasonRequiredText = ref<string | null>(null);
const isConfirmOpen = ref(false);
const isBanned = computed(() => props.user.displayRank === 'banned');

const ban = useAdminMutation({
  mutate: (vars: { username: string; reason: string }) => banUser(vars.username, vars.reason),
  onDone: (_result, vars) => {
    void invalidateUserModeration(queryClient, vars.username);
  },
});
const unban = useAdminMutation({
  mutate: (username: string) => unbanUser(username),
  onDone: (_result, username) => {
    void invalidateUserModeration(queryClient, username);
  },
});

const reasonError = computed(
  () => reasonRequiredText.value ?? ban.fieldErrors.value.reason ?? undefined,
);
/** A refusal that is not about a field (a conflict) is a line of its own; a field refusal sits under the box. */
const banRefusal = computed(() => {
  const error = ban.failure.value;
  if (error === null || Object.keys(ban.fieldErrors.value).length > 0) return null;
  return error.code === 'conflict'
    ? t('admin.users.moderation.alreadyBanned')
    : failureTextOf(error);
});
const unbanRefusal = computed(() => {
  const error = unban.failure.value;
  if (error === null) return null;
  return error.code === 'conflict' ? t('admin.users.moderation.notBanned') : failureTextOf(error);
});

const banReasonText = (problem: 'required' | 'tooLong') =>
  problem === 'required'
    ? t('admin.users.moderation.reasonRequired')
    : t('admin.users.moderation.reasonTooLong');

/** An empty reason marks the box and opens nothing; a valid one asks for the confirm. */
function requestBan() {
  const problem = banReasonProblem(reason.value);
  reasonRequiredText.value = problem ? banReasonText(problem) : null;
  if (problem === null) isConfirmOpen.value = true;
}

/** The dialog closes whatever the answer: a refusal shows under the box or as a line of the panel. */
async function confirmBan() {
  await ban.run({ username: props.user.username, reason: reason.value.trim() });
  isConfirmOpen.value = false;
}
</script>

<template>
  <SettingsCard :title="$t('admin.users.moderation.title')">
    <template v-if="!isBanned">
      <AdminField
        v-slot="{ id, describedBy, invalid }"
        :label="$t('admin.users.moderation.reasonLabel')"
        :hint="$t('admin.users.moderation.reasonHint')"
        :error="reasonError"
        input-id="ban-reason"
      >
        <textarea
          :id="id"
          v-model="reason"
          rows="3"
          :class="ADMIN_INPUT_CLASS"
          :aria-describedby="describedBy"
          :aria-invalid="invalid === 'true'"
        />
      </AdminField>
      <button type="button" :class="ADMIN_DANGER_CLASS" @click="requestBan">
        {{ $t('admin.users.moderation.ban') }}
      </button>
      <AdminStatus v-if="banRefusal" kind="refused" :text="banRefusal" />
      <AdminStatus
        v-if="unban.isDone.value"
        kind="done"
        :text="$t('admin.users.moderation.unbanned', { username: user.username })"
      />
      <AdminStatus v-if="unbanRefusal" kind="refused" :text="unbanRefusal" />
      <ConfirmDialog
        v-model:visible="isConfirmOpen"
        :title="$t('admin.users.moderation.banDialog.title', { username: user.username })"
        :body="$t('admin.users.moderation.banDialog.body')"
        :confirm-label="$t('admin.users.moderation.banDialog.confirm')"
        tone="danger"
        :busy="ban.isPending.value"
        @confirm="confirmBan"
      />
    </template>
    <template v-else>
      <p class="font-semibold">{{ $t('admin.users.moderation.banned.title') }}</p>
      <p class="text-sm">
        {{
          user.staff?.banReason
            ? $t('admin.users.moderation.banned.reason', { reason: user.staff.banReason })
            : $t('admin.users.moderation.banned.noReason')
        }}
      </p>
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="unban.run(user.username)">
        {{ $t('admin.users.moderation.banned.unban') }}
      </button>
      <p class="text-xs text-muted">{{ $t('admin.users.moderation.banned.unbanHint') }}</p>
      <AdminStatus
        v-if="ban.isDone.value"
        kind="done"
        :text="$t('admin.users.moderation.done', { username: user.username })"
      />
      <AdminStatus v-if="unbanRefusal" kind="refused" :text="unbanRefusal" />
    </template>
  </SettingsCard>
</template>
