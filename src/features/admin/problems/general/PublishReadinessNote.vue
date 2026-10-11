<script setup lang="ts">
import { computed } from 'vue';
import { TriangleAlert } from 'lucide-vue-next';
import { useProblemDataQuery } from '../data/problem-data.queries';
import { publishIssues } from './publish-readiness';

/** Shown while a saved private problem is switched to public: advice only, the save is never blocked. */
const props = defineProps<{ code: string; points: number }>();
const data = useProblemDataQuery(() => props.code);
/** A failed data read (no rights, network) says nothing rather than guessing. */
const issues = computed(() =>
  data.data.value ? publishIssues(data.data.value.cases, props.points) : [],
);
</script>

<template>
  <div
    v-if="issues.length > 0"
    role="status"
    data-testid="publish-readiness"
    class="flex flex-col gap-2 rounded-row border border-line-strong p-3 text-sm"
  >
    <p class="flex items-center gap-2 font-semibold">
      <TriangleAlert aria-hidden="true" class="size-4 shrink-0 text-negative" />
      {{ $t('admin.problems.status.readiness.title') }}
    </p>
    <ul class="list-disc pl-6">
      <li v-for="issue in issues" :key="issue">
        {{ $t(`admin.problems.status.readiness.${issue}`) }}
      </li>
    </ul>
    <RouterLink
      :to="{ name: 'admin-problemData', params: { code } }"
      class="self-start font-semibold text-accent-text hover:underline"
    >
      {{ $t('admin.problems.status.readiness.openData') }}
    </RouterLink>
  </div>
</template>
