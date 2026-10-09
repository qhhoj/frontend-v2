<script setup lang="ts">
import { computed } from 'vue';
import InlineBit from '@/components/InlineBit.vue';
import { translate } from '@/i18n';
import { DIFF_INLINE_BITS } from './diff-bits';
import { diffRoute, MAX_DIFF_PICKS } from './diff-picks';
import { submissionShortId } from './submission-short-id';

/** Shown once a row is picked (board M6C): what is picked, "Bỏ chọn", and the compare link once two are picked. */
const props = defineProps<{ picked: readonly string[] }>();
defineEmits<{ clear: [] }>();
const pair = computed(() => {
  const [left, right] = props.picked;
  return left !== undefined && right !== undefined ? { left, right } : null;
});
const summary = computed(() =>
  pair.value
    ? translate('sourceDiff.select.picked', {
        first: submissionShortId(pair.value.left),
        second: submissionShortId(pair.value.right),
      })
    : translate('sourceDiff.select.pickedOne'),
);
const BUTTON = 'inline-flex min-h-11 items-center rounded-pill px-4 text-sm font-semibold';
</script>

<template>
  <div
    data-testid="diff-selection"
    class="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-tile border border-line-accent bg-surface-solid px-4 py-2"
  >
    <InlineBit v-if="picked.length === MAX_DIFF_PICKS" :kind="DIFF_INLINE_BITS.pickedTwo" />
    <p aria-live="polite" class="min-w-0 flex-1 text-sm font-semibold">{{ summary }}</p>
    <button
      type="button"
      data-testid="diff-clear"
      :class="`${BUTTON} border border-line hover:bg-surface-hover`"
      @click="$emit('clear')"
    >
      {{ $t('sourceDiff.select.clear') }}
    </button>
    <RouterLink
      v-if="pair"
      data-testid="diff-compare"
      :to="diffRoute(pair)"
      :class="`${BUTTON} bg-gradient-accent text-on-accent`"
      >{{ $t('sourceDiff.select.compare') }}</RouterLink
    >
    <button
      v-else
      type="button"
      aria-disabled="true"
      :class="`${BUTTON} cursor-not-allowed border border-line text-muted`"
    >
      {{ $t('sourceDiff.select.needTwo') }}
    </button>
  </div>
</template>
