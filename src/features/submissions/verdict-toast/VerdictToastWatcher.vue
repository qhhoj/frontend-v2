<script setup lang="ts">
import { watch } from 'vue';
import { useViewerId } from '@/stores/use-viewer-id';
import VerdictWatch from './VerdictWatch.vue';
import { trackedSubmissions } from './tracked-submissions';

/** Mounted once in the shell: follows every submission the viewer sent and not yet finished. Another account starts clean. */
const viewer = useViewerId();
watch(viewer, () => trackedSubmissions.clear());
</script>

<template>
  <VerdictWatch v-for="entry in trackedSubmissions.values()" :key="entry.id" :entry="entry" />
</template>
