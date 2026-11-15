<script setup lang="ts">
import { reactive } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import VerdictRing from '@/features/submissions/VerdictRing.vue';
import { OPEN_BUTTON_ID } from './submit-open';
import type { useSubmitForm } from './use-submit-form';

/**
 * The problem header's way into submitting: the one primary "Nộp bài" button, and after a submit a small line with the last
 * result beside it (a link to that submission). While the pane is open the pane shows both, so the line goes with the button;
 * on a phone the sheet's bar carries the result (`showResult` false).
 */
const props = defineProps<{
  form: ReturnType<typeof useSubmitForm>;
  open: boolean;
  showResult: boolean;
}>();
defineEmits<{ open: [] }>();
const result = reactive(props.form.result);
</script>

<template>
  <div class="flex min-w-0 items-center gap-3">
    <template v-if="showResult && !open && (form.lastSubmissionId.value || form.submitting.value)">
      <VerdictRing
        size="sm"
        :progress="result.progress"
        :verdict="result.verdict"
        :share="result.partialShare"
        :is-empty="form.submitting.value || result.isEmpty"
      />
      <RouterLink
        v-if="form.lastSubmissionId.value && !form.submitting.value"
        :to="`/submissions/${form.lastSubmissionId.value}`"
        data-testid="header-result"
        class="min-w-0 truncate font-mono text-sm text-secondary tabular-nums hover:text-content"
        >{{ result.text }}</RouterLink
      >
      <span v-else class="font-mono text-sm text-secondary">{{ $t('submit.submitting') }}</span>
    </template>
    <AppButton
      v-if="!open"
      :id="OPEN_BUTTON_ID"
      tone="primary"
      data-testid="submit-open"
      :aria-expanded="false"
      class="shrink-0"
      @click="$emit('open')"
      >{{ $t('submit.title') }}</AppButton
    >
  </div>
</template>
