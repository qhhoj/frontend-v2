<script setup lang="ts">
import { computed } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import PageSection from '@/components/ui/PageSection.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { useHomeQuery } from '@/features/community/community.queries';
import { formatPoints } from '@/lib/format';
import { titleParts } from '@/lib/title-parts';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * "Bài tập mới" (the visitor's home): the newest public problems, one row each, a link as a whole, drawn like a row of
 * the problem list: the name (the series it shares dimmed, its own part strong), the code, the points. A phone shows
 * the name's own part over the code. A long name cuts the series first and its own part last. The rows come from `GET /home`, which the visitor's header already asks, so they
 * add no request. With no row (or a failed request) the section is not drawn.
 */
const ROWS = 5;
const PROBLEMS = { name: 'problems' };
const locale = useLocaleStore();
const { data: home, isPending } = useHomeQuery();
const problems = computed(() =>
  (home.value?.newProblems ?? []).slice(0, ROWS).map((problem) => ({
    ...problem,
    ...titleParts(problem.name),
    title: problem.name,
    pointsText: formatPoints(problem.points, locale.locale),
  })),
);
const ROW = 'flex min-h-(--qh-row) items-center gap-3 px-2 touch:min-h-13';
</script>

<template>
  <PageSection
    v-if="isPending || problems.length"
    data-testid="new-problems"
    :title="$t('home.newProblems')"
    :see-all="{ to: PROBLEMS, label: $t('home.continue.all') }"
  >
    <ul v-if="isPending" aria-hidden="true" class="flex flex-col divide-y divide-line">
      <li v-for="row in ROWS" :key="row" :class="ROW">
        <span class="min-w-0 flex-1"><SkeletonBlock text class="w-1/2" /></span>
        <SkeletonBlock text class="w-12" />
      </li>
    </ul>
    <ul v-else class="flex flex-col divide-y divide-line">
      <li
        v-for="problem in problems"
        :key="problem.code"
        data-testid="new-problem"
        class="box-link"
        :class="ROW"
      >
        <span class="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <StretchedLink
            :to="{ name: 'problem', params: { code: problem.code } }"
            :title="problem.title"
            class="flex min-w-0 items-baseline text-content"
            ><span
              v-if="problem.series"
              class="min-w-0 shrink-100 truncate text-muted max-sm:hidden"
              >{{ problem.series }}</span
            ><span
              v-if="problem.series"
              aria-hidden="true"
              class="shrink-0 px-1 text-muted max-sm:hidden"
              >-</span
            ><span class="max-w-full shrink-0 truncate font-semibold">{{
              problem.name
            }}</span></StretchedLink
          >
          <span class="shrink-0 truncate font-mono text-small text-muted">{{ problem.code }}</span>
        </span>
        <span class="shrink-0 font-mono text-small text-muted tabular-nums">
          <span class="sr-only">{{ $t('problems.columns.points') }}</span>
          {{ problem.pointsText }}
        </span>
      </li>
    </ul>
  </PageSection>
</template>
