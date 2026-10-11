<script setup lang="ts">
import { useId } from 'vue';

/**
 * One section of an admin form card: a 16/600 title, an optional one-line description, then the fields in a grid
 * (two columns from 1024 px, one below; give a full-width child `lg:col-span-2`). Sections sit inside one card
 * (`CARD` from `../controls`) and are split by hairlines. `danger` is the last section, with a red hairline.
 * `id` is the anchor for a section rail or "Đi tới mục".
 */
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    id?: string;
    columns?: 1 | 2;
    danger?: boolean;
  }>(),
  { description: undefined, id: undefined, columns: 2, danger: false },
);
const headingId = useId();
</script>

<template>
  <section
    :id="id"
    :aria-labelledby="headingId"
    class="scroll-mt-4 border-t px-4 py-5 first:border-t-0 sm:px-5"
    :class="danger ? 'border-negative' : 'border-line'"
  >
    <h2
      :id="headingId"
      class="font-display text-base font-semibold"
      :class="danger && 'text-negative'"
    >
      {{ title }}
    </h2>
    <p v-if="description" class="mt-0.5 text-sm text-muted">{{ description }}</p>
    <div class="mt-4 grid gap-4" :class="columns === 2 && 'lg:grid-cols-2'">
      <slot />
    </div>
  </section>
</template>
