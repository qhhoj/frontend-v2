<script setup lang="ts">
import { computed } from 'vue';
import { initialsOf, tileClass } from './org-visuals';

/** The organization's logo, or an initials tile coloured from its slug. */
const props = withDefaults(
  defineProps<{
    organization: { slug: string; name: string; shortName: string; logoOverrideImage?: string };
    size?: 'md' | 'lg';
  }>(),
  { size: 'md' },
);
const sizeClass = computed(() =>
  props.size === 'lg' ? 'size-[76px] rounded-row text-3xl' : 'size-12 rounded-cell text-lg',
);
const initials = computed(() => initialsOf(props.organization.name, props.organization.shortName));
</script>

<template>
  <img
    v-if="organization.logoOverrideImage"
    :src="organization.logoOverrideImage"
    alt=""
    class="shrink-0 object-cover"
    :class="sizeClass"
  />
  <span
    v-else
    aria-hidden="true"
    class="flex shrink-0 items-center justify-center font-display font-bold"
    :class="[sizeClass, tileClass(organization.slug)]"
  >
    {{ initials }}
  </span>
</template>
