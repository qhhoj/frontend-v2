<script setup lang="ts">
import { ref, useId } from 'vue';
import Card from '@/components/ui/Card.vue';

/** One titled settings card on the shared glass surface. */
defineProps<{ title: string; lead?: string }>();
const headingId = useId();
const headingElement = ref<HTMLElement | null>(null);
/** After a finished action the parent moves focus here, so it never falls back to the body. */
const focusHeading = () => headingElement.value?.focus();
defineExpose({ focusHeading });
</script>

<template>
  <Card :aria-labelledby="headingId" class="flex flex-col gap-5 p-5 md:p-7">
    <header class="flex flex-wrap items-start justify-between gap-4">
      <div class="max-w-[620px]">
        <h2
          :id="headingId"
          ref="headingElement"
          tabindex="-1"
          class="section-title focus-visible:outline-none"
        >
          {{ title }}
        </h2>
        <p v-if="lead" class="mt-1 text-sm leading-relaxed text-muted">{{ lead }}</p>
      </div>
      <slot name="header-end" />
    </header>
    <slot />
  </Card>
</template>
