<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { problemEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import type { ProblemSection } from '@/features/admin/edit-link/admin-edit-targets';
import type { ProblemDetail } from '@/api/types/problems';
import Chip from '@/components/ui/Chip.vue';
import { useSessionStore } from '@/stores/session.store';
import { problemTypeLabel } from './problem-type-label';

/**
 * The top of the statement card: code, group chip, title and edit link, the `strip` slot (the phone's limit strip), a
 * hairline, then the tabs in the default slot.
 * Keep `ProblemHeaderSkeleton.vue` in step.
 */
/** `section`: the tab being read; the edit link opens its editor tab. */
const props = defineProps<{ problem: ProblemDetail; section?: ProblemSection }>();
const session = useSessionStore();
</script>

<template>
  <div data-testid="problem-header">
    <PageHeader :title="problem.name">
      <template #above>
        <p class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm">
          <span class="font-mono text-muted [overflow-wrap:anywhere]">{{ problem.code }}</span>
          <Chip v-if="problem.group" data-testid="problem-group-chip" tone="accent">{{
            problemTypeLabel(problem.group)
          }}</Chip>
          <Chip v-if="problem.externalJudge" data-testid="external-judge-badge">{{
            $t('problem.externalJudge', { oj: problem.externalJudge.oj })
          }}</Chip>
        </p>
      </template>
      <template #actions>
        <AdminEditLink :to="problemEditTarget(session.user, props.problem, props.section)" />
      </template>
    </PageHeader>
    <slot name="strip" />
    <hr class="-mx-6 mt-4 border-line sm:-mx-8" />
    <div v-if="$slots.default" class="mt-4"><slot /></div>
  </div>
</template>
