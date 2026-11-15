<script setup lang="ts">
import { computed } from 'vue';
import type { UserPage } from '@/api/types/users';
import Card from '@/components/ui/Card.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

interface StatRow {
  label: string;
  value: string;
  /** What the number means, shown on hover or focus of the row. */
  hint?: string;
}

/** The profile's numbers as a compact list (label muted on the left, value on the right) instead of tinted tiles; a value wraps rather than being cut. */
const props = defineProps<{ user: UserPage }>();
const locale = useLocaleStore();

const count = (value: number, fractionDigits = 0) =>
  formatNumber(value, locale.locale, fractionDigits);
/** A banned account is out of the ranking, whatever rank the API still carries. */
const isBanned = computed(() => props.user.displayRank === 'banned');
const rankOf = (rank: number | null) => (rank === null || isBanned.value ? '—' : `#${count(rank)}`);

const rows = computed<StatRow[]>(() => [
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
  { label: translate('profile.solved'), value: count(props.user.problemCount) },
  {
    label: translate('profile.contribution'),
    value: count(props.user.contributionPoints),
    hint: translate('profile.contributionHint'),
  },
]);
</script>

<template>
  <Card data-testid="profile-stats" :title="$t('profile.stats')" padding="md">
    <dl class="m-0 flex flex-col divide-y divide-line">
      <div
        v-for="row in rows"
        :key="row.label"
        :title="row.hint"
        class="flex min-h-8 items-baseline justify-between gap-3 py-1.5 text-meta"
      >
        <dt class="text-muted">{{ row.label }}</dt>
        <dd class="m-0 min-w-0 text-right font-mono font-semibold tabular-nums break-words">
          {{ row.value }}
        </dd>
      </div>
    </dl>
  </Card>
</template>
