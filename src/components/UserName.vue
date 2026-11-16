<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { translate } from '@/i18n';
import { ratingTier } from '@/lib/rating-tiers';
import { ratingTextClass } from '@/lib/tier-classes';

/** `rating` undefined: not known (no colour); null: unrated. `to` replaces the profile link. */
const props = defineProps<{ username: string; rating?: number | null; to?: RouteLocationRaw }>();

const colourClass = computed(() => ratingTextClass(props.rating));
/** The tier name behind the colour; nothing when the rating is unknown or the user is unrated. */
const tierName = computed(() => {
  const tier = typeof props.rating === 'number' ? ratingTier(props.rating) : null;
  return tier ? translate(`tiers.${tier}`) : undefined;
});
</script>

<template>
  <RouterLink
    :to="to ?? { name: 'user', params: { username } }"
    class="font-semibold hover:underline touch:-my-4 touch:py-4"
    :class="colourClass"
    :title="tierName"
  >
    {{ username }}
  </RouterLink>
</template>
