<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQueryClient } from '@tanstack/vue-query';
import type { UserEdit } from '@/api/types/users-admin';
import { updateUserByStaff } from '@/api/users-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import AdminStatus from '../ui/AdminStatus.vue';
import { BUTTON } from '../ui/controls';
import UserDangerRow from './UserDangerRow.vue';
import { invalidateUserModeration } from './users.queries';

/** Deactivate (confirmed) or reactivate the account (`auth.change_user`); a banned account is reactivated by the unban. */
const props = defineProps<{ user: UserEdit }>();
const { t } = useI18n();
const queryClient = useQueryClient();
const isConfirmOpen = ref(false);
const activation = useAdminMutation({
  mutate: (isActive: boolean) => updateUserByStaff(props.user.username, { isActive }),
  successText: (_result, isActive) =>
    t(isActive ? 'admin.users.edit.account.activated' : 'admin.users.edit.account.deactivated', {
      username: props.user.username,
    }),
  onDone: () => {
    isConfirmOpen.value = false;
    void invalidateUserModeration(queryClient, props.user.username);
  },
});
const refusal = computed(() =>
  activation.failure.value ? failureTextOf(activation.failure.value) : null,
);
const stateText = computed(() => {
  if (props.user.isActive) return t('admin.users.edit.account.active');
  return props.user.banReason !== null
    ? t('admin.users.edit.account.banned')
    : t('admin.users.edit.account.inactive');
});
</script>

<template>
  <UserDangerRow :title="$t('admin.users.edit.account.deactivate')" :text="stateText">
    <button v-if="user.isActive" type="button" :class="BUTTON.danger" @click="isConfirmOpen = true">
      {{ $t('admin.users.edit.account.deactivate') }}
    </button>
    <button
      v-else-if="user.banReason === null"
      type="button"
      :class="BUTTON.secondary"
      :aria-busy="activation.isPending.value || undefined"
      @click="activation.run(true)"
    >
      {{ $t('admin.users.edit.account.activate') }}
    </button>
    <template #status>
      <AdminStatus v-if="refusal" kind="refused" :text="refusal" />
    </template>
  </UserDangerRow>
  <ConfirmDialog
    v-model:visible="isConfirmOpen"
    :title="$t('admin.users.edit.account.deactivateDialog.title', { username: user.username })"
    :body="$t('admin.users.edit.account.deactivateDialog.body')"
    :confirm-label="$t('admin.users.edit.account.deactivate')"
    tone="danger"
    :busy="activation.isPending.value"
    @confirm="activation.run(false)"
  />
</template>
