<script setup lang="ts">
import type { OrganizationDetail } from '@/api/types/organizations';

defineProps<{ organization: OrganizationDetail }>();
</script>

<template><div data-testid="membership-panel" /></template>
