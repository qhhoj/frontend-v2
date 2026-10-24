<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed, nextTick, ref, useId } from 'vue';
import { useRouter } from 'vue-router';
import { diffRoute, parseSubmissionRef } from './diff-picks';

/**
 * "So sánh với bài khác…" at the foot of the source card: a disclosure button that opens and closes the input.
 * The other submission goes left, this one stays right.
 */
const props = defineProps<{ currentId: string }>();
const router = useRouter();
const isOpen = ref(false);
const text = ref('');
const errorKey = ref<string | null>(null);
const inputId = useId();
const errorId = computed(() => `${inputId}-error`);
const input = ref<HTMLInputElement | null>(null);
const formId = `${inputId}-form`;

async function toggle() {
  isOpen.value = !isOpen.value;
  if (!isOpen.value) return;
  await nextTick();
  input.value?.focus();
}

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
  <div class="border-t border-line px-4 py-3 sm:px-6">
    <button
      type="button"
      data-testid="compare-open"
      class="min-h-11 text-sm font-semibold text-accent underline-offset-4 hover:underline"
      :aria-expanded="isOpen"
      :aria-controls="formId"
      @click="toggle"
    >
      {{ $t('sourceDiff.compare.open') }}
    </button>
    <form
      v-show="isOpen"
      :id="formId"
      data-testid="compare-form"
      class="flex flex-col gap-1.5 pb-1"
      novalidate
      @submit.prevent="submit"
    >
      <label :for="inputId" class="text-sm font-semibold">{{
        $t('sourceDiff.compare.label')
      }}</label>
      <div class="flex flex-wrap gap-2">
        <input
          :id="inputId"
          ref="input"
          v-model="text"
          type="text"
          autocomplete="off"
          spellcheck="false"
          :aria-invalid="errorKey ? 'true' : undefined"
          :aria-describedby="errorKey ? errorId : undefined"
          class="min-h-11 min-w-0 flex-1 rounded-cell border border-line-control bg-surface-solid px-3 font-mono text-base"
        />
        <AppButton type="submit">
          {{ $t('sourceDiff.compare.submit') }}
        </AppButton>
      </div>
      <p v-if="errorKey" :id="errorId" role="alert" class="text-meta text-negative">
        {{ $t(errorKey) }}
      </p>
      <p v-else class="text-meta text-muted">{{ $t('sourceDiff.compare.hint') }}</p>
    </form>
  </div>
</template>
