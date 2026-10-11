<script setup lang="ts">
import type { PolygonPackageType } from '@/api/types/polygon';

/** A Polygon package's type as a pill; nothing when the package is not READY (the server sends no type then). */
defineProps<{ type: PolygonPackageType | null }>();
</script>

<template>
  <span
    v-if="type"
    data-testid="polygon-package-type"
    class="inline-flex items-center rounded-pill bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-text"
    >{{ $t(`admin.polygonLink.packageType.${type}`) }}</span
  >
</template>
