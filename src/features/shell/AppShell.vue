<script setup lang="ts">
import AppHeader from './AppHeader.vue';
import BackgroundBlobs from './BackgroundBlobs.vue';
import { useAccountThemeSync } from './use-account-theme';

useAccountThemeSync();
</script>

<template>
  <!-- `isolate` keeps the fixed blobs (-z-10) above this ground and below the content. -->
  <div class="relative isolate min-h-dvh bg-ground font-body text-[15px] text-content">
    <BackgroundBlobs />
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-pill focus:bg-surface-solid focus:px-4 focus:py-2"
    >
      {{ $t('app.skipToContent') }}
    </a>
    <AppHeader />
    <main id="main" tabindex="-1" class="relative">
      <slot />
    </main>
  </div>
</template>
