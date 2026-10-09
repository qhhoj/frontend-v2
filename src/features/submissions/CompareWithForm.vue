<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { useRouter } from 'vue-router';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import { DIFF_INLINE_BITS } from './diff-bits';
import { diffRoute, parseSubmissionRef } from './diff-picks';

/** "So sánh với bài khác" (board M6C): the other submission goes left, this one stays right. */
const props = defineProps<{ currentId: string }>();
const router = useRouter();
const text = ref('');
const errorKey = ref<string | null>(null);
const inputId = useId();
const errorId = computed(() => `${inputId}-error`);

function submit() {
  const other = parseSubmissionRef(text.value);
  if (other === null) errorKey.value = 'sourceDiff.compare.invalid';
  else if (other === props.currentId) errorKey.value = 'sourceDiff.compare.same';
  else {
    errorKey.value = null;
    void router.push(diffRoute({ left: other, right: props.currentId }));
  }
}
</script>

<template>
  <GlassCard as="div" class="rounded-panel p-6 sm:p-8">
    <form
      data-testid="compare-form"
      class="flex flex-col gap-3"
      novalidate
      @submit.prevent="submit"
    >
      <h2 class="flex items-center gap-3 font-display text-lg font-semibold">
        <InlineBit :kind="DIFF_INLINE_BITS.compareForm" />{{ $t('sourceDiff.compare.title') }}
      </h2>
      <label :for="inputId" class="text-sm font-semibold">{{
        $t('sourceDiff.compare.label')
      }}</label>
      <div class="flex flex-wrap gap-2">
        <input
          :id="inputId"
          v-model="text"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :aria-invalid="errorKey ? 'true' : undefined"
          :aria-describedby="errorKey ? errorId : undefined"
          class="min-h-11 min-w-0 flex-1 rounded-row border border-line-strong bg-surface-solid px-3 font-mono text-content"
        />
        <button
          type="submit"
          class="inline-flex min-h-11 items-center rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
        >
          {{ $t('sourceDiff.compare.submit') }}
        </button>
      </div>
      <p v-if="errorKey" :id="errorId" role="alert" class="text-sm text-negative">
        {{ $t(errorKey) }}
      </p>
      <p class="text-sm text-muted">{{ $t('sourceDiff.compare.hint') }}</p>
    </form>
  </GlassCard>
</template>
