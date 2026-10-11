<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { LeaderboardSort } from '@/api/types/users';
import { useRankQuery } from '@/features/users/users.queries';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { rankLocation, rowAnchor } from './leaderboard-columns';
import { revealRow } from './reveal-row';

/** The signed-in viewer's rank on this sort as one inline "· Your rank: 123" that scrolls to their row. Nothing while loading, when the account is not on the board, or when the request fails. */
const props = defineProps<{ sort: LeaderboardSort }>();
const session = useSessionStore();
const router = useRouter();
const locale = useLocaleStore();
const username = computed(() => session.user?.username ?? '');
const { data: rank } = useRankQuery(username, () => props.sort);

/** Going to the URL the board is already on is no navigation, so the row is revealed here. */
const findMe = async () => {
  const failure = await router.push(rankLocation(props.sort, rank.value!.page, username.value));
  if (failure) revealRow(rowAnchor(username.value));
};
</script>

<template>
  <span v-if="rank" data-testid="my-rank">
    ·
    <button
      type="button"
      class="font-semibold text-accent-text hover:underline"
      :aria-label="$t('leaderboard.findMe')"
      @click="findMe"
    >
      {{ $t('leaderboard.myRank') }}: #{{ formatNumber(rank.rank, locale.locale) }}
    </button>
  </span>
</template>
