<script setup lang="ts">
import { computed } from 'vue';
import InlineBit from '@/components/InlineBit.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { translate } from '@/i18n';
import { DIFF_INLINE_BITS } from './diff-bits';
import { diffRoute, MAX_DIFF_PICKS } from './diff-picks';
import { submissionShortId } from './submission-short-id';

/** Shown once a row is picked: what is picked, "Bỏ chọn", and the compare link once two are picked. */
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
</script>

<template>
  <div
    data-testid="diff-selection"
    class="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-row border border-line-accent bg-surface-solid px-4 py-2"
  >
    <InlineBit v-if="picked.length === MAX_DIFF_PICKS" :kind="DIFF_INLINE_BITS.pickedTwo" />
    <p aria-live="polite" class="min-w-0 flex-1 text-sm font-semibold">{{ summary }}</p>
    <AppButton data-testid="diff-clear" @click="$emit('clear')">
      {{ $t('common.clearSelection') }}
    </AppButton>
    <AppButton v-if="pair" data-testid="diff-compare" tone="primary" :to="diffRoute(pair)">
      {{ $t('sourceDiff.select.compare') }}
    </AppButton>
    <AppButton v-else disabled>{{ $t('sourceDiff.select.needTwo') }}</AppButton>
  </div>
</template>
