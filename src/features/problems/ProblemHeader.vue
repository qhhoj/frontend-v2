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
 * The top of the problem page, on the page background (not in the statement card): the section crumb, the title, a meta
 * line (code, group chip), the edit link and the `actions` slot (the submit button, right-most), the `strip` slot (the
 * facts strip), then the tabs in the default slot. The root is `contents`, so the sticky strip sticks within the parent
 * that also holds the statement card.
 * Keep `ProblemHeaderSkeleton.vue` in step.
 */
/** `section`: the tab being read; the edit link opens its editor tab. */
const props = defineProps<{ problem: ProblemDetail; section?: ProblemSection }>();
const session = useSessionStore();
</script>

<template>
  <div data-testid="problem-header" class="contents">
    <PageHeader :title="problem.name">
      <template #meta>
        <span class="font-mono [overflow-wrap:anywhere]">{{ problem.code }}</span>
        <Chip v-if="problem.group" data-testid="problem-group-chip">{{
          problemTypeLabel(problem.group)
        }}</Chip>
        <Chip v-if="problem.externalJudge" data-testid="external-judge-badge">{{
          $t('problem.externalJudge', { oj: problem.externalJudge.oj })
        }}</Chip>
      </template>
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <AdminEditLink :to="problemEditTarget(session.user, props.problem, props.section)" />
          <slot name="actions" />
        </div>
      </template>
    </PageHeader>
    <slot name="strip" />
    <div v-if="$slots.default" class="mt-4"><slot /></div>
  </div>
</template>
