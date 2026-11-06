<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { ratingTextClass } from '@/lib/tier-classes';
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
    /** Where the name links instead of the profile. */
    to?: RouteLocationRaw;
    /** `banned` and `deleted` show on the avatar. */
    status?: 'active' | 'banned' | 'deleted';
    /** False: the name is plain text (a row that is already a link, or a name with no profile). */
    link?: boolean;
  }>(),
  { size: 'xs', showAvatar: true, to: undefined, rating: undefined, status: 'active', link: true },
);

const AVATAR_PX = { xs: 24, sm: 28, md: 32 } as const;
</script>

<template>
  <span
    class="inline-flex max-w-full min-w-0 items-center align-middle"
    :class="size === 'xs' ? 'gap-1.5' : 'gap-2'"
  >
    <UserAvatar v-if="showAvatar" :username="username" :size="AVATAR_PX[size]" :status="status" />
    <UserName
      v-if="link"
      :username="username"
      :rating="rating"
      :title="username"
      :to="to"
      class="min-w-0 truncate"
    />
    <span
      v-else
      :class="ratingTextClass(rating)"
      :title="username"
      class="min-w-0 truncate font-semibold"
      >{{ username }}</span
    >
  </span>
</template>
