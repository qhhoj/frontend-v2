<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionDetail } from '@/api/types/submissions';
import Card from '@/components/ui/Card.vue';
import UserLink from '@/components/UserLink.vue';
import { formatDateTime, formatRelative } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import DeletedProblemChip from './DeletedProblemChip.vue';

const NO_VALUE = '—';
/** "3 minutes ago" only needs a fresh clock once a minute. */
const CLOCK_REFRESH_MS = 60_000;

/** The aside card: problem, author, time, language and judge (order in `summary-facts.ts`). Keep `SubmissionFactsSkeleton.vue` in step. */
const props = defineProps<{
  submission: SubmissionDetail;
  /** The problem's name when it is readable; the row's own name is the fallback. */
  problemName: string | null;
}>();
const locale = useLocaleStore();
const now = useNow(CLOCK_REFRESH_MS);
const plainFacts = computed(() => [
  { key: 'language', value: props.submission.language?.name ?? NO_VALUE },
  { key: 'judge', value: props.submission.judgedOn ?? NO_VALUE },
]);
</script>

<template>
  <Card as="aside" data-testid="submission-facts" class="rounded-card p-5 sm:px-6">
    <dl class="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm">
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
        <time :datetime="submission.date" :title="formatDateTime(submission.date, locale.locale)">{{
          formatRelative(submission.date, now, locale.locale)
        }}</time>
      </dd>
      <template v-for="fact in plainFacts" :key="fact.key">
        <dt :data-fact="fact.key" class="text-meta text-muted">
          {{ $t(`submission.facts.${fact.key}`) }}
        </dt>
        <dd class="min-w-0 font-mono [overflow-wrap:anywhere]">{{ fact.value }}</dd>
      </template>
    </dl>
  </Card>
</template>
