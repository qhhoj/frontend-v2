<script setup lang="ts">
import { computed } from 'vue';
import type { UserPage } from '@/api/types/users';
import Card from '@/components/ui/Card.vue';
import StatGrid from '@/components/ui/StatGrid.vue';
import type { StatItem } from '@/components/ui/StatGrid.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';

interface StatTile extends StatItem {
  /** Hidden below `md`: the phone shows the first four tiles only. */
  phoneHidden?: boolean;
}

const props = defineProps<{ user: UserPage }>();
const locale = useLocaleStore();
const isPhone = useMediaQuery(PHONE_QUERY);

const count = (value: number, fractionDigits = 0) =>
  formatNumber(value, locale.locale, fractionDigits);
/** A banned account is out of the ranking, whatever rank the API still carries. */
const isBanned = computed(() => props.user.displayRank === 'banned');
const rankOf = (rank: number | null) => (rank === null || isBanned.value ? '—' : `#${count(rank)}`);

const tiles = computed<StatTile[]>(() => [
  {
    label: translate('profile.ppRank'),
    value: rankOf(props.user.rank),
    hint: translate('profile.ppRankHint'),
  },
  {
    label: translate('profile.ratingRank'),
    value: rankOf(props.user.ratingRank),
    hint: translate('profile.ratingRankHint'),
  },
  { label: translate('profile.pp'), value: count(props.user.performancePoints, 1) },
  { label: translate('profile.points'), value: count(props.user.points) },
  {
    label: translate('profile.solved'),
    value: count(props.user.problemCount),
    phoneHidden: true,
  },
  {
    label: translate('profile.contribution'),
    value: count(props.user.contributionPoints),
    hint: translate('profile.contributionHint'),
    phoneHidden: true,
  },
]);
const shown = computed(() => tiles.value.filter((tile) => !(isPhone.value && tile.phoneHidden)));
</script>

<template>
  <Card data-testid="profile-stats" :title="$t('profile.stats')" padding="md">
    <StatGrid :items="shown" :cols="2" mode="stat" />
  </Card>
</template>
