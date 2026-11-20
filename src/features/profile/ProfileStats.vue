<script setup lang="ts">
import { computed } from 'vue';
import type { UserPage } from '@/api/types/users';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { medalClass } from '@/lib/medal';
import { useLocaleStore } from '@/stores/locale.store';

interface StatRow {
  label: string;
  value: string;
  /** What the number means, shown on hover or focus of the row. */
  hint?: string;
  /** Gold, silver or bronze for a rank 1 to 3. */
  tone?: string;
}

/** The profile's numbers as one row under the header: each label over its value, 3 by 2 on a phone. A value wraps rather than being cut. */
const props = defineProps<{ user: UserPage }>();
const locale = useLocaleStore();

const count = (value: number, fractionDigits = 0) =>
  formatNumber(value, locale.locale, fractionDigits);
/** A banned account is out of the ranking, whatever rank the API still carries. */
const isBanned = computed(() => props.user.displayRank === 'banned');
const medalOf = (rank: number | null) => (rank === null || isBanned.value ? '' : medalClass(rank));
const rankOf = (rank: number | null) => (rank === null || isBanned.value ? '—' : `#${count(rank)}`);

const rows = computed<StatRow[]>(() => [
  {
    label: translate('profile.ppRank'),
    value: rankOf(props.user.rank),
    hint: translate('profile.ppRankHint'),
    tone: medalOf(props.user.rank),
  },
  {
    label: translate('profile.ratingRank'),
    value: rankOf(props.user.ratingRank),
    hint: translate('profile.ratingRankHint'),
    tone: medalOf(props.user.ratingRank),
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
  <dl
    data-testid="profile-stats"
    class="m-0 grid grid-cols-3 gap-x-4 gap-y-3 border-y border-line py-3 md:grid-cols-6"
  >
    <div v-for="row in rows" :key="row.label" :title="row.hint" class="min-w-0">
      <dt class="text-caption text-muted">{{ row.label }}</dt>
      <dd class="m-0 font-mono text-sm font-semibold tabular-nums break-words">
        <span v-if="row.tone" :class="row.tone">{{ row.value }}</span>
        <template v-else>{{ row.value }}</template>
      </dd>
    </div>
  </dl>
</template>
