<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next';
import type { ContestDetail, ContestPhase, ContestProblem } from '@/api/types/contests';
import GlassCard from '@/components/GlassCard.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

const props = defineProps<{ contest: ContestDetail }>();
const locale = useLocaleStore();
const pointsOf = (problem: ContestProblem) =>
  formatNumber(problem.points, locale.locale, props.contest.pointsPrecision);
const problemLink = (problem: ContestProblem) => ({
  name: 'problem',
  params: { code: problem.code },
});
/** Why the statements are not listed yet, per phase. */
const HIDDEN_KEYS: Record<ContestPhase, string> = {
  upcoming: 'contests.problems.afterStart',
  running: 'contests.problems.afterJoin',
  ended: 'contests.problems.hidden',
};
</script>

<template>
  <GlassCard data-testid="contest-problems" class="overflow-hidden">
    <p v-if="!contest.problems" class="px-5 py-8 text-center text-muted">
      {{ $t(HIDDEN_KEYS[contest.phase]) }}
    </p>
    <template v-else>
      <table class="hidden w-full border-collapse md:table">
        <caption class="sr-only">
          {{
            $t('contests.problems.caption')
          }}
        </caption>
        <thead>
          <tr class="text-left text-[12px] tracking-wider text-muted uppercase">
            <th scope="col" class="px-5 py-3 font-semibold">
              {{ $t('contests.problems.columns.label') }}
            </th>
            <th scope="col" class="px-3 py-3 font-semibold">
              {{ $t('contests.problems.columns.name') }}
            </th>
            <th scope="col" class="px-3 py-3 text-right font-semibold">
              {{ $t('contests.problems.columns.points') }}
            </th>
            <th scope="col" class="px-5 py-3">
              <span class="sr-only">{{ $t('contests.problems.columns.open') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="problem in contest.problems"
            :key="problem.problemId"
            class="border-t border-line"
          >
            <th scope="row" class="px-5 py-3 text-left font-display text-xl font-bold">
              {{ problem.label }}
            </th>
            <td class="px-3 py-3">
              <RouterLink :to="problemLink(problem)" class="font-semibold hover:text-accent-text">{{
                problem.name
              }}</RouterLink>
              <span class="block font-mono text-[12.5px] text-muted">
                {{ problem.code
                }}<template v-if="problem.maxSubmissions">
                  ·
                  {{
                    $t(
                      'contests.problems.cap',
                      { count: problem.maxSubmissions },
                      problem.maxSubmissions,
                    )
                  }}</template
                >
              </span>
            </td>
            <td class="px-3 py-3 text-right font-mono tabular-nums">{{ pointsOf(problem) }}</td>
            <td class="px-5 py-3 text-right">
              <RouterLink
                :to="problemLink(problem)"
                class="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover"
              >
                {{ $t('contests.problems.open')
                }}<span class="sr-only"> {{ problem.label }}. {{ problem.name }}</span
                ><ExternalLink class="size-4" aria-hidden="true" />
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
      <ul class="m-0 list-none p-0 md:hidden">
        <li
          v-for="problem in contest.problems"
          :key="problem.problemId"
          class="flex min-h-16 items-center gap-3 border-t border-line px-3.5 py-3 first:border-t-0"
        >
          <span class="w-7 font-display text-[22px] font-bold" aria-hidden="true">
            {{ problem.label }}
          </span>
          <div class="min-w-0 flex-1">
            <RouterLink :to="problemLink(problem)" class="block truncate font-semibold"
              ><span class="sr-only">{{ problem.label }}. </span>{{ problem.name }}</RouterLink
            >
            <p class="text-[12px] text-muted">
              {{ problem.code }} ·
              {{ $t('contests.problems.pointsShort', { points: pointsOf(problem) }) }}
            </p>
          </div>
        </li>
      </ul>
    </template>
  </GlassCard>
</template>
