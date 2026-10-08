<script setup lang="ts">
import BitMascot from '@/components/BitMascot.vue';
import GlassCard from '@/components/GlassCard.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
</script>

<template>
  <GlassCard data-testid="welcome-card" class="flex items-center gap-4 p-6 sm:gap-8 sm:p-8">
    <div class="min-w-0 flex-1">
      <h1 class="font-display text-3xl font-bold">{{ $t('home.welcomeTitle') }}</h1>
      <p class="mt-2 text-muted">{{ $t('home.welcomeBody') }}</p>
    </div>
    <BitMascot
      data-testid="home-bit"
      :look="PLACEMENT_LOOKS.hero"
      blinks
      class="[--bit-px:5px] sm:[--bit-px:7px]"
    />
  </GlassCard>
</template>
