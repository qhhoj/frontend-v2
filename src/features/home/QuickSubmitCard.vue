<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query';
import { ArrowDown } from 'lucide-vue-next';
import Select from 'primevue/select';
import { computed, ref, watch } from 'vue';
import { ApiError } from '@/api/client';
import { submit } from '@/api/submissions.api';
import { useSubmissionStatus } from '@/api/use-submission-status';
import GlassCard from '@/components/GlassCard.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import { useProfileQuery } from '@/features/account/profile.queries';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { verdictOf } from '@/lib/verdicts';

const { data: meta } = useProblemMetaQuery();
const { data: profile } = useProfileQuery();
const code = ref('');
const source = ref('');
const languageId = ref<string | null>(null);
const submissionId = ref<string | null>(null);
const live = useSubmissionStatus(submissionId);

const languages = computed(() =>
  (meta.value?.languages ?? []).filter((language) => !language.fileOnly),
);
const languageName = computed(
  () => languages.value.find((language) => language.id === languageId.value)?.name ?? '',
);
/** The account's default language once known, else the first one. */
watch(
  [() => profile.value?.languageId, languages],
  ([preferred]) => {
    if (!languageId.value)
      languageId.value =
        languages.value.find((language) => language.id === preferred)?.id ??
        languages.value[0]?.id ??
        null;
  },
  { immediate: true },
);

const submission = useMutation({
  mutationFn: () =>
    submit(code.value.trim(), { language: languageId.value!, source: source.value }),
  onSuccess: ({ id }) => (submissionId.value = id),
});
const errorText = computed(() => {
  const error = submission.error.value;
  if (!error) return null;
  if (error instanceof ApiError && error.code === 'not_found')
    return translate('home.problemNotFound', { code: code.value.trim() });
  return translate(errorMessageKey(error));
});
const finalVerdict = computed(() =>
  live.done && live.status ? verdictOf({ status: live.status, result: live.result }) : null,
);
const progressText = computed(() => {
  if (submission.isPending.value) return translate('home.submitting');
  if (!live.status || live.done) return '';
  return live.status === 'G' && live.currentTestcase
    ? translate('home.judging', { test: live.currentTestcase })
    : translate(`verdicts.${live.status}`);
});
</script>

<template>
  <GlassCard data-testid="quick-submit" class="flex flex-col gap-1 rounded-panel p-2">
    <div class="flex items-center justify-between px-3.5 py-3">
      <h2 class="font-display text-lg font-semibold">{{ $t('home.quickSubmit') }}</h2>
      <span class="text-[13px] text-muted">{{ languageName }}</span>
    </div>
    <form class="flex flex-col gap-1" @submit.prevent="submission.mutate()">
      <div class="rounded-tile bg-surface-strong p-4">
        <label for="quick-submit-code" class="text-[13px] text-muted">{{
          $t('home.problemCode')
        }}</label>
        <div class="mt-1.5 flex items-center justify-between gap-3">
          <input
            id="quick-submit-code"
            v-model="code"
            required
            autocomplete="off"
            spellcheck="false"
            class="min-h-11 w-full min-w-0 bg-transparent font-display text-[22px] font-semibold text-content"
          />
          <Select
            v-model="languageId"
            :options="languages"
            option-label="name"
            option-value="id"
            :aria-label="$t('home.language')"
            class="shrink-0"
          />
        </div>
      </div>
      <div class="relative z-10 -my-3.5 flex justify-center" aria-hidden="true">
        <span
          class="flex size-9 items-center justify-center rounded-cell border-4 border-ground bg-surface-solid text-muted"
        >
          <ArrowDown class="size-4" />
        </span>
      </div>
      <div class="rounded-tile bg-surface-strong p-4">
        <label for="quick-submit-source" class="text-[13px] text-muted">{{
          $t('home.source')
        }}</label>
        <textarea
          id="quick-submit-source"
          v-model="source"
          required
          rows="4"
          spellcheck="false"
          class="mt-1.5 block w-full resize-y bg-transparent font-mono text-[13px] leading-relaxed text-content"
        />
      </div>
      <button
        type="submit"
        :disabled="submission.isPending.value || !languageId"
        class="bg-gradient-accent mt-1 h-14 rounded-tile text-[17px] font-bold text-on-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ $t(submission.isPending.value ? 'home.submitting' : 'home.submit') }}
      </button>
    </form>
    <p role="status" aria-live="polite" class="flex min-h-11 items-center gap-2 px-3 text-sm">
      <template v-if="finalVerdict">
        <VerdictBadge :verdict="finalVerdict" size="sm" />
        <span>{{ $t(finalVerdict.labelKey) }}</span>
      </template>
      <template v-else>{{ progressText }}</template>
    </p>
    <p v-if="live.stale" class="px-3 text-sm text-muted">{{ $t('home.staleReload') }}</p>
    <p v-if="errorText" role="alert" class="px-3 pb-2 text-sm text-negative">{{ errorText }}</p>
  </GlassCard>
</template>
