<script setup lang="ts">
import { TrendingDown, TrendingUp } from 'lucide-vue-next';
import { computed } from 'vue';
import BitMascot from '@/components/BitMascot.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Chip from '@/components/ui/Chip.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import { useRatingHistoryQuery, useUserPageQuery } from '@/features/users/users.queries';
import { translate } from '@/i18n';
import { formatNumber, greetingKey } from '@/lib/format';
import { ratingTier } from '@/lib/rating-tiers';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * The signed-in page header: the greeting is the H1 and the viewer's numbers are the one meta line under it (rating and
 * tier, solved, points, rank). An unrated student has no rating, so the line starts with the solved count. The numbers
 * never block the page: while they load the line is a skeleton, and when the request fails it is left out.
 */
const props = defineProps<{ username: string }>();
const { data: user, isPending } = useUserPageQuery(() => props.username);
const { data: history } = useRatingHistoryQuery(() => props.username);
const locale = useLocaleStore();
const greeting = greetingKey(new Date().getHours());
const tier = computed(() => ratingTier(user.value?.rating ?? null));
const isRated = computed(() => tier.value !== null);
/** The change of the last rated contest, when there are two ratings to compare. */
const delta = computed(() => {
  const ratings = (history.value ?? [])
    .filter((entry) => entry.rating !== null)
    .sort((left, right) => Date.parse(left.endTime) - Date.parse(right.endTime))
    .map((entry) => entry.rating!);
  return ratings.length >= 2 ? ratings.at(-1)! - ratings.at(-2)! : null;
});
const meta = computed(() => {
  if (!user.value) return [];
  const labelled = (key: string, value: string) => `${translate(key)} ${value}`;
  return [
    isRated.value
      ? `${user.value.rating} · ${translate(`tiers.${tier.value}`)}`
      : translate('home.unrated'),
    labelled('home.solved', formatNumber(user.value.problemCount, locale.locale)),
    labelled('home.points', formatNumber(user.value.performancePoints, locale.locale, 1)),
    labelled('home.rank', `#${user.value.rank}`),
  ];
});
</script>

<template>
  <PageHeader :title="$t(greeting, { username })" :meta="meta" data-testid="home-header">
    <template #start>
      <BitMascot
        data-testid="home-bit"
        :look="PLACEMENT_LOOKS.hero"
        blinks
        class="[--bit-px:3px]"
      />
    </template>
    <template #meta>
      <SkeletonBlock v-if="isPending" text data-skeleton-region="numbers" class="w-64 max-w-full" />
      <Chip
        v-else-if="isRated && delta !== null"
        :tone="delta >= 0 ? 'success' : 'danger'"
        :icon="delta >= 0 ? TrendingUp : TrendingDown"
        class="font-mono font-semibold"
      >
        {{ $t('home.ratingDelta', { delta: delta >= 0 ? `+${delta}` : `${delta}` }) }}
      </Chip>
    </template>
  </PageHeader>
</template>
