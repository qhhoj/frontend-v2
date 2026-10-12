<script setup lang="ts">
import RankColumnHeader from '@/components/RankColumnHeader.vue';
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
import { formatDate, formatFixed, formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { VERDICT_TONES, verdictOf } from '@/lib/verdicts';
import type { Verdict } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import {
  BODY_CELL_CLASSES,
  HEADER_CELL_CLASSES,
} from '@/features/submissions/submission-table-cells';
import ProfileTabSkeleton from './ProfileTabSkeleton.vue';

/** The PP table, one page of `/users/:username/pp-breakdown`; the phone width keeps rank, problem and counted PP. */
const PP_PAGE_SIZE = 10;
const HIDDEN_ON_PHONE = 'hidden md:table-cell';
const HEADER_LEFT = `${HEADER_CELL_CLASSES} text-left`;
const HEADER_RIGHT = `${HEADER_CELL_CLASSES} text-right`;
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

/** Weights and counted PP always show one decimal (`100,0`); points show at most one. */
const isResult = (value: string | null): value is SubmissionResult =>
  value !== null && Object.hasOwn(VERDICT_TONES, value);
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
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="text-meta text-muted">
                  <th scope="col" :class="HEADER_RIGHT">
                    <RankColumnHeader :label="$t('profileTabs.columns.rank')" />
                  </th>
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
                  <td :class="[BODY_CELL_CLASSES, 'font-mono tabular-nums text-right']">
                    {{ entry.rank }}
                  </td>
                  <td :class="BODY_CELL_CLASSES">
                    <RouterLink
                      :to="{ name: 'problem', params: { code: entry.problem.code } }"
                      class="font-semibold text-accent-text hover:underline"
                    >
                      {{ entry.problem.name }}
                    </RouterLink>
                    <div class="font-mono text-xs text-muted">{{ entry.problem.code }}</div>
                  </td>
                  <td
                    :class="[
                      BODY_CELL_CLASSES,
                      HIDDEN_ON_PHONE,
                      'text-right font-mono tabular-nums',
                    ]"
                  >
                    {{ formatFixed(entry.weight, locale.locale, 1) }}%
                  </td>
                  <td
                    :class="[
                      BODY_CELL_CLASSES,
                      HIDDEN_ON_PHONE,
                      'text-right font-mono tabular-nums',
                    ]"
                  >
                    {{ formatNumber(entry.points, locale.locale, 1) }}
                  </td>
                  <td
                    :class="[BODY_CELL_CLASSES, 'text-right font-mono font-semibold tabular-nums']"
                  >
                    {{ formatFixed(entry.scaledPoints, locale.locale, 1) }}
                  </td>
                  <td :class="[BODY_CELL_CLASSES, HIDDEN_ON_PHONE]">
                    <RouterLink
                      :to="{ name: 'submission', params: { id: entry.submission.id } }"
                      class="flex flex-col items-start gap-0.5 hover:underline"
                    >
                      <span class="flex items-center gap-2">
                        <VerdictLabel :verdict="verdictFor(entry.submission.result)" short />
                        <span class="font-mono text-meta tabular-nums">
                          {{ entry.submission.casePoints }}/{{ entry.submission.caseTotal }}
                        </span>
                      </span>
                      <span class="text-xs whitespace-nowrap text-muted">
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
