<script setup lang="ts">
import type { PolygonPackageType } from '@/api/types/polygon';
import AdminChip from '../../ui/AdminChip.vue';

/** A Polygon package's type as a chip; nothing when the package is not READY (the server sends no type then). */
defineProps<{ type: PolygonPackageType | null }>();
</script>

<template>
  <AdminChip v-if="type" tone="accent" data-testid="polygon-package-type">{{
    $t(`admin.polygonLink.packageType.${type}`)
  }}</AdminChip>
</template>
