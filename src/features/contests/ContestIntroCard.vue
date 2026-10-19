<script setup lang="ts">
import type { ContestDetail } from '@/api/types/contests';
import Card from '@/components/ui/Card.vue';
import UserContent from '@/components/UserContent.vue';

defineProps<{ contest: ContestDetail }>();
</script>

<template>
  <Card v-if="contest.descriptionHtml" data-testid="contest-intro" class="p-5 md:p-6">
    <h2 class="mb-2 section-title">{{ $t('contests.rules.intro') }}</h2>
    <UserContent :html="contest.descriptionHtml" />
  </Card>
</template>
