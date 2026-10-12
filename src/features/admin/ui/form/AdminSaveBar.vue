<script setup lang="ts">
import SaveBar from '@/components/ui/SaveBar.vue';
import type { SaveBarProps } from '@/components/ui/SaveBar.props';

/** The admin forms' save bar: `SaveBar` as is (`#status` and `#actions` pass through). */
const props = defineProps<SaveBarProps>();
const emit = defineEmits<{ discard: [] }>();
</script>

<template>
  <SaveBar v-bind="props" @discard="emit('discard')">
    <template v-for="(_, name) in $slots" #[name]><slot :name="name" /></template>
  </SaveBar>
</template>
