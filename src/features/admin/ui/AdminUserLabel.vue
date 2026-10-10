<script setup lang="ts">
import { ratingTextClass } from '@/lib/tier-classes';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';

withDefaults(
  defineProps<{
    username: string;
    /** Undefined: not known (no colour); null: unrated. */
    rating?: number | null;
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
    <UserName v-if="link" :username="username" :rating="rating" class="truncate" />
    <span v-else :class="ratingTextClass(rating)" class="truncate font-semibold">{{
      username
    }}</span>
  </span>
</template>
