<script setup lang="ts">
import { computed } from 'vue';
import { KeyRound, ShieldCheck, Trophy } from 'lucide-vue-next';
import type { UserPage } from '@/api/types/users';
import type { UserEdit } from '@/api/types/users-admin';
import { isBannedPage } from '@/lib/user-ban';
import AdminChip from '../ui/AdminChip.vue';
import UserStatusChips from './UserStatusChips.vue';
import type { UserStatus } from './users-list';

/** The drawer header's chips: status, superuser or staff, 2FA and "in a contest" (the last two only for editors). */
const props = defineProps<{ page: UserPage; edit?: UserEdit }>();
const status = computed<UserStatus>(() => {
  const staff = props.page.staff;
  if (isBannedPage(props.page)) return 'banned';
  return staff && !staff.isActive ? 'inactive' : 'active';
});
</script>

<template>
  <UserStatusChips :status="status" />
  <AdminChip v-if="page.staff?.isSuperuser" tone="accent" :icon="ShieldCheck">
    {{ $t('admin.users.list.status.superuser') }}
  </AdminChip>
  <AdminChip v-else-if="edit?.isStaff" tone="info">
    {{ $t('admin.users.list.status.staff') }}
  </AdminChip>
  <AdminChip v-if="edit?.hasTwoFactor" :icon="KeyRound">
    {{ $t('admin.users.edit.chips.twoFactor') }}
  </AdminChip>
  <AdminChip v-if="edit?.inContest" tone="caution" :icon="Trophy">
    {{ $t('admin.users.edit.chips.inContest') }}
  </AdminChip>
</template>
