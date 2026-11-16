<script setup lang="ts">
import type { SubmissionDetail } from '@/api/types/submissions';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import Card from '@/components/ui/Card.vue';
import UserLink from '@/components/UserLink.vue';
import type { SubmissionInContest } from '@/features/contests/submission/submission-contest';
import { formatClock, formatDate, formatRelative } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import DeletedProblemChip from './DeletedProblemChip.vue';
import { NO_VALUE } from '@/lib/format';

/** "3 minutes ago" only needs a fresh clock once a minute. */
const CLOCK_REFRESH_MS = 60_000;

/** The aside card: problem, author, time, language and judge (order in `summary-facts.ts`). Keep `SubmissionFactsSkeleton.vue` in step. */
defineProps<{
  submission: SubmissionDetail;
  /** The problem's name when it is readable; the row's own name is the fallback. */
  problemName: string | null;
  /** In the viewer's contest: a "Kỳ thi" row, the contest letter, and the minute of the run. */
  inContest?: SubmissionInContest | null;
}>();
const locale = useLocaleStore();
const now = useNow(CLOCK_REFRESH_MS);
</script>

<template>
  <Card as="aside" data-testid="submission-facts" class="rounded-card p-6 sm:p-8">
    <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
      <template v-if="inContest">
        <dt data-fact="contest" class="text-meta text-muted">
          {{ $t('submission.facts.contest') }}
        </dt>
        <dd class="min-w-0 [overflow-wrap:anywhere]">
          <RouterLink
            :to="{ name: 'contest', params: { key: inContest.contest.key } }"
            class="font-semibold text-accent-text underline underline-offset-2 hover:no-underline"
            >{{ inContest.contest.name }}</RouterLink
          >
        </dd>
      </template>
      <dt data-fact="problem" class="text-meta text-muted">
        {{ $t('submission.facts.problem') }}
      </dt>
      <dd class="min-w-0 [overflow-wrap:anywhere]">
        <span v-if="submission.problem?.isDeleted" class="font-semibold"
          >{{ submission.problem.name }} <DeletedProblemChip
        /></span>
        <RouterLink
          v-else-if="submission.problem"
          :to="{ name: 'problem', params: { code: submission.problem.code } }"
          class="font-semibold hover:underline"
          ><template v-if="inContest">{{ inContest.problem.label }}. </template
          >{{ problemName ?? submission.problem.name }}</RouterLink
        ><template v-else>{{ NO_VALUE }}</template>
      </dd>
      <dt data-fact="user" class="text-meta text-muted">{{ $t('submission.facts.user') }}</dt>
      <dd class="min-w-0 [overflow-wrap:anywhere]">
        <UserLink
          v-if="submission.user"
          :username="submission.user.username"
          :rating="submission.user.rating"
          size="md"
        />
        <template v-else>{{ NO_VALUE }}</template>
      </dd>
      <dt data-fact="submitted" class="text-meta text-muted">
        {{ $t('submission.facts.submitted') }}
      </dt>
      <dd class="min-w-0">
        <time
          :datetime="submission.date"
          :title="formatDate(submission.date, 'datetime', locale.locale)"
          >{{
            inContest?.minute != null
              ? $t('submission.contest.minute', {
                  time: formatClock(submission.date),
                  minute: inContest.minute,
                })
              : formatRelative(submission.date, now, locale.locale)
          }}</time
        >
      </dd>
      <dt data-fact="language" class="text-meta text-muted">
        {{ $t('submission.facts.language') }}
      </dt>
      <dd class="min-w-0 font-mono">
        <LanguageLabel v-if="submission.language" :language="submission.language" />
        <template v-else>{{ NO_VALUE }}</template>
      </dd>
      <dt data-fact="judge" class="text-meta text-muted">{{ $t('submission.facts.judge') }}</dt>
      <dd class="min-w-0 font-mono [overflow-wrap:anywhere]">
        {{ submission.judgedOn ?? NO_VALUE }}
      </dd>
    </dl>
  </Card>
</template>
