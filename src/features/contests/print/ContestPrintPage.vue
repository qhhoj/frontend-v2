<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { useIsFetching } from '@tanstack/vue-query';
import { ArrowLeft, Check, Printer } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import { formatDate } from '@/lib/format-date';
import { usePageTitle } from '@/router/page-title';
import { useLocaleStore } from '@/stores/locale.store';
import ContestNotFound from '../ContestNotFound.vue';
import { useContestQuery } from '../contests.queries';
import ContestPrintProblem from './ContestPrintProblem.vue';
import { usePrintPageRules } from './print-page-css';
import './contest-print.css';

/** `/contests/:key/all`: every statement of the contest on one page, for printing or saving as PDF. Shown only where the problems tab shows its table. */
const route = useRoute();
const { t } = useI18n();
const locale = useLocaleStore();
const key = computed(() => String(route.params.key));
const { data: contest, isPending, error, refetch } = useContestQuery(key);
usePageTitle(() =>
  contest.value ? `${t('contests.print.headerRight')} · ${contest.value.name}` : null,
);
const isMissing = computed(() => error.value instanceof ApiError && error.value.status === 404);

const showSamples = ref(true);
const showLimits = ref(true);
const onePerPage = ref(true);
const loadingStatements = useIsFetching({ queryKey: ['problems', 'detail'] });

const problems = computed(() => contest.value?.problems ?? null);
usePrintPageRules(() =>
  contest.value
    ? {
        title: contest.value.name,
        subtitle: t('contests.print.headerRight'),
        address: `${window.location.host}/contests/${key.value}/all`,
        pageWord: t('contests.print.pageNumber'),
      }
    : null,
);
const whenText = computed(() =>
  contest.value
    ? `${formatDate(contest.value.startTime, 'datetime', locale.locale)} – ${formatDate(contest.value.endTime, 'datetime', locale.locale)}`
    : '',
);
const printSheet = () => window.print();
const CHIP =
  'inline-flex min-h-11 items-center gap-1.5 rounded-pill border px-3.5 text-sm font-medium aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-accent-soft-text border-line-strong text-muted hover:bg-surface-hover';
</script>

<template>
  <div class="page-column print:block">
    <ContestNotFound v-if="isMissing" />
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template v-if="contest">
        <StatePanel
          v-if="!problems"
          kind="forbidden"
          is-page-heading
          :title="$t('contests.print.hiddenTitle')"
          :body="
            $t(
              `contests.problems.${contest.phase === 'ended' ? 'hidden' : contest.phase === 'running' ? 'afterJoin' : 'afterStart'}`,
            )
          "
        >
          <AppButton :to="{ name: 'contest', params: { key } }">{{
            $t('contests.print.back')
          }}</AppButton>
        </StatePanel>
        <template v-else>
          <div
            :aria-label="$t('contests.print.toolbar')"
            class="glass sticky top-[calc(var(--contest-bar-height,0px)+0.5rem)] z-10 flex flex-wrap items-center gap-3 rounded-row px-3.5 py-2.5 print:hidden"
          >
            <AppButton :to="{ name: 'contest', params: { key } }">
              <template #icon><ArrowLeft class="size-4" aria-hidden="true" /></template>
              {{ $t('contests.print.back') }}
            </AppButton>
            <div class="flex flex-1 flex-wrap gap-2">
              <button
                type="button"
                :class="CHIP"
                :aria-pressed="showSamples"
                @click="showSamples = !showSamples"
              >
                <Check v-if="showSamples" class="size-3.5" aria-hidden="true" />{{
                  $t('contests.print.samples')
                }}
              </button>
              <button
                type="button"
                :class="CHIP"
                :aria-pressed="showLimits"
                @click="showLimits = !showLimits"
              >
                <Check v-if="showLimits" class="size-3.5" aria-hidden="true" />{{
                  $t('contests.print.limits')
                }}
              </button>
              <button
                type="button"
                :class="[CHIP, 'hidden md:inline-flex']"
                :aria-pressed="onePerPage"
                @click="onePerPage = !onePerPage"
              >
                <Check v-if="onePerPage" class="size-3.5" aria-hidden="true" />{{
                  $t('contests.print.onePerPage')
                }}
              </button>
            </div>
            <AppButton tone="primary" :disabled="loadingStatements > 0" @click="printSheet">
              <template #icon><Printer class="size-4" aria-hidden="true" /></template>
              <span class="hidden sm:inline">{{ $t('contests.print.print') }}</span>
              <span class="sm:hidden">{{ $t('contests.print.printShort') }}</span>
            </AppButton>
          </div>
          <article
            class="print-doc mx-auto w-full max-w-[900px] rounded-card border border-line bg-surface p-5 md:px-14 md:py-9"
            :class="{ 'hide-samples': !showSamples, 'one-per-page': onePerPage }"
            data-testid="print-doc"
          >
            <header class="mb-2 border-b-2 border-line-strong pb-4 text-center">
              <p class="text-xs tracking-widest text-muted uppercase">
                {{ $t('contests.print.kicker', { count: problems.length }, problems.length) }}
              </p>
              <h1 class="mt-1 page-title">
                {{ contest.name }}
              </h1>
              <p class="mt-1 text-meta text-muted">{{ whenText }}</p>
            </header>
            <template v-for="(problem, index) in problems" :key="problem.problemId">
              <p v-if="onePerPage && index > 0" aria-hidden="true" class="break-hint">
                {{ $t('contests.print.pageBreak') }}
              </p>
              <ContestPrintProblem
                :problem="problem"
                :points-precision="contest.pointsPrecision"
                :show-limits="showLimits"
              />
            </template>
          </article>
        </template>
      </template>
    </QueryState>
  </div>
</template>
