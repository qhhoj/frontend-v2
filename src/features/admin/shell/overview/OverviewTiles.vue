<script setup lang="ts">
import { computed } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS, TICKET_STAFF } from '../../admin-screens';
import { ORGANIZATION_QUEUE_PERMISSION } from '../../organizations/join-requests.queries';
import { isMakerOf } from './admin-overview.queries';
import OverviewTile from './OverviewTile.vue';
import { JUDGING_STAFF, useOverviewTiles } from './use-overview-tiles';

/** The dashboard's figures, the ones that need attention first, so the first row is what waits (P-33). */
const { can, canAny } = usePermissions();
const tiles = useOverviewTiles();
const hasTiles = computed(
  () =>
    isMakerOf(can) ||
    canAny([
      ...JUDGING_STAFF,
      TICKET_STAFF,
      ADMIN_SCREENS.commentReports.permission,
      ORGANIZATION_QUEUE_PERMISSION,
    ]),
);
</script>

<template>
  <section v-if="hasTiles" aria-labelledby="admin-overview-title" class="flex flex-col gap-3">
    <h2 id="admin-overview-title" class="font-display text-base font-semibold">
      {{ $t('admin.shell.overview.title') }}
    </h2>
    <ul class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      <OverviewTile
        v-for="tile in tiles"
        :key="tile.key"
        :icon="tile.icon"
        :label="tile.label"
        :value="tile.value"
        :detail="tile.detail"
        :to="tile.to"
        :needs-attention="tile.needsAttention"
        :link-text="tile.linkText"
      />
    </ul>
  </section>
</template>
