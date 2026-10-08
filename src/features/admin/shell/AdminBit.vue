<script setup lang="ts">
import InlineBit from '@/components/InlineBit.vue';
import { ADMIN_BIT_KINDS } from './admin-bit';
import type { AdminBitPlacement } from './admin-bit';

/** Decorative: the words beside it carry the meaning. */
defineProps<{ placement: AdminBitPlacement }>();
</script>

<template>
  <InlineBit
    data-testid="admin-bit"
    :data-placement="placement"
    :kind="ADMIN_BIT_KINDS[placement]"
  />
</template>
