<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import AppearancePanel from '@/features/appearance/AppearancePanel.vue';
import LocaleToggle from '@/features/shell/LocaleToggle.vue';
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import LoginBrandPanel from './LoginBrandPanel.vue';

withDefaults(
  defineProps<{
    title: string;
    lead?: string;
    /** A state card's explanation is the message itself: `status` for a success, `alert` for a dead end. */
    leadRole?: 'status' | 'alert';
    width?: 'narrow' | 'medium' | 'wide' | 'double';
    /** The boards centre the heading of the cards with a badge. */
    centered?: boolean;
    /** Sign-in, sign-up and the forgotten password split the page with the brand panel from xl (the two-column signup needs the room), a band above the form below it. */
    brand?: boolean;
  }>(),
  { lead: undefined, leadRole: undefined, width: 'narrow', centered: false, brand: false },
);
/** Board widths: state cards, login and 2FA 460, forced change 480, social signup 520, register (two columns) 660. */
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
      <BrandWordmark />
      <div class="flex items-center gap-2 text-sm sm:gap-3">
        <slot name="header-end" />
        <LocaleToggle />
        <AppearancePanel />
      </div>
    </header>
    <div
      class="flex flex-1 flex-col"
      :class="brand && 'xl:grid xl:grid-cols-[minmax(0,7fr)_minmax(0,9fr)]'"
    >
      <LoginBrandPanel v-if="brand" />
      <div
        class="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-8 sm:p-8"
        :class="brand && 'max-xl:justify-start max-xl:pt-6'"
      >
        <Card class="flex w-full flex-col gap-[18px] p-6 sm:p-8" :class="WIDTHS[width]">
          <slot name="badge" />
          <div :class="centered && 'text-center'">
            <h1 class="page-title">{{ title }}</h1>
            <p v-if="lead" :role="leadRole" class="mt-1.5 text-sm leading-relaxed text-muted">
              {{ lead }}
            </p>
          </div>
          <slot />
        </Card>
        <slot name="after" />
      </div>
    </div>
  </div>
</template>
