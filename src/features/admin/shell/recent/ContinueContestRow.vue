<script setup lang="ts">
import { Trophy } from 'lucide-vue-next';
import { computed, watchEffect } from 'vue';
import { useEditableContestQuery } from '../../contests/contest-editing.queries';
import ContinueRow from './ContinueRow.vue';
import { isRecordGone } from './continue-records';
import type { ContinueRecord } from './continue-records';

/** A contest's row, with its phase as the state. A contest that is gone (404) or no longer the viewer's (403) says so, and is forgotten. */
const props = defineProps<{ record: ContinueRecord }>();
const emit = defineEmits<{ ready: []; gone: [] }>();
const query = useEditableContestQuery(() => props.record.id);
const contest = computed(() => query.data.value);
watchEffect(() => {
  if (contest.value) emit('ready');
  else if (isRecordGone(query.error.value)) emit('gone');
});
const TONES = { upcoming: 'info', running: 'success', ended: 'neutral' } as const;
</script>

<template>
  <ContinueRow
    v-if="contest"
    :id="record.id"
    :icon="Trophy"
    :name="contest.name"
    :tab-title="$t(record.titleKey)"
    :status="$t(`admin.shell.continue.phase.${contest.phase}`)"
    :tone="TONES[contest.phase]"
    :to="record.path"
  />
</template>
