<script setup lang="ts">
import { computed } from 'vue';
import { ratingTier, tierColor } from '@/lib/rating-tiers';
import { TIER_TEXT_CLASSES } from '@/lib/tier-classes';

/** `rating` undefined: not known (no colour); null: unrated. */
const props = defineProps<{ username: string; rating?: number | null }>();

const colourClass = computed(() =>
  props.rating === undefined
    ? 'text-content'
    : TIER_TEXT_CLASSES[tierColor(ratingTier(props.rating))],
);
</script>

<template>
  <RouterLink
    :to="{ name: 'user', params: { username } }"
    class="font-semibold hover:underline"
    :class="colourClass"
  >
    {{ username }}
  </RouterLink>
</template>
