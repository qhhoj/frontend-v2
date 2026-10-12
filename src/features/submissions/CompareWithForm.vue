<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed, ref, useId } from 'vue';
import { useRouter } from 'vue-router';
import Card from '@/components/ui/Card.vue';
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
  <Card as="div" class="rounded-panel p-6 sm:p-8">
    <form
      data-testid="compare-form"
      class="flex flex-col gap-3"
      novalidate
      @submit.prevent="submit"
    >
      <h2 class="flex items-center gap-3 font-display text-base font-bold">
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
        <AppButton tone="primary" type="submit">
          {{ $t('sourceDiff.compare.submit') }}
        </AppButton>
      </div>
      <p v-if="errorKey" :id="errorId" role="alert" class="text-sm text-negative">
        {{ $t(errorKey) }}
      </p>
      <p class="text-sm text-muted">{{ $t('sourceDiff.compare.hint') }}</p>
    </form>
  </Card>
</template>
