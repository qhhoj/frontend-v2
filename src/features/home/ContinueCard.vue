<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import ContinueButton from './ContinueButton.vue';

/** "Tiếp tục": the first thing a signed-in student sees, one button back to the last problem that is not solved. */
defineProps<{ username: string }>();
</script>

<template>
  <Card data-testid="continue-card" padding="lg" class="flex flex-col justify-center gap-3">
    <p class="text-meta text-muted">{{ $t('home.continueHint') }}</p>
    <ContinueButton :username="username" />
  </Card>
</template>
