<script setup lang="ts">
import type { OrganizationDetail } from '@/api/types/organizations';

// Stub until the real panel has content: `hidden` drops it from the header's flex row, so it adds no gap or width.
defineProps<{ organization: OrganizationDetail }>();
</script>

<template><div data-testid="membership-panel" hidden /></template>
