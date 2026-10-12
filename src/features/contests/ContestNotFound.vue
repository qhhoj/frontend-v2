<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import BitSprite from '@/components/BitSprite.vue';
import ShortLinkNotFoundHint from '@/components/ShortLinkNotFoundHint.vue';
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
    <h1 class="page-title">{{ $t('contests.detail.notFoundTitle') }}</h1>
    <p class="text-muted">{{ $t('contests.detail.notFoundBody') }}</p>
    <ShortLinkNotFoundHint />
    <AppButton tone="primary" :to="{ name: 'contests' }">
      {{ $t('contests.detail.backToList') }}
    </AppButton>
  </section>
</template>
