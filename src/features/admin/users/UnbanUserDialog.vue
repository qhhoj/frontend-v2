<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQueryClient } from '@tanstack/vue-query';
import { unbanUser } from '@/api/users-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { failureTextOf, isConflict } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { invalidateUserModeration } from './users.queries';

/**
 * Confirms lifting a site ban (`judge.ban_user`), for the user drawer and the profile header alike. Success toasts, refreshes
 * the user's page and lists, and closes; a refusal (409: not banned) stays inside the dialog.
 */
const props = defineProps<{ username: string }>();
const visible = defineModel<boolean>('visible', { required: true });
const { t } = useI18n();
const queryClient = useQueryClient();

const unban = useAdminMutation({
  mutate: (username: string) => unbanUser(username),
  successText: (_result, username) => t('admin.users.moderation.unbanned', { username }),
  onDone: (_result, username) => {
    visible.value = false;
    void invalidateUserModeration(queryClient, username);
  },
});
watch(visible, (shown) => {
  if (shown) unban.reset();
});
const refusal = computed(() => {
  const error = unban.failure.value;
  if (error === null) return null;
  return isConflict(error) ? t('admin.users.moderation.notBanned') : failureTextOf(error);
});
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('admin.users.moderation.unbanDialog.title', { username })"
    :body="$t('admin.users.moderation.unbanDialog.body')"
    :confirm-label="$t('admin.users.moderation.banned.unban')"
    :busy="unban.isPending.value"
    @confirm="unban.run(props.username)"
  >
    <template #error>
      <p v-if="refusal" role="alert" class="text-sm text-negative">{{ refusal }}</p>
    </template>
  </ConfirmDialog>
</template>
