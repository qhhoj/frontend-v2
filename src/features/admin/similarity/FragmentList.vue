<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { SimilarityFragment } from '@/api/types/similarity';

defineProps<{ fragments: SimilarityFragment[]; activeIndex: number | null }>();
const emit = defineEmits<{ select: [index: number] }>();

const { t } = useI18n();
/** The lines of one fragment on the left side, inclusive. */
const linesOf = (fragment: SimilarityFragment) => fragment.leftEnd - fragment.leftStart + 1;
const itemText = (fragment: SimilarityFragment, index: number) =>
  t('admin.similarity.pair.fragments.item', {
    index: index + 1,
    leftStart: fragment.leftStart,
    leftEnd: fragment.leftEnd,
    rightStart: fragment.rightStart,
    rightEnd: fragment.rightEnd,
    lines: linesOf(fragment),
  });
</script>

<template>
  <section class="flex flex-col gap-2">
    <h2 class="font-display text-base font-bold">
      {{ $t('admin.similarity.pair.fragments.heading') }}
    </h2>
    <p class="text-sm text-muted">{{ $t('admin.similarity.pair.fragments.scrolls') }}</p>
    <ol class="flex flex-col gap-2">
      <li v-for="(fragment, index) in fragments" :key="index">
        <button
          type="button"
          class="min-h-11 w-full rounded-row border border-line px-3 py-2 text-left font-mono text-sm hover:bg-surface-hover"
          :aria-pressed="activeIndex === index"
          @click="emit('select', index)"
        >
          {{ itemText(fragment, index) }}
        </button>
      </li>
    </ol>
  </section>
</template>
