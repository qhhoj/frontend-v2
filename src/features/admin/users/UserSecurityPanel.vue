<script setup lang="ts">
import { computed } from 'vue';
import type { UserEdit } from '@/api/types/users-admin';
import { usePermissions } from '@/stores/use-permissions';
import AdminNotice from '../ui/feedback/AdminNotice.vue';
import { needsPermissionText } from '../ui/permission-text';
import UserPasswordForm from './UserPasswordForm.vue';
import UserResetLink from './UserResetLink.vue';
import UserTwoFactorReset from './UserTwoFactorReset.vue';

/** The Bảo mật tab: a new password and the reset link (`auth.change_user`), then the 2FA reset (`judge.ban_user`). */
defineProps<{ user: UserEdit; hadTwoFactor: boolean }>();
const { can } = usePermissions();
const canCredentials = computed(() => can('auth.change_user'));
const canResetTwoFactor = computed(() => can('judge.ban_user'));
</script>

<template>
  <div class="flex flex-col divide-y divide-line [&>*]:py-5 [&>*:first-child]:pt-0">
    <template v-if="canCredentials">
      <UserPasswordForm :username="user.username" />
      <UserResetLink :username="user.username" :email="user.email" />
    </template>
    <div v-else>
      <AdminNotice tone="info" :title="needsPermissionText('auth.change_user')" />
    </div>
    <UserTwoFactorReset
      v-if="canResetTwoFactor && hadTwoFactor"
      :username="user.username"
      :has-two-factor="user.hasTwoFactor"
    />
  </div>
</template>
