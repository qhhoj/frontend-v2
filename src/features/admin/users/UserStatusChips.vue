<script setup lang="ts">
import { Ban, CircleCheck, CircleDashed } from 'lucide-vue-next';
import Chip from '@/components/ui/Chip.vue';
import type { ChipTone } from '@/components/ui/Chip.vue';
import type { UserStatus } from './users-list';

/** An account's state as one chip: Hoạt động, Bị cấm or Chưa kích hoạt. */
defineProps<{ status: UserStatus }>();
const LOOK = {
  active: { tone: 'success', icon: CircleCheck },
  banned: { tone: 'danger', icon: Ban },
  inactive: { tone: 'warning', icon: CircleDashed },
} as const satisfies Record<UserStatus, { tone: ChipTone; icon: unknown }>;
</script>

<template>
  <Chip :tone="LOOK[status].tone" :icon="LOOK[status].icon">
    {{ $t(`admin.users.list.status.${status}`) }}
  </Chip>
</template>
