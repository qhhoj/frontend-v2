<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
import { computed } from 'vue';
import { useEditableProblemQuery } from '../../problems/problem-editing.queries';
import ContinueRow from './ContinueRow.vue';
import type { ContinueRecord } from './continue-records';

/** A problem's row. A problem that cannot be read (deleted, or no longer the viewer's) shows no row. */
const props = defineProps<{ record: ContinueRecord }>();
const query = useEditableProblemQuery(() => props.record.id);
const problem = computed(() => query.data.value);
</script>

<template>
  <ContinueRow
    v-if="problem"
    :id="record.id"
    :icon="FileText"
    :name="problem.name"
    :tab-title="$t(record.titleKey)"
    :status="$t(problem.isPublic ? 'admin.shell.continue.public' : 'admin.shell.continue.draft')"
    :tone="problem.isPublic ? 'success' : 'warning'"
    :to="record.path"
  />
</template>
