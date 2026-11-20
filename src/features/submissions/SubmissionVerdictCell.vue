<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { translate } from '@/i18n';
import { NO_VALUE } from '@/lib/format';
import { submissionVerdictOf } from '@/lib/verdicts';
import SubmissionVerdictMark from './SubmissionVerdictMark.vue';

/**
 * A list row's verdict (`SubmissionVerdictMark`: lamp and code, or words while the row is judged) as the link to the
 * submission; its label names the whole row for a screen reader.
 */
const props = defineProps<{ row: SubmissionListItem }>();
const verdict = computed(() => submissionVerdictOf(props.row));
const rowLabel = computed(() =>
  translate('submissions.rowLabel', {
    id: props.row.id,
    user: props.row.user?.username ?? NO_VALUE,
    problem: props.row.problem?.name ?? NO_VALUE,
    verdict: translate(verdict.value.labelKey),
  }),
);
</script>

<template>
  <RouterLink
    :to="{ name: 'submission', params: { id: row.id } }"
    :aria-label="rowLabel"
    class="relative inline-flex touch:after:absolute touch:after:-inset-3 touch:after:content-['']"
  >
    <SubmissionVerdictMark :row="row" />
  </RouterLink>
</template>
