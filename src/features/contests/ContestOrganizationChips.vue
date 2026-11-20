<script setup lang="ts">
import { Building2 } from 'lucide-vue-next';
import type { ContestSummary } from '@/api/types/contests';
import Chip from '@/components/ui/Chip.vue';

defineProps<{ contest: ContestSummary }>();
</script>

<template>
  <Chip
    v-for="organization in contest.organizations"
    :key="organization.slug"
    :to="{ name: 'organization', params: { slug: organization.slug } }"
    :title="organization.name"
    :icon="Building2"
    data-testid="contest-organization-chip"
    >{{ organization.name }}</Chip
  >
</template>
