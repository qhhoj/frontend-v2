<script setup lang="ts">
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';

withDefaults(
  defineProps<{
    username: string;
    size?: 24 | 28 | 32;
    status?: 'active' | 'banned' | 'deleted';
    link?: boolean;
  }>(),
  {
    size: 24,
    status: 'active',
    link: true,
  },
);
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-2">
    <UserAvatar :username="username" :size="size" :status="status" />
    <UserName v-if="link" :username="username" class="truncate" />
    <span v-else class="truncate font-semibold">{{ username }}</span>
  </span>
</template>
