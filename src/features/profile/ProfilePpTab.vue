<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { SubmissionResult } from '@/api/types/submissions';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import VerdictLabel from '@/components/VerdictLabel.vue';
import { usePpQuery } from '@/features/users/users.queries';
import { INTL_LOCALES, formatDate, formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { VERDICT_TONES, verdictOf } from '@/lib/verdicts';
import type { Verdict } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import ProfileTabSkeleton from './ProfileTabSkeleton.vue';

/** The PP table, one page of `/users/:username/pp-breakdown`; the phone width keeps rank, problem and counted PP. */
const PP_PAGE_SIZE = 10;
const HIDDEN_ON_PHONE = 'hidden md:table-cell';
const HEADER = 'px-3 py-3.5 font-medium first:pl-6 last:pr-6';
const HEADER_LEFT = `${HEADER} text-left`;
const HEADER_RIGHT = `${HEADER} text-right`;
const CELL = 'px-3 py-[11px] first:pl-6 last:pr-6';
const route = useRoute();
const locale = useLocaleStore();
const username = computed(() => String(route.params.username));
const page = computed(() => pageFromQuery(route.query.page));
const { data, error, isPending, refetch } = usePpQuery(username, page);
const entries = computed(() => data.value?.items ?? []);
const ranks = computed(() => ({
  first: entries.value[0]?.rank ?? 0,
  last: entries.value.at(-1)?.rank ?? 0,
}));

/** Weights and counted points always show one decimal, so `100` reads `100,0`. */
const oneDecimal = (value: number) =>
  new Intl.NumberFormat(INTL_LOCALES[locale.locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
const isResult = (value: string | null): value is SubmissionResult =>
  value !== null && value in VERDICT_TONES;
/** The verdict of the submission a PP row counts (a judged row without a known result reads as done). */
const verdictFor = (result: string | null): Verdict =>
  verdictOf({ status: 'D', result: isResult(result) ? result : null });
</script>

<template>
  <div class="flex flex-col gap-4">
    <StatePanel
      v-if="error && !isPending"
      kind="error"
      :title="$t('profileTabs.ppErrorTitle')"
      :body="$t('profileTabs.ppErrorBody')"
    >
      <button
        type="button"
        class="min-h-11 rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
        @click="refetch()"
      >
        {{ $t('common.retry') }}
      </button>
    </StatePanel>
    <QueryState v-else :loading="isPending" :error="null">
      <template #skeleton><ProfileTabSkeleton :rows="PP_PAGE_SIZE" kind="table" /></template>
      <GlassCard v-if="!entries.length" as="div">
        <EmptyState>{{ $t('profileTabs.noPp') }}</EmptyState>
      </GlassCard>
      <template v-else>
        <GlassCard as="div" class="overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-[15px]">
              <thead>
                <tr class="text-[13px] text-muted">
                  <th scope="col" :class="HEADER_LEFT">{{ $t('profileTabs.columns.rank') }}</th>
                  <th scope="col" :class="HEADER_LEFT">{{ $t('profileTabs.columns.problem') }}</th>
                  <th scope="col" :class="[HEADER_RIGHT, HIDDEN_ON_PHONE]">
                    {{ $t('profileTabs.columns.weight') }}
                  </th>
                  <th scope="col" :class="[HEADER_RIGHT, HIDDEN_ON_PHONE]">
                    {{ $t('profileTabs.columns.points') }}
                  </th>
                  <th scope="col" :class="HEADER_RIGHT">
                    {{ $t('profileTabs.columns.scaled') }}
                  </th>
                  <th scope="col" :class="[HEADER_LEFT, HIDDEN_ON_PHONE]">
                    {{ $t('profileTabs.columns.submission') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in entries" :key="entry.rank" class="border-t border-line">
                  <td :class="[CELL, 'font-mono']">{{ entry.rank }}</td>
                  <td :class="CELL">
                    <RouterLink
                      :to="{ name: 'problem', params: { code: entry.problem.code } }"
                      class="font-semibold text-accent-text hover:underline"
                    >
                      {{ entry.problem.name }}
                    </RouterLink>
                    <div class="font-mono text-xs text-muted">{{ entry.problem.code }}</div>
                  </td>
                  <td :class="[CELL, HIDDEN_ON_PHONE, 'text-right font-mono']">
                    {{ oneDecimal(entry.weight) }}%
                  </td>
                  <td :class="[CELL, HIDDEN_ON_PHONE, 'text-right font-mono']">
                    {{ formatNumber(entry.points, locale.locale) }}
                  </td>
                  <td :class="[CELL, 'text-right font-mono font-semibold']">
                    {{ oneDecimal(entry.scaledPoints) }}
                  </td>
                  <td :class="[CELL, HIDDEN_ON_PHONE]">
                    <RouterLink
                      :to="{ name: 'submission', params: { id: entry.submission.id } }"
                      class="flex flex-col items-start gap-1 hover:underline"
                    >
                      <VerdictLabel :verdict="verdictFor(entry.submission.result)" />
                      <span class="font-mono text-xs">
                        {{ entry.submission.casePoints }}/{{ entry.submission.caseTotal }}
                      </span>
                      <span class="text-xs text-muted">
                        {{ entry.submission.language }} ·
                        {{ formatDate(entry.submission.date, locale.locale) }}
                      </span>
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </GlassCard>
        <p class="text-center text-sm text-muted">
          {{ $t('profileTabs.ppFooter', { first: ranks.first, last: ranks.last }) }}
        </p>
      </template>
      <NumberedPager v-if="data" :meta="data.meta" :label="$t('profileTabs.ppPager')" />
    </QueryState>
  </div>
</template>
