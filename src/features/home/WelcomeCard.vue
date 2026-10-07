<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
</script>

<template>
  <GlassCard class="p-8">
    <h1 class="font-display text-3xl font-bold">{{ $t('home.welcomeTitle') }}</h1>
    <p class="mt-2 text-muted">{{ $t('home.welcomeBody') }}</p>
  </GlassCard>
</template>
