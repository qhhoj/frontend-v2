<script setup lang="ts">
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { problemEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import type { ProblemDetail } from '@/api/types/problems';
import GlassCard from '@/components/GlassCard.vue';
import { useSessionStore } from '@/stores/session.store';

/** Code, group and title; the tabs go in the slot. Keep `ProblemHeaderSkeleton.vue` in step. */
const props = defineProps<{ problem: ProblemDetail }>();
const session = useSessionStore();
</script>

<template>
  <GlassCard data-testid="problem-header" class="rounded-panel px-6 pt-6 sm:px-8 sm:pt-8">
    <div class="flex items-start gap-3">
      <p class="min-w-0 flex-1 font-mono text-sm text-muted">
        {{ problem.code }}<template v-if="problem.group"> · {{ problem.group.fullName }}</template>
      </p>
      <AdminEditLink :to="problemEditTarget(session.user, props.problem)" />
    </div>
    <h1 class="mt-1 page-title [overflow-wrap:anywhere] max-sm:min-h-[65px]">
      {{ problem.name }}
    </h1>
    <div class="mt-4 pb-4"><slot /></div>
  </GlassCard>
</template>
