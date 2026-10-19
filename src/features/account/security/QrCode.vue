<script setup lang="ts">
import { computed } from 'vue';
import { qrModules, qrPath } from './qr';

/** Dark modules on white in every theme (`qr-ink` on `qr-paper`), with the 4-module quiet zone scanners need. */
const props = defineProps<{ text: string; label: string }>();
const QUIET_ZONE = 4;
const modules = computed(() => qrModules(props.text));
const viewBox = computed(() => {
  const side = modules.value.length + QUIET_ZONE * 2;
  return `${-QUIET_ZONE} ${-QUIET_ZONE} ${side} ${side}`;
});
</script>

<template>
  <svg
    role="img"
    :aria-label="label"
    :viewBox="viewBox"
    shape-rendering="crispEdges"
    class="size-[200px] shrink-0 rounded-row border border-line bg-qr-paper text-qr-ink"
  >
    <path :d="qrPath(modules)" fill="currentColor" />
  </svg>
</template>
