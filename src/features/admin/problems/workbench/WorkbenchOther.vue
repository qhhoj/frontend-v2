<script setup lang="ts">
import { computed } from 'vue';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import Card from '@/components/ui/Card.vue';
import { usePermissions } from '@/stores/use-permissions';
import DataSourceFiles from '../data/DataSourceFiles.vue';
import { useProblemDataQuery } from '../data/problem-data.queries';
import ProblemExternalTab from '../external/ProblemExternalTab.vue';
import ProblemDangerZone from '../lifecycle/ProblemDangerZone.vue';
import ProblemPackageCard from '../package/ProblemPackageCard.vue';
import PolygonLinkPanel from '../polygon/PolygonLinkPanel.vue';

/**
 * The last section: what few problems need. Judging on another site, the Polygon link, the full package, the stored
 * source files, and deleting the problem. Each part here saves on its own, as it did on its old tab; none is part of the
 * page's save bar.
 */
const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const { can } = usePermissions();
const canDelete = computed(() => can('judge.delete_problem'));
const data = useProblemDataQuery(() => props.problem.code);
</script>

<template>
  <ProblemExternalTab :problem="problem" :meta="meta" />
  <PolygonLinkPanel :code="problem.code" />
  <Card as="div"><ProblemPackageCard :code="problem.code" /></Card>
  <DataSourceFiles v-if="data.data.value" :code="problem.code" :data="data.data.value" />
  <ProblemDangerZone v-if="canDelete" :code="problem.code" />
</template>
