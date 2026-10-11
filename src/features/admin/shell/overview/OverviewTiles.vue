<script setup lang="ts">
import { Flag, LifeBuoy, UserPlus } from 'lucide-vue-next';
import { computed } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS, adminRouteName } from '../../admin-screens';
import { ORGANIZATION_QUEUE_PERMISSION } from '../../organizations/join-requests.queries';
import { useAdminCounts } from './admin-overview.queries';
import JudgingTiles from './JudgingTiles.vue';
import OverviewTile from './OverviewTile.vue';

/** Who sees the queue and judge figures: the staff who can act on judging. */
const JUDGING_STAFF = ['judge.change_judge', 'judge.rejudge_submission'];
const { can, canAny } = usePermissions();
const counts = useAdminCounts();
const hasTiles = computed(() =>
  canAny([
    ...JUDGING_STAFF,
    ADMIN_SCREENS.tickets.permission,
    ADMIN_SCREENS.commentReports.permission,
    ORGANIZATION_QUEUE_PERMISSION,
  ]),
);
</script>

<template>
  <section v-if="hasTiles" aria-labelledby="admin-overview-title" class="flex flex-col gap-3">
    <h2 id="admin-overview-title" class="font-display text-base font-bold">
      {{ $t('admin.shell.overview.title') }}
    </h2>
    <ul class="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-5">
      <JudgingTiles v-if="canAny(JUDGING_STAFF)" />
      <OverviewTile
        v-if="can(ADMIN_SCREENS.tickets.permission)"
        :icon="LifeBuoy"
        :label="$t('admin.shell.overview.tickets')"
        :value="counts.awaitingTickets.value"
        :detail="$t('admin.shell.overview.ticketsDetail')"
        :to="{ name: adminRouteName('tickets') }"
        :needs-attention="!!counts.awaitingTickets.value"
      />
      <OverviewTile
        v-if="can(ADMIN_SCREENS.commentReports.permission)"
        :icon="Flag"
        :label="$t('admin.shell.overview.reports')"
        :value="counts.openReports.value"
        :detail="$t('admin.shell.overview.reportsDetail')"
        :to="{ name: adminRouteName('commentReports') }"
        :needs-attention="!!counts.openReports.value"
      />
      <OverviewTile
        v-if="can(ORGANIZATION_QUEUE_PERMISSION)"
        :icon="UserPlus"
        :label="$t('admin.shell.overview.requests')"
        :value="counts.pendingRequests.value"
        :detail="$t('admin.shell.overview.requestsDetail')"
        :to="{ name: adminRouteName('organizations'), query: { view: 'requests' } }"
        :needs-attention="!!counts.pendingRequests.value"
      />
    </ul>
  </section>
</template>
