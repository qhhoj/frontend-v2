<script setup lang="ts">
import UserLink from '@/components/UserLink.vue';

/** Shim over `UserLink` (sizes are pixel edges here); new code uses `UserLink` with `status` and `link`. */
const SIZE_NAMES = { 24: 'xs', 28: 'sm', 32: 'md' } as const;
withDefaults(
  defineProps<{
    username: string;
    /** Undefined: not known (no colour); null: unrated. */
    rating?: number | null;
    size?: 24 | 28 | 32;
    status?: 'active' | 'banned' | 'deleted';
    link?: boolean;
  }>(),
  { rating: undefined, size: 24, status: 'active', link: true },
);
</script>

<template>
  <UserLink
    :username="username"
    :rating="rating"
    :size="SIZE_NAMES[size]"
    :status="status"
    :link="link"
  />
</template>
