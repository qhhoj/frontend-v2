<script setup lang="ts">
import { Ban, CircleCheck, CircleDashed } from 'lucide-vue-next';
import AdminChip from '../ui/AdminChip.vue';
import type { ChipTone } from '../ui/AdminChip.vue';
import type { UserStatus } from './users-list';

/** An account's state as one chip: Hoạt động, Bị cấm or Chưa kích hoạt. */
defineProps<{ status: UserStatus }>();
const LOOK = {
  active: { tone: 'positive', icon: CircleCheck },
  banned: { tone: 'negative', icon: Ban },
  inactive: { tone: 'caution', icon: CircleDashed },
} as const satisfies Record<UserStatus, { tone: ChipTone; icon: unknown }>;
</script>

<template>
  <AdminChip :tone="LOOK[status].tone" :icon="LOOK[status].icon">
    {{ $t(`admin.users.list.status.${status}`) }}
  </AdminChip>
</template>
