<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query';
import { ArrowDown } from 'lucide-vue-next';
import Select from 'primevue/select';
import { computed, ref } from 'vue';
import { ApiError } from '@/api/client';
import { submit } from '@/api/submissions.api';
import { useSubmissionStatus } from '@/api/use-submission-status';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import { useProfileQuery } from '@/features/account/profile.queries';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { MAX_SOURCE_LENGTH, codePointCount } from '@/lib/source';
import { verdictOf } from '@/lib/verdicts';

/** Rows of the source textarea; the skeleton draws as many lines. */
const SOURCE_ROWS = 4;

const {
  data: meta,
  isPending: metaPending,
  error: metaError,
  refetch: refetchMeta,
} = useProblemMetaQuery();
const { data: profile } = useProfileQuery();
const code = ref('');
const source = ref('');
const pickedLanguageId = ref<string | null>(null);
const submissionId = ref<string | null>(null);
const live = useSubmissionStatus(submissionId);

const languages = computed(() =>
  (meta.value?.languages ?? []).filter((language) => !language.fileOnly),
);
const languageName = computed(
  () => languages.value.find((language) => language.id === languageId.value)?.name ?? '',
);
/** The viewer's pick, else the account's default language (whenever the profile loads), else the first one. */
const languageId = computed({
  get: () =>
    pickedLanguageId.value ??
    languages.value.find((language) => language.id === profile.value?.languageId)?.id ??
    languages.value[0]?.id ??
    null,
  set: (id) => (pickedLanguageId.value = id),
});

const submission = useMutation({
  mutationFn: () =>
    submit(code.value.trim(), { language: languageId.value!, source: source.value }),
  /** A failed resubmit must not show the previous submission's status. */
  onMutate: () => (submissionId.value = null),
  onSuccess: ({ id }) => (submissionId.value = id),
});
const sourceTooLong = computed(() => codePointCount(source.value) > MAX_SOURCE_LENGTH);
/** `aria-disabled` instead of `disabled` keeps keyboard focus on the button while it works. */
const canSubmit = computed(
  () => !submission.isPending.value && !sourceTooLong.value && Boolean(languageId.value),
);
const send = () => canSubmit.value && submission.mutate();
const errorText = computed(() => {
  if (sourceTooLong.value) return translate('home.sourceTooLong', { max: MAX_SOURCE_LENGTH });
  const error = submission.error.value;
  if (!error) return null;
  if (error instanceof ApiError && error.code === 'not_found')
    return translate('home.problemNotFound', { code: code.value.trim() });
  if (error instanceof ApiError && error.code === 'validation_failed') {
    if (error.fields.language)
      return translate('home.languageNotAllowed', { code: code.value.trim() });
    if (error.fields.source) return translate('home.sourceTooLong', { max: MAX_SOURCE_LENGTH });
  }
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
    <QueryState :loading="metaPending" :error="metaError" @retry="refetchMeta()">
      <template #skeleton>
        <div class="flex flex-col gap-1">
          <div data-skeleton-region="code" class="rounded-tile bg-surface-strong p-4">
            <div>
              <span class="text-[13px]"><SkeletonBlock text class="w-24" /></span>
            </div>
            <div class="mt-1.5 flex items-center justify-between gap-3">
              <SkeletonBlock class="h-11 w-40" />
              <SkeletonBlock class="h-11 w-32 shrink-0" />
            </div>
          </div>
          <div class="-my-3.5 h-9" />
          <div data-skeleton-region="source" class="rounded-tile bg-surface-strong p-4">
            <div>
              <span class="text-[13px]"><SkeletonBlock text class="w-16" /></span>
            </div>
            <div class="mt-1.5 font-mono text-[13px] leading-relaxed">
              <div v-for="line in SOURCE_ROWS" :key="line">
                <SkeletonBlock text class="w-full" />
              </div>
            </div>
          </div>
          <SkeletonBlock data-skeleton-region="submit" class="mt-1 h-14 w-full" />
        </div>
        <div data-skeleton-region="status" class="min-h-11" />
      </template>
      <form class="flex flex-col gap-1" @submit.prevent="send">
        <div class="rounded-tile bg-surface-strong p-4">
          <label for="quick-submit-code" class="text-[13px] text-muted">{{
            $t('home.problemCode')
          }}</label>
          <div class="mt-1.5 flex items-center justify-between gap-3">
            <input
              id="quick-submit-code"
              v-model="code"
              required
              placeholder="aplusb"
              autocomplete="off"
              spellcheck="false"
              class="min-h-11 w-full min-w-0 bg-transparent font-display text-[22px] font-semibold text-content placeholder:text-muted"
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
            :rows="SOURCE_ROWS"
            spellcheck="false"
            class="mt-1.5 block w-full resize-y bg-transparent font-mono text-[13px] leading-relaxed text-content"
          />
        </div>
        <button
          type="submit"
          :aria-disabled="!canSubmit"
          class="bg-gradient-accent mt-1 h-14 rounded-tile text-[17px] font-bold text-on-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
        >
          {{ $t(submission.isPending.value ? 'home.submitting' : 'home.submit') }}
        </button>
      </form>
      <div
        role="status"
        aria-live="polite"
        class="flex min-h-11 flex-col justify-center px-3 text-sm"
      >
        <span v-if="finalVerdict" class="flex items-center gap-2">
          <VerdictBadge :verdict="finalVerdict" size="sm" aria-hidden="true" />
          {{ $t(finalVerdict.labelKey) }}
        </span>
        <span v-else>{{ progressText }}</span>
        <span v-if="live.stale" class="text-muted">{{ $t('home.staleReload') }}</span>
      </div>
      <p v-if="errorText" role="alert" class="px-3 pb-2 text-sm text-negative">{{ errorText }}</p>
    </QueryState>
  </GlassCard>
</template>
