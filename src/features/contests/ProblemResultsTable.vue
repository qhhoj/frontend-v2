<script setup lang="ts">
import type { ContestProblemStats } from '@/api/types/contests';
import { formatNumber } from '@/lib/format';
import { VERDICT_TONE_CLASSES } from '@/lib/verdicts';
import type { VerdictTone } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { RESULT_ORDER, RESULT_TONES, formatPercent, resultSegments } from './stats-summary';
import type { ResultCode } from './stats-summary';

defineProps<{ problems: ContestProblemStats[] }>();
/** Solid verdict fills for the stacked bar (no text sits on them); the chips keep the tinted tone classes. */
const SEGMENT_FILLS: Record<VerdictTone, string> = {
  ac: 'bg-verdict-ac',
  wa: 'bg-verdict-wa',
  tle: 'bg-verdict-tle',
  rte: 'bg-verdict-rte',
  ce: 'bg-verdict-ce',
  pending: 'bg-verdict-pending',
};
const locale = useLocaleStore();
const count = (value: number) => formatNumber(value, locale.locale);
/** A result nobody got stays muted, so only the results that happened draw the eye. */
const chipClasses = (code: ResultCode, value: number) =>
  value > 0 ? VERDICT_TONE_CLASSES[RESULT_TONES[code]] : 'text-muted';
</script>

<template>
  <section class="flex flex-col gap-2">
    <h2 class="font-display text-xl font-bold">{{ $t('contests.stats.problemTitle') }}</h2>
    <div
      tabindex="0"
      role="region"
      :aria-label="$t('contests.stats.region')"
      class="glass overflow-x-auto rounded-card focus-visible:-outline-offset-2"
    >
      <table data-testid="problem-results" class="w-full min-w-[720px] border-collapse">
        <thead>
          <tr class="text-left text-[13px] text-muted">
            <th scope="col" class="px-4 py-3 font-medium">
              {{ $t('contests.stats.columns.label') }}
            </th>
            <th scope="col" class="px-4 py-3 font-medium">
              {{ $t('contests.stats.columns.name') }}
            </th>
            <th scope="col" class="px-4 py-3 font-medium">
              {{ $t('contests.stats.columns.results') }}
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium">
              {{ $t('contests.stats.columns.total') }}
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium">
              {{ $t('contests.stats.columns.acRate') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="problem in problems" :key="problem.problemId" class="border-t border-line">
            <th scope="row" class="px-4 py-3 text-left font-display text-lg font-bold">
              {{ problem.label }}
            </th>
            <td class="px-4 py-3">
              <div class="font-medium">{{ problem.name }}</div>
              <div class="font-mono text-xs text-muted">{{ problem.code }}</div>
            </td>
            <td class="px-4 py-3">
              <div
                aria-hidden="true"
                class="flex h-3 gap-px overflow-hidden rounded-pill bg-surface-hover"
              >
                <span
                  v-for="segment in resultSegments(problem.results, problem.total)"
                  :key="segment.code"
                  :class="SEGMENT_FILLS[RESULT_TONES[segment.code]]"
                  :style="{ width: `${segment.share * 100}%` }"
                />
              </div>
              <ul class="mt-2 flex flex-wrap gap-1.5">
                <li
                  v-for="code in RESULT_ORDER"
                  :key="code"
                  :class="[
                    'rounded-pill px-2 py-0.5 font-mono text-xs',
                    chipClasses(code, problem.results[code]),
                  ]"
                >
                  {{ code }} {{ count(problem.results[code]) }}
                </li>
              </ul>
            </td>
            <td class="px-4 py-3 text-right font-mono">{{ count(problem.total) }}</td>
            <td class="px-4 py-3 text-right font-mono font-semibold">
              {{ formatPercent(problem.acRate, locale.locale) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="px-1 text-xs text-muted">{{ $t('contests.stats.errNote') }}</p>
  </section>
</template>
