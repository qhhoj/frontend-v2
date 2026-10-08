<script setup lang="ts">
import { Search, Snowflake } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CountdownTimer from '@/components/CountdownTimer.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';
import RankingPodium from './RankingPodium.vue';
import RankingTable from './RankingTable.vue';
import { useContestQuery, useRankingQuery } from './contests.queries';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const key = computed(() => String(route.params.key));
const withVirtual = computed(() => route.query.virtual === '1');
const {
  data: contest,
  isPending: contestPending,
  error: contestError,
  refetch: refetchContest,
} = useContestQuery(key);
const running = computed(() => contest.value?.phase === 'running');
const {
  data: ranking,
  isPending: rankingPending,
  error: rankingError,
  refetch: refetchRanking,
} = useRankingQuery(key, withVirtual, running);

const search = ref('');
const formatName = computed(() => contest.value?.formatName ?? '');
const rows = computed(() => {
  const needle = search.value.trim().toLocaleLowerCase();
  const all = ranking.value?.rows ?? [];
  return needle ? all.filter((row) => row.user.username.toLocaleLowerCase().includes(needle)) : all;
});
const podium = computed(() =>
  (ranking.value?.rows ?? [])
    .filter((row) => row.rank !== null && row.rank <= 3 && !row.isDisqualified)
    .slice(0, 3),
);
const summary = computed(() =>
  contest.value
    ? translate('ranking.summary', {
        format: translate(`formats.${contest.value.formatName}`),
        problems: ranking.value?.problems.length ?? contest.value.problems?.length ?? 0,
        participants: contest.value.userCount,
      })
    : '',
);
const setVirtual = (value: boolean) =>
  void router.replace({ query: { ...route.query, virtual: value ? '1' : undefined } });
const VIEW_MODES = [
  { virtual: false, labelKey: 'ranking.official' },
  { virtual: true, labelKey: 'ranking.withVirtual' },
] as const;
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-8">
    <QueryState :loading="contestPending" :error="contestError" @retry="refetchContest()">
      <template v-if="contest">
        <nav
          :aria-label="$t('ranking.contestNav')"
          class="glass flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-pill p-1"
        >
          <RouterLink
            :to="{ name: 'contest', params: { key } }"
            class="inline-flex min-h-11 items-center rounded-pill px-4 whitespace-nowrap text-muted hover:text-content"
          >
            {{ $t('ranking.navProblems') }}
          </RouterLink>
          <RouterLink
            :to="{ name: 'submissions', query: { contest: key } }"
            class="inline-flex min-h-11 items-center rounded-pill px-4 whitespace-nowrap text-muted hover:text-content"
          >
            {{ $t('ranking.navSubmissions') }}
          </RouterLink>
          <RouterLink
            :to="{ name: 'contest-ranking', params: { key } }"
            aria-current="page"
            class="inline-flex min-h-11 items-center rounded-pill bg-surface-hover px-4 font-semibold whitespace-nowrap"
          >
            {{ $t('ranking.navRanking') }}
          </RouterLink>
        </nav>
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-muted">{{ summary }}</p>
            <h1 class="mt-1 font-display text-4xl font-bold tracking-tight sm:text-[40px]">
              {{ contest.name }}
            </h1>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <p v-if="running" class="glass flex h-11 items-center gap-2.5 rounded-pill px-4.5">
              <span aria-hidden="true" class="size-2 rounded-full bg-accent shadow-glow" />
              <span class="sr-only">{{ $t('ranking.timeLeft') }}</span>
              <CountdownTimer
                :until="contest.endTime"
                class="font-semibold"
                @elapsed="refetchContest()"
              />
            </p>
            <div
              role="group"
              :aria-label="$t('ranking.viewMode')"
              class="glass flex rounded-pill p-1"
            >
              <button
                v-for="mode in VIEW_MODES"
                :key="mode.labelKey"
                type="button"
                :aria-pressed="withVirtual === mode.virtual"
                class="min-h-11 rounded-pill px-4 text-sm"
                :class="
                  withVirtual === mode.virtual
                    ? 'bg-gradient-accent font-bold text-on-accent'
                    : 'text-content hover:bg-surface-hover'
                "
                @click="setVirtual(mode.virtual)"
              >
                {{ $t(mode.labelKey) }}
              </button>
            </div>
            <label class="glass flex h-12 items-center gap-2 rounded-pill px-4 text-muted">
              <span class="sr-only">{{ $t('ranking.searchLabel') }}</span>
              <Search class="size-4 shrink-0" aria-hidden="true" />
              <input
                v-model="search"
                type="search"
                :placeholder="$t('ranking.searchLabel')"
                class="min-h-11 w-36 bg-transparent text-content"
              />
            </label>
          </div>
        </div>
        <p
          v-if="ranking?.frozen"
          role="status"
          class="glass flex items-center gap-3 rounded-tile px-5 py-3.5"
        >
          <span
            aria-hidden="true"
            class="flex size-8 shrink-0 items-center justify-center rounded-full bg-verdict-pending-bg text-verdict-pending"
          >
            <Snowflake class="size-4" />
          </span>
          <span
            ><strong class="text-content">{{ $t('ranking.frozenTitle') }}</strong> —
            {{ $t('ranking.frozenBody', { minutes: contest.frozenLastMinutes }) }}</span
          >
        </p>
      </template>
    </QueryState>
    <QueryState
      v-if="!contestError"
      :loading="rankingPending"
      :error="rankingError"
      @retry="refetchRanking()"
    >
      <p v-if="!ranking?.rows.length" class="glass rounded-card py-10 text-center text-muted">
        {{ $t('ranking.empty') }}
      </p>
      <template v-else-if="ranking">
        <RankingPodium v-if="podium.length" :rows="podium" :format-name="formatName" />
        <GlassCard as="div" class="overflow-hidden">
          <RankingTable
            :ranking="ranking"
            :rows="rows"
            :format-name="formatName"
            :viewer-id="session.user?.id ?? null"
          />
        </GlassCard>
      </template>
    </QueryState>
  </div>
</template>
