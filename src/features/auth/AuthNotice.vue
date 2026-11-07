<script setup lang="ts">
import Notice from '@/components/ui/Notice.vue';

/** A thin wrapper kept for old call sites: the kit `Notice` with `role="status"` (an auth step's news). Use `Notice` in new code. */
withDefaults(defineProps<{ tone?: 'info' | 'success' | 'warning'; dismissible?: boolean }>(), {
  tone: 'info',
  dismissible: false,
});
defineEmits<{ dismiss: [] }>();
</script>

<template>
  <Notice :tone="tone" role="status" :dismissible="dismissible" @dismiss="$emit('dismiss')">
    <slot />
  </Notice>
</template>
