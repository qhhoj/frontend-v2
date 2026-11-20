<script setup lang="ts">
import { computed } from 'vue';
import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionListItem } from '@/api/types/submissions';
import Lamp from '@/components/ui/Lamp.vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import { VERDICT_TEXT_CLASSES, submissionVerdictOf } from '@/lib/verdicts';

/**
 * A list row's verdict: the kit's mark (lamp and code) once the row is judged. A row still in progress has no code a
 * student knows, so it says where it is in words beside the pulsing lamp: "Đang chờ", "Đang xử lý", "Đang chấm" (the
 * names of `verdicts.*`, the one set). How far the judging got ("3/10") is the row's score cell (`SubmissionScore`).
 */
const props = defineProps<{ row: Pick<SubmissionListItem, 'status' | 'result' | 'points'> }>();
const verdict = computed(() => submissionVerdictOf(props.row as SubmissionListItem));
const isInProgress = computed(() => IN_PROGRESS_STATUSES.includes(props.row.status));
</script>

<template>
  <span
    v-if="isInProgress"
    data-testid="verdict-in-progress"
    class="inline-flex min-h-(--qh-chip) shrink-0 items-center gap-2 text-small font-medium whitespace-nowrap"
    :class="VERDICT_TEXT_CLASSES[verdict.tone]"
  >
    <Lamp :tone="verdict.tone" />
    {{ $t(verdict.labelKey) }}
  </span>
  <VerdictChip v-else :verdict="verdict" />
</template>
