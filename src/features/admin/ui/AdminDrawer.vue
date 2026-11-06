<script setup lang="ts">
import Drawer from '@/components/ui/Drawer.vue';

/** The admin side panel: the kit `Drawer` (right side, `size` sm 400 / md 560 / lg 720 px), kept under its old name for the admin screens. */
const props = defineProps<{ title: string; subtitle?: string; size?: 'sm' | 'md' | 'lg' }>();
const visible = defineModel<boolean>('visible', { required: true });
defineEmits<{ hide: [] }>();
</script>

<template>
  <Drawer v-model:visible="visible" v-bind="props" @hide="$emit('hide')">
    <template v-if="$slots.meta" #meta><slot name="meta" /></template>
    <template v-if="$slots.tabs" #tabs><slot name="tabs" /></template>
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </Drawer>
</template>
