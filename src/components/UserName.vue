<script setup lang="ts">
import { computed } from 'vue';
import { ratingTier, tierColor } from '@/lib/rating-tiers';
import type { TierColor } from '@/lib/rating-tiers';

/** `rating` undefined: not known (no colour); null: unrated. */
const props = defineProps<{ username: string; rating?: number | null }>();

const TIER_CLASSES: Record<TierColor, string> = {
  none: 'text-tier-none',
  newbie: 'text-tier-newbie',
  pupil: 'text-tier-pupil',
  specialist: 'text-tier-specialist',
  expert: 'text-tier-expert',
  'candidate-master': 'text-tier-candidate-master',
  master: 'text-tier-master',
  grandmaster: 'text-tier-grandmaster',
};
const colourClass = computed(() =>
  props.rating === undefined ? 'text-content' : TIER_CLASSES[tierColor(ratingTier(props.rating))],
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
