<script setup lang="ts">
import { computed } from 'vue';
import AdminNotice from '../../ui/feedback/AdminNotice.vue';
import { useProblemDataQuery } from '../data/problem-data.queries';
import { publishIssues } from './publish-readiness';

/** Shown while a saved private problem is ticked public: a checklist of what is missing, never blocking the save. */
const props = defineProps<{ code: string; points: number }>();
const data = useProblemDataQuery(() => props.code);
/** A failed data read (no rights, network) says nothing rather than guessing. */
const issues = computed(() =>
  data.data.value ? publishIssues(data.data.value.cases, props.points) : [],
);
</script>

<template>
  <div v-if="issues.length > 0" role="status" data-testid="publish-readiness">
    <AdminNotice tone="caution" :title="$t('admin.problems.status.readiness.title')">
      <template #action>
        <ul class="mt-1 list-disc pl-5">
          <li v-for="issue in issues" :key="issue">
            {{ $t(`admin.problems.status.readiness.${issue}`) }}
          </li>
        </ul>
        <RouterLink
          :to="{ name: 'admin-problemData', params: { code } }"
          class="mt-1 inline-flex min-h-6 font-semibold text-accent-text underline underline-offset-2"
        >
          {{ $t('admin.problems.status.readiness.openData') }}
        </RouterLink>
      </template>
    </AdminNotice>
  </div>
</template>
