<script setup lang="ts">
import { Hourglass, Server } from 'lucide-vue-next';
import { computed } from 'vue';
import { useSubmissionStatsQuery } from '@/features/submissions/submissions.queries';
import { usePermissions } from '@/stores/use-permissions';
import { adminRouteName } from '../../admin-screens';
import OverviewTile from './OverviewTile.vue';

/** The public submission strip's numbers (the queue counts what a signed-out viewer may see); mounted only for judging staff. */
const stats = useSubmissionStatsQuery();
const { can } = usePermissions();
const judgesLink = computed(() => ({
  name: adminRouteName(can('judge.change_judge') ? 'judges' : 'rejudge'),
}));
const judgesOnline = computed(() =>
  stats.data.value ? `${stats.data.value.judgesOnline}/${stats.data.value.judgesTotal}` : null,
);
</script>

<template>
  <OverviewTile
    :icon="Hourglass"
    :label="$t('admin.shell.overview.queue')"
    :value="stats.data.value?.queueLength ?? null"
    :detail="$t('admin.shell.overview.queueDetail')"
    :to="{ name: 'submissions' }"
    :needs-attention="(stats.data.value?.queueLength ?? 0) > 0"
  />
  <OverviewTile
    :icon="Server"
    :label="$t('admin.shell.overview.judges')"
    :value="judgesOnline"
    :detail="$t('admin.shell.overview.judgesDetail')"
    :to="judgesLink"
    :needs-attention="stats.data.value?.judgesOnline === 0"
  />
</template>
