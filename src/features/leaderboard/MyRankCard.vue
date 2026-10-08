<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import type { BoardSort } from '@/api/types/users';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useRankQuery, useUserPageQuery } from '@/features/users/users.queries';
import { formatNumber } from '@/lib/format';
import { ratingTier } from '@/lib/rating-tiers';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { rankFieldOf, rankLocation, rowAnchor } from './leaderboard-columns';
import { revealRow } from './reveal-row';

const props = defineProps<{ sort: BoardSort }>();
const session = useSessionStore();
const router = useRouter();
const locale = useLocaleStore();
const username = computed(() => session.user?.username ?? '');
const {
  data: rank,
  error,
  isPending,
  refetch,
} = useRankQuery(username, () => rankFieldOf(props.sort));
const { data: viewer } = useUserPageQuery(username);
/** The API answers 404 for an account the board does not list (inactive or hidden). */
const isUnlisted = computed(() => error.value instanceof ApiError && error.value.status === 404);
const viewerRating = computed(() => viewer.value?.rating ?? null);
const tier = computed(() => ratingTier(viewerRating.value));

/** Going to the URL the board is already on is no navigation, so the row is revealed here. */
const findMe = async () => {
  const failure = await router.push(rankLocation(props.sort, rank.value!.page, username.value));
  if (failure) revealRow(rowAnchor(username.value));
};
</script>

<template>
  <GlassCard data-testid="my-rank" class="p-5">
    <h2 class="font-display text-lg font-semibold">{{ $t('leaderboard.myRank') }}</h2>
    <p class="text-sm text-muted">{{ $t(`leaderboard.by.${sort}`) }}</p>
    <p v-if="isUnlisted" class="mt-3 text-sm">{{ $t('leaderboard.notListed') }}</p>
    <QueryState
      v-else
      :loading="isPending"
      :error="error"
      :registers-wait="false"
      @retry="refetch()"
    >
      <template #skeleton><SkeletonBlock text class="mt-2 w-24 text-3xl" /></template>
      <template v-if="rank">
        <p class="mt-2 font-display text-3xl font-bold tabular-nums">
          {{ formatNumber(rank.rank, locale.locale) }}
        </p>
        <p class="text-sm text-muted">
          {{ $t('leaderboard.pageOf', { page: rank.page }) }}
          <template v-if="viewerRating !== null">
            · {{ viewerRating }} {{ tier ? $t(`tiers.${tier}`) : '' }}
          </template>
        </p>
        <button
          type="button"
          class="mt-3 min-h-11 w-full rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
          @click="findMe"
        >
          {{ $t('leaderboard.findMe') }}
        </button>
      </template>
    </QueryState>
  </GlassCard>
</template>
