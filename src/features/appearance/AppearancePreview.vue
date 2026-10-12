<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
</script>

<template>
  <!-- Decorative: it shows the page's own tokens at work, so assistive technology skips it. Nothing in here is focusable. -->
  <div aria-hidden="true" class="flex flex-col gap-3.5">
    <Card class="flex flex-col gap-3.5 p-6">
      <div class="flex items-center justify-between gap-3">
        <h3 class="font-display text-[22px] font-bold">{{ $t('appearance.previewTitle') }}</h3>
        <span
          class="rounded-pill bg-verdict-ac-bg px-3 py-1 font-mono text-xs font-semibold text-verdict-ac"
        >
          AC
        </span>
      </div>
      <p class="leading-relaxed">
        {{ $t('appearance.previewBody') }}
        <span class="text-accent-text underline">{{ $t('appearance.previewLink') }}</span>
      </p>
      <span
        class="bg-gradient-accent flex h-13 items-center justify-center rounded-pill font-display font-bold text-on-accent"
      >
        {{ $t('appearance.previewSubmit') }}
      </span>
    </Card>
    <span
      class="inline-flex h-10 w-fit items-center gap-2 rounded-pill border border-accent bg-accent-soft px-3.5 text-sm text-accent-soft-text"
    >
      <span class="bg-gradient-accent size-6 rounded-full" />
      {{ $t('appearance.previewTag') }}
    </span>
  </div>
</template>
