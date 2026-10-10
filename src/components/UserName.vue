<script setup lang="ts">
import { computed } from 'vue';
import { ratingTextClass } from '@/lib/tier-classes';

/** `rating` undefined: not known (no colour); null: unrated. */
const props = defineProps<{ username: string; rating?: number | null }>();

const colourClass = computed(() => ratingTextClass(props.rating));
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
