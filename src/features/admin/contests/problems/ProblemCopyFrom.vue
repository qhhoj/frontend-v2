<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchEditableContest } from '@/api/contest-editing.api';
import { failureTextOf, isNotFound } from '../../ui/admin-errors';
import { INPUT, buttonClass } from '../../ui/controls';
import { toProblemRows } from './contest-problems';
import type { ProblemRow } from './contest-problems';

/** Copies another contest's problems, with their points and settings, after the listed ones (saved with the list). */
const props = defineProps<{
  currentKey: string;
  copy: (rows: ProblemRow[]) => { added: number; skipped: number };
}>();
const { t } = useI18n();
const key = ref('');
const isLoading = ref(false);
const message = ref('');
const isError = ref(false);

function report(text: string, failed: boolean) {
  message.value = text;
  isError.value = failed;
}

async function submit() {
  const source = key.value.trim();
  if (!source || isLoading.value) return;
  if (source === props.currentKey) return report(t('admin.contests.problems.copySelf'), true);
  isLoading.value = true;
  try {
    const contest = await fetchEditableContest(source);
    const result = props.copy(toProblemRows(contest));
    report(t('admin.contests.problems.copied', { ...result, key: source }), false);
    key.value = '';
  } catch (error) {
    const text = isNotFound(error)
      ? t('admin.contests.problems.copyNotFound', { key: source })
      : failureTextOf(error);
    report(text, true);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <form class="flex flex-col gap-2" @submit.prevent="submit">
    <label for="contest-copy-problems" class="text-sm font-semibold">
      {{ $t('admin.contests.problems.copyLabel') }}
    </label>
    <div class="flex flex-wrap gap-2">
      <input
        id="contest-copy-problems"
        v-model="key"
        :class="INPUT"
        class="min-w-0 flex-1"
        :placeholder="$t('admin.contests.problems.copyPlaceholder')"
        autocomplete="off"
        spellcheck="false"
      />
      <button type="submit" :class="buttonClass('secondary')" :disabled="isLoading">
        {{ $t('admin.contests.problems.copy') }}
      </button>
    </div>
    <p
      v-if="message"
      role="status"
      class="text-sm"
      :class="isError ? 'text-negative' : 'text-muted'"
    >
      {{ message }}
    </p>
  </form>
</template>
