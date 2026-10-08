<script setup lang="ts">
import BitSprite from '@/components/BitSprite.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
</script>

<template>
  <section
    data-testid="contest-not-found"
    class="mx-auto flex max-w-xl flex-col items-center gap-3 py-10 text-center"
  >
    <div data-testid="crying-bit" aria-hidden="true" class="[--bit-px:6px]">
      <BitSprite :look="PLACEMENT_LOOKS.crying" blinking tears />
    </div>
    <h1 class="font-display text-3xl font-bold">{{ $t('contests.detail.notFoundTitle') }}</h1>
    <p class="text-muted">{{ $t('contests.detail.notFoundBody') }}</p>
    <RouterLink
      :to="{ name: 'contests' }"
      class="inline-flex min-h-11 items-center rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
    >
      {{ $t('contests.detail.backToList') }}
    </RouterLink>
  </section>
</template>
