<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
import { computed, watchEffect } from 'vue';
import { useEditableProblemQuery } from '../../problems/problem-editing.queries';
import ContinueRow from './ContinueRow.vue';
import { isRecordGone } from './continue-records';
import type { ContinueRecord } from './continue-records';

/** A problem's row. A problem that is gone (404) or no longer the viewer's (403) says so, and is forgotten. */
const props = defineProps<{ record: ContinueRecord }>();
const emit = defineEmits<{ ready: []; gone: [] }>();
const query = useEditableProblemQuery(() => props.record.id);
const problem = computed(() => query.data.value);
watchEffect(() => {
  if (problem.value) emit('ready');
  else if (isRecordGone(query.error.value)) emit('gone');
});
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
