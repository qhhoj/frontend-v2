<script setup lang="ts">
import { TrendingDown, TrendingUp } from 'lucide-vue-next';
import { computed, useId } from 'vue';
import BitLoop from '@/components/BitLoop.vue';
import BitMascot from '@/components/BitMascot.vue';
import Card from '@/components/ui/Card.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useRatingHistoryQuery, useUserPageQuery } from '@/features/users/users.queries';
import { formatNumber, greetingKey } from '@/lib/format';
import { ratingTier } from '@/lib/rating-tiers';
import { sparklineAreaPath, sparklinePath } from '@/lib/sparkline';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useLocaleStore } from '@/stores/locale.store';

const props = defineProps<{ username: string }>();
const { data: user, isPending, error, refetch } = useUserPageQuery(() => props.username);
const {
  data: history,
  error: historyError,
  refetch: refetchHistory,
} = useRatingHistoryQuery(() => props.username);
const locale = useLocaleStore();
const gradientId = useId();

const ratings = computed(() =>
  (history.value ?? [])
    .filter((entry) => entry.rating !== null)
    .sort((left, right) => Date.parse(left.endTime) - Date.parse(right.endTime))
    .map((entry) => entry.rating!),
);
const delta = computed(() =>
  ratings.value.length >= 2 ? ratings.value.at(-1)! - ratings.value.at(-2)! : null,
);
const tier = computed(() => ratingTier(user.value?.rating ?? null));
const greeting = greetingKey(new Date().getHours());
/** Q-03 B: an unrated student leads with the problems solved, a number that can grow every day; the rating once there is one. */
const isRated = computed(() => tier.value !== null);
/** The chart's box: a fixed 48 px band, at most 240 px wide, on the right of the card. */
const CHART = { width: 240, height: 48 } as const;
/** Two points make a bare diagonal that reads as a glitch, so the chart waits for a third. */
const MIN_CHART_POINTS = 3;
const showsChart = computed(() => isRated.value && ratings.value.length >= MIN_CHART_POINTS);
const line = computed(() => sparklinePath(ratings.value, CHART.width, CHART.height));
const area = computed(() => sparklineAreaPath(ratings.value, CHART.width, CHART.height));
const headline = computed(() =>
  isRated.value
    ? String(user.value!.rating)
    : formatNumber(user.value!.problemCount, locale.locale),
);
const tiles = computed(() =>
  user.value
    ? [
        ...(isRated.value
          ? [
              {
                labelKey: 'home.solved',
                value: formatNumber(user.value.problemCount, locale.locale),
              },
            ]
          : []),
        {
          labelKey: 'home.points',
          value: formatNumber(user.value.performancePoints, locale.locale, 1),
        },
        { labelKey: 'home.rank', value: `#${user.value.rank}` },
      ]
    : [],
);
</script>

<template>
  <Card data-testid="rating-hero" class="p-6 sm:p-8">
    <QueryState
      :loading="isPending"
      :error="error || historyError"
      @retry="
        () => {
          refetch();
          refetchHistory();
        }
      "
    >
      <template #skeleton>
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p data-skeleton-region="greeting" class="text-muted">
              <SkeletonBlock text class="w-40" />
            </p>
            <div data-skeleton-region="rating" class="mt-2 flex flex-wrap items-end gap-4">
              <SkeletonBlock class="h-15 w-44" />
              <!-- The rank-up Bit's box (32 px, `--bit-px:2px`), so a rise does not move the row when it arrives. -->
              <SkeletonBlock data-skeleton-region="rank-up" round class="mb-3 size-8 shrink-0" />
            </div>
            <p data-skeleton-region="tier" class="text-muted">
              <SkeletonBlock text class="w-32" />
            </p>
          </div>
          <!-- The hero Bit's box (16 pixels of 5 px, 7 px from sm up), so the card keeps its height. -->
          <SkeletonBlock data-skeleton-region="bit" class="size-20 shrink-0 sm:size-28" />
        </div>
        <div data-skeleton-region="chart" class="mt-4 flex h-12 justify-end">
          <SkeletonBlock class="h-full w-full max-w-60" />
        </div>
        <div class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-3">
          <div
            v-for="tile in 3"
            :key="tile"
            data-skeleton-region="tile"
            class="min-w-0 rounded-row bg-surface-strong p-4"
          >
            <p class="text-meta"><SkeletonBlock text class="w-14" /></p>
            <p class="font-mono text-stat"><SkeletonBlock text class="w-20" /></p>
          </div>
        </div>
      </template>
      <template v-if="user">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-muted">{{ $t(greeting, { username }) }}</p>
            <div data-testid="rating-row" class="mt-2 flex flex-wrap items-end gap-4">
              <span
                data-testid="hero-figure"
                class="font-mono text-score leading-none font-semibold tracking-tight tabular-nums"
                >{{ headline }}</span
              >
              <!-- The delta pill and the rank-up Bit wrap as one group, so the Bit always sits beside its delta. -->
              <span
                v-if="isRated && delta !== null"
                class="mb-3 flex flex-nowrap items-center gap-2"
              >
                <span
                  class="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-mono text-sm font-semibold"
                  :class="
                    delta >= 0
                      ? 'bg-verdict-ac-bg text-verdict-ac'
                      : 'bg-verdict-wa-bg text-verdict-wa'
                  "
                >
                  <component
                    :is="delta >= 0 ? TrendingUp : TrendingDown"
                    class="size-4"
                    aria-hidden="true"
                  />
                  {{ $t('home.ratingDelta', { delta: delta >= 0 ? `+${delta}` : `${delta}` }) }}
                </span>
                <BitLoop
                  v-if="delta > 0"
                  data-testid="rank-up-bit"
                  kind="rankUp"
                  class="[--bit-px:2px]"
                />
              </span>
            </div>
            <p data-testid="hero-caption" class="text-muted">
              {{
                isRated
                  ? $t('home.ratingTier', { tier: $t(`tiers.${tier}`) })
                  : $t('home.solvedUnrated')
              }}
            </p>
          </div>
          <BitMascot
            data-testid="home-bit"
            :look="PLACEMENT_LOOKS.hero"
            blinks
            class="[--bit-px:5px] sm:[--bit-px:7px]"
          />
        </div>
        <div v-if="showsChart" class="mt-4 flex justify-end">
          <svg
            data-testid="rating-chart"
            :viewBox="`0 0 ${CHART.width} ${CHART.height}`"
            preserveAspectRatio="none"
            class="h-12 w-full max-w-60"
            role="img"
            :aria-label="
              $t(
                'home.ratingChart',
                { count: ratings.length, first: ratings[0], last: ratings.at(-1) },
                ratings.length,
              )
            "
          >
            <defs>
              <linearGradient :id="`${gradientId}-line`" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" style="stop-color: var(--qh-chart-line-start)" />
                <stop offset="1" style="stop-color: var(--qh-accent)" />
              </linearGradient>
              <linearGradient :id="`${gradientId}-area`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style="stop-color: var(--qh-accent); stop-opacity: 0.22" />
                <stop offset="1" style="stop-color: var(--qh-accent); stop-opacity: 0" />
              </linearGradient>
            </defs>
            <path data-testid="rating-chart-area" :d="area" :fill="`url(#${gradientId}-area)`" />
            <line
              data-testid="rating-chart-baseline"
              x1="0"
              :x2="CHART.width"
              :y1="CHART.height - 0.5"
              :y2="CHART.height - 0.5"
              style="stroke: var(--qh-line-strong)"
              vector-effect="non-scaling-stroke"
            />
            <path
              :d="line"
              fill="none"
              :stroke="`url(#${gradientId}-line)`"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>
        </div>
        <dl class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-3">
          <div
            v-for="tile in tiles"
            :key="tile.labelKey"
            class="min-w-0 rounded-row bg-surface-strong p-4"
          >
            <dt class="text-meta text-muted">{{ $t(tile.labelKey) }}</dt>
            <dd class="m-0 font-mono text-stat font-semibold tabular-nums">{{ tile.value }}</dd>
          </div>
        </dl>
      </template>
    </QueryState>
  </Card>
</template>
