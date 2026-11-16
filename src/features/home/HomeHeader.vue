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
import { ratingTextClass } from '@/lib/tier-classes';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * The signed-in page header: the greeting is the H1 and the viewer's numbers are the one meta line under it (the rating in
 * its tier colour with the change of the last contest, then rank and solved). An unrated student sees "Chưa có rating" in its place. The numbers
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
/** Rank and solved count: the page's own numbers after the rating. */
const facts = computed(() => {
  if (!user.value) return [];
  return [
    { label: translate('home.rank'), value: `#${user.value.rank}` },
    {
      label: translate('home.solved'),
      value: formatNumber(user.value.problemCount, locale.locale),
    },
  ];
});
</script>

<template>
  <PageHeader :title="$t(greeting, { username })" :facts="facts" data-testid="home-header">
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
      <template v-else-if="user">
        <span class="flex items-baseline gap-1">
          <template v-if="isRated"
            >{{ $t('home.rating') }}
            <span
              data-testid="home-rating"
              class="font-mono font-semibold"
              :class="ratingTextClass(user.rating)"
              >{{ user.rating }}</span
            >
            <span>({{ $t(`tiers.${tier}`) }})</span></template
          ><template v-else>{{ $t('home.unrated') }}</template>
        </span>
      </template>
      <Chip
        v-if="!isPending && isRated && delta !== null"
        :tone="delta >= 0 ? 'success' : 'danger'"
        :icon="delta >= 0 ? TrendingUp : TrendingDown"
        class="font-mono font-semibold"
      >
        {{ $t('home.ratingDelta', { delta: delta >= 0 ? `+${delta}` : `${delta}` }) }}
      </Chip>
      <span v-if="user" aria-hidden="true" class="max-md:hidden">·</span>
    </template>
  </PageHeader>
</template>
