<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { ratingTextClass } from '@/lib/tier-classes';

/** `rating` undefined: not known (no colour); null: unrated. `to` replaces the profile link. */
const props = defineProps<{ username: string; rating?: number | null; to?: RouteLocationRaw }>();

const colourClass = computed(() => ratingTextClass(props.rating));
</script>

<template>
  <RouterLink
    :to="to ?? { name: 'user', params: { username } }"
    class="font-semibold hover:underline"
    :class="colourClass"
  >
    {{ username }}
  </RouterLink>
</template>
