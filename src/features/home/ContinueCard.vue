<script setup lang="ts">
import { ArrowRight, Check, Minus, X } from 'lucide-vue-next';
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import EmptyState from '@/components/EmptyState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Card from '@/components/ui/Card.vue';
import Chip from '@/components/ui/Chip.vue';
import { CUE_TEXT } from '@/components/ui/cue-tones';
import PageSection from '@/components/ui/PageSection.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { formatRelative } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { continueTarget, firstFailure } from './continue-target';
import { useRecentSubmissionsQuery } from './home.queries';

/**
 * "Làm tiếp": the one problem to go back to, as one card that is a link as a whole. It shows the last submission ("Lần nộp cuối 2 ngày
 * trước · TLE ở test 7") and its score in the cue of how far it got (full green, partial amber, zero red). It reads the query that
 * "Bài nộp của bạn" reads, so it adds no request. With nothing to continue it is one line with a way to the problem list.
 */
const props = defineProps<{ username: string }>();
const { data: submissions, isPending } = useRecentSubmissionsQuery(() => props.username);
const locale = useLocaleStore();
const now = useNow(60_000);
const PROBLEMS = { name: 'problems' };
const target = computed(() => continueTarget(submissions.value ?? []));

const MARKS = { full: Check, partial: Minus, zero: X } as const;
const cueOf = (item: SubmissionListItem): keyof typeof MARKS =>
  item.casePoints >= item.caseTotal && item.caseTotal > 0
    ? 'full'
    : item.casePoints > 0
      ? 'partial'
      : 'zero';

const whenAndWhere = (item: SubmissionListItem) => {
  const when = translate('home.continue.lastSubmission', {
    when: formatRelative(item.date, now.value, locale.locale),
  });
  const failure = firstFailure(item);
  if (!failure) return item.result && item.result !== 'AC' ? `${when} · ${item.result}` : when;
  const where =
    failure.unit === 'batch'
      ? translate('home.continue.failedBatch', {
          verdict: failure.verdict,
          batch: failure.position,
        })
      : translate('home.continue.failedAt', { verdict: failure.verdict, test: failure.position });
  return `${when} · ${where}`;
};
const score = (item: SubmissionListItem) =>
  `${formatNumber(item.casePoints, locale.locale)} / ${formatNumber(item.caseTotal, locale.locale)}`;
</script>

<template>
  <PageSection data-testid="continue-card" :title="$t('home.continue.title')">
    <!-- The skeleton has the card's height, so the problem or the empty line does not move the page. -->
    <SkeletonBlock v-if="isPending" class="h-16 rounded-card" />
    <Card
      v-else-if="target?.problem"
      as="div"
      variant="flat"
      padding="sm"
      :to="{ name: 'problem', params: { code: target.problem.code } }"
      :link-label="target.problem.name"
      class="flex items-center gap-3 py-3"
      data-testid="continue-problem"
    >
      <component
        :is="MARKS[cueOf(target)]"
        aria-hidden="true"
        class="size-5 shrink-0"
        :class="CUE_TEXT[cueOf(target)]"
      />
      <div class="min-w-0 flex-1">
        <p class="flex items-baseline gap-2">
          <span class="min-w-0 truncate font-semibold">{{ target.problem.name }}</span>
        </p>
        <p class="text-meta text-muted">{{ whenAndWhere(target) }}</p>
      </div>
      <Chip v-if="target.caseTotal > 0" :tone="cueOf(target)" class="font-mono">{{
        score(target)
      }}</Chip>
      <ArrowRight aria-hidden="true" class="size-4 shrink-0 text-muted" />
    </Card>
    <EmptyState v-else inline>
      {{ $t('home.continue.empty') }}
      <template #action>
        <SeeAllLink :to="PROBLEMS">{{ $t('home.anon.problems') }}</SeeAllLink>
      </template>
    </EmptyState>
  </PageSection>
</template>
