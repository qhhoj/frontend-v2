<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import ContinueButton from './ContinueButton.vue';

/** "Tiếp tục": one slim row, a hint and one button back to the last problem that is not solved. */
defineProps<{ username: string }>();
</script>

<template>
  <Card
    data-testid="continue-card"
    padding="sm"
    class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
  >
    <p class="text-meta text-muted">{{ $t('home.continueHint') }}</p>
    <ContinueButton :username="username" />
  </Card>
</template>
