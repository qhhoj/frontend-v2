<script setup lang="ts">
import { TrendingDown, TrendingUp } from 'lucide-vue-next';
import { computed, useId } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useRatingHistoryQuery, useUserPageQuery } from '@/features/users/users.queries';
import { formatNumber, greetingKey } from '@/lib/format';
import { ratingTier } from '@/lib/rating-tiers';
import { sparklinePath } from '@/lib/sparkline';
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
const path = computed(() => sparklinePath(ratings.value, 640, 110));
const tiles = computed(() =>
  user.value
    ? [
        { labelKey: 'home.solved', value: formatNumber(user.value.problemCount, locale.locale) },
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
  <GlassCard data-testid="rating-hero" class="p-6 sm:p-8">
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
        <p data-skeleton-region="greeting" class="text-muted">
          <SkeletonBlock text class="w-40" />
        </p>
        <div data-skeleton-region="rating" class="mt-2 flex flex-wrap items-end gap-4">
          <SkeletonBlock class="h-15 w-44" />
        </div>
        <p data-skeleton-region="tier" class="text-muted"><SkeletonBlock text class="w-32" /></p>
        <div data-skeleton-region="chart" class="h-[110px]">
          <SkeletonBlock class="h-full w-full" />
        </div>
        <div class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-3">
          <div
            v-for="tile in 3"
            :key="tile"
            data-skeleton-region="tile"
            class="min-w-0 rounded-tile bg-surface-strong p-4"
          >
            <p class="text-[13px]"><SkeletonBlock text class="w-14" /></p>
            <p class="font-mono text-[26px]"><SkeletonBlock text class="w-20" /></p>
          </div>
        </div>
      </template>
      <template v-if="user">
        <p class="text-muted">{{ $t(greeting, { username }) }}</p>
        <div class="mt-2 flex flex-wrap items-end gap-4">
          <span class="font-mono text-6xl font-semibold tracking-tight tabular-nums">{{
            user.rating ?? '—'
          }}</span>
          <span
            v-if="delta !== null"
            class="mb-3 inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-mono text-sm font-semibold"
            :class="
              delta >= 0 ? 'bg-verdict-ac-bg text-verdict-ac' : 'bg-verdict-wa-bg text-verdict-wa'
            "
          >
            <component
              :is="delta >= 0 ? TrendingUp : TrendingDown"
              class="size-4"
              aria-hidden="true"
            />
            {{ $t('home.ratingDelta', { delta: delta >= 0 ? `+${delta}` : `${delta}` }) }}
          </span>
        </div>
        <p class="text-muted">
          {{ $t('home.ratingTier', { tier: $t(tier ? `tiers.${tier}` : 'tiers.unrated') }) }}
        </p>
        <svg
          v-if="ratings.length >= 2"
          viewBox="0 0 640 110"
          width="100%"
          height="110"
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
            <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" style="stop-color: var(--qh-chart-line-start)" />
              <stop offset="1" style="stop-color: var(--qh-accent)" />
            </linearGradient>
          </defs>
          <path
            :d="path"
            fill="none"
            :stroke="`url(#${gradientId})`"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <dl class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-3">
          <div
            v-for="tile in tiles"
            :key="tile.labelKey"
            class="min-w-0 rounded-tile bg-surface-strong p-4"
          >
            <dt class="text-[13px] text-muted">{{ $t(tile.labelKey) }}</dt>
            <dd class="m-0 font-mono text-[26px] font-semibold tabular-nums">{{ tile.value }}</dd>
          </div>
        </dl>
      </template>
    </QueryState>
  </GlassCard>
</template>
