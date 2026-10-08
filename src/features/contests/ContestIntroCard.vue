<script setup lang="ts">
import type { ContestDetail } from '@/api/types/contests';
import GlassCard from '@/components/GlassCard.vue';
import UserContent from '@/components/UserContent.vue';

defineProps<{ contest: ContestDetail }>();
</script>

<template>
  <GlassCard v-if="contest.descriptionHtml" data-testid="contest-intro" class="p-5 md:p-6">
    <h2 class="mb-2 font-display text-lg font-semibold">{{ $t('contests.rules.intro') }}</h2>
    <UserContent :html="contest.descriptionHtml" />
  </GlassCard>
</template>
