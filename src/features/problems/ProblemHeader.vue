<script setup lang="ts">
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { problemEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import type { ProblemDetail } from '@/api/types/problems';
import Chip from '@/components/ui/Chip.vue';
import { useSessionStore } from '@/stores/session.store';
import { problemTypeLabel } from './problem-type-label';

/**
 * The top of the statement card: code, group chip, title and edit link, a hairline, then the tabs in the slot.
 * Keep `ProblemHeaderSkeleton.vue` in step.
 */
const props = defineProps<{ problem: ProblemDetail }>();
const session = useSessionStore();
</script>

<template>
  <div data-testid="problem-header">
    <div class="flex items-start gap-3">
      <div class="min-w-0 flex-1">
        <p class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm">
          <span class="font-mono text-muted [overflow-wrap:anywhere]">{{ problem.code }}</span>
          <Chip v-if="problem.group" data-testid="problem-group-chip" tone="accent">{{
            problemTypeLabel(problem.group)
          }}</Chip>
          <Chip v-if="problem.externalJudge" data-testid="external-judge-badge">{{
            $t('problem.externalJudge', { oj: problem.externalJudge.oj })
          }}</Chip>
        </p>
        <h1 class="mt-1 page-title [overflow-wrap:anywhere] max-sm:min-h-[65px]">
          {{ problem.name }}
        </h1>
      </div>
      <AdminEditLink :to="problemEditTarget(session.user, props.problem)" />
    </div>
    <hr class="-mx-6 mt-4 border-line sm:-mx-8" />
    <div v-if="$slots.default" class="mt-4"><slot /></div>
  </div>
</template>
