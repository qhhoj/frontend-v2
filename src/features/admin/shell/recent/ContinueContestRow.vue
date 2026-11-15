<script setup lang="ts">
import { Trophy } from 'lucide-vue-next';
import { computed } from 'vue';
import { useEditableContestQuery } from '../../contests/contest-editing.queries';
import ContinueRow from './ContinueRow.vue';
import type { ContinueRecord } from './continue-records';

/** A contest's row, with its phase as the state. A contest that cannot be read shows no row. */
const props = defineProps<{ record: ContinueRecord }>();
const query = useEditableContestQuery(() => props.record.id);
const contest = computed(() => query.data.value);
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
