<script setup lang="ts">
import { computed } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import { useSessionStore } from '@/stores/session.store';
import { canUseAdmin } from '../../admin-access';
import { ADMIN_SCREENS } from '../../admin-screens';
import { buttonClass } from '../../ui/controls';
import AdminNotice from '../../ui/feedback/AdminNotice.vue';

/** No key or secret saved: the list cannot be read. Settings for whoever may change them, the zip import for whoever may use it. */
const { can } = usePermissions();
const session = useSessionStore();
const canImportZip = computed(() => canUseAdmin(session.user, ADMIN_SCREENS.problemImport));
</script>

<template>
  <div data-testid="polygon-not-connected">
    <AdminNotice
      tone="caution"
      :title="$t('admin.polygonLink.notConnected.title')"
      :summary="
        can('judge.change_settings')
          ? $t('admin.polygonLink.notConnected.bodyAdmin')
          : $t('admin.polygonLink.notConnected.bodyAsk')
      "
    >
      <template #action>
        <div class="mt-2 flex flex-wrap gap-2">
          <RouterLink
            v-if="can('judge.change_settings')"
            :to="{
              name: 'admin-settings',
              query: { tab: 'integrations' },
              hash: '#settings-polygon',
            }"
            :class="buttonClass('secondary', 'sm')"
            >{{ $t('admin.polygonLink.notConnected.openSettings') }}</RouterLink
          >
          <RouterLink
            v-if="canImportZip"
            :to="{ name: 'admin-problemImport' }"
            :class="buttonClass('secondary', 'sm')"
            >{{ $t('admin.polygonLink.wizard.zipInstead') }}</RouterLink
          >
        </div>
      </template>
    </AdminNotice>
  </div>
</template>
