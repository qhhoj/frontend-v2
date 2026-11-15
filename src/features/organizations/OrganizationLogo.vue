<script setup lang="ts">
import { computed } from 'vue';
import { initialsOf, tileClass } from './org-visuals';

/** The organization's logo, or an initials tile coloured from its slug. */
const props = withDefaults(
  defineProps<{
    organization: { slug: string; name: string; shortName: string; logoOverrideImage?: string };
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { size: 'md' },
);
const SIZE_CLASSES = {
  sm: 'size-7 rounded-cell text-caption leading-4',
  md: 'size-12 rounded-cell text-subtitle leading-7',
  lg: 'size-[76px] rounded-row text-page',
} as const;
const sizeClass = computed(() => SIZE_CLASSES[props.size]);
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
