<script setup lang="ts">
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';

/** The one way to name a user: Bit avatar, then the rating-coloured name linking to the profile. */
withDefaults(
  defineProps<{
    username: string;
    /** Undefined: not known (no colour); null: unrated. */
    rating?: number | null;
    /** Avatar edge: xs 24 px, sm 28 px, md 32 px. */
    size?: 'xs' | 'sm' | 'md';
    showAvatar?: boolean;
  }>(),
  { size: 'xs', showAvatar: true },
);

const AVATAR_PX = { xs: 24, sm: 28, md: 32 } as const;
</script>

<template>
  <span
    class="inline-flex max-w-full min-w-0 items-center align-middle"
    :class="size === 'xs' ? 'gap-1.5' : 'gap-2'"
  >
    <UserAvatar v-if="showAvatar" :username="username" :size="AVATAR_PX[size]" />
    <UserName :username="username" :rating="rating" :title="username" class="min-w-0 truncate" />
  </span>
</template>
