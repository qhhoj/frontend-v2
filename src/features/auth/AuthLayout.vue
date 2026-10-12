<script setup lang="ts">
import LocaleToggle from '@/features/shell/LocaleToggle.vue';
import AuthBrand from './AuthBrand.vue';

withDefaults(
  defineProps<{
    title: string;
    lead?: string;
    /** A state card's explanation is the message itself: `status` for a success, `alert` for a dead end. */
    leadRole?: 'status' | 'alert';
    width?: 'narrow' | 'medium' | 'wide' | 'double';
    /** The boards centre the heading of the cards with a badge. */
    centered?: boolean;
  }>(),
  { lead: undefined, leadRole: undefined, width: 'narrow', centered: false },
);
/** Board widths: state cards and 2FA 460, forced change 480, social signup 520, register (two columns) 660. */
const WIDTHS = {
  narrow: 'max-w-[460px]',
  medium: 'max-w-[480px]',
  wide: 'max-w-[520px]',
  double: 'max-w-[660px]',
} as const;
</script>

<template>
  <div
    class="flex min-h-[calc(100dvh-env(safe-area-inset-top))] flex-col pb-[env(safe-area-inset-bottom)]"
  >
    <header
      class="flex items-center justify-between gap-3 border-b border-line bg-surface-solid px-4 py-2 sm:px-8 sm:py-3"
    >
      <AuthBrand />
      <div class="flex items-center gap-3 text-sm">
        <slot name="header-end" />
        <LocaleToggle />
      </div>
    </header>
    <div class="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-8 sm:p-8">
      <section
        class="glass flex w-full flex-col gap-[18px] rounded-panel p-6 sm:p-8"
        :class="WIDTHS[width]"
      >
        <slot name="badge" />
        <div :class="centered && 'text-center'">
          <h1 class="page-title">{{ title }}</h1>
          <p v-if="lead" :role="leadRole" class="mt-1.5 text-sm leading-relaxed text-muted">
            {{ lead }}
          </p>
        </div>
        <slot />
      </section>
      <slot name="after" />
    </div>
  </div>
</template>
