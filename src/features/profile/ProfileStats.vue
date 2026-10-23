<script setup lang="ts">
import { computed } from 'vue';
import type { UserPage } from '@/api/types/users';
import Card from '@/components/ui/Card.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

interface StatTile {
  key: string;
  label: string;
  value: string;
  hint?: string;
  /** Hidden below `md`: the phone shows the first four tiles only. */
  phoneHidden?: boolean;
}

const props = defineProps<{ user: UserPage }>();
const locale = useLocaleStore();

const count = (value: number, fractionDigits = 0) =>
  formatNumber(value, locale.locale, fractionDigits);
/** A banned account is out of the ranking, whatever rank the API still carries. */
const isBanned = computed(() => props.user.displayRank === 'banned');
const rankOf = (rank: number | null) => (rank === null || isBanned.value ? '—' : `#${count(rank)}`);

const tiles = computed<StatTile[]>(() => [
  {
    key: 'ppRank',
    label: translate('profile.ppRank'),
    value: rankOf(props.user.rank),
    hint: translate('profile.ppRankHint'),
  },
  {
    key: 'ratingRank',
    label: translate('profile.ratingRank'),
    value: rankOf(props.user.ratingRank),
    hint: translate('profile.ratingRankHint'),
  },
  { key: 'pp', label: translate('profile.pp'), value: count(props.user.performancePoints, 1) },
  { key: 'points', label: translate('profile.points'), value: count(props.user.points) },
  {
    key: 'solved',
    label: translate('profile.solved'),
    value: count(props.user.problemCount),
    phoneHidden: true,
  },
  {
    key: 'contribution',
    label: translate('profile.contribution'),
    value: count(props.user.contributionPoints),
    hint: translate('profile.contributionHint'),
    phoneHidden: true,
  },
]);
</script>

<template>
  <Card data-testid="profile-stats" class="p-5">
    <h2 class="font-display text-base font-bold">{{ $t('profile.stats') }}</h2>
    <dl class="mt-3 grid grid-cols-2 gap-3">
      <div
        v-for="tile in tiles"
        :key="tile.key"
        class="rounded-row border border-line p-3"
        :class="tile.phoneHidden && 'max-md:hidden'"
      >
        <dt class="text-sm text-muted">{{ tile.label }}</dt>
        <dd class="font-display text-display leading-8 font-semibold">{{ tile.value }}</dd>
        <dd v-if="tile.hint" class="text-xs text-muted">{{ tile.hint }}</dd>
      </div>
    </dl>
  </Card>
</template>
