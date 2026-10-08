<script setup lang="ts">
import { useId } from 'vue';
import GlassCard from '@/components/GlassCard.vue';

/** One titled settings card on the shared glass surface. */
defineProps<{ title: string; lead?: string }>();
const headingId = useId();
</script>

<template>
  <GlassCard :aria-labelledby="headingId" class="flex flex-col gap-5 p-5 md:p-7">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="max-w-[620px]">
        <h2 :id="headingId" class="font-display text-xl leading-tight font-bold">
          {{ title }}
        </h2>
        <p v-if="lead" class="mt-1 text-sm leading-relaxed text-muted">{{ lead }}</p>
      </div>
      <slot name="header-end" />
    </header>
    <slot />
  </GlassCard>
</template>
