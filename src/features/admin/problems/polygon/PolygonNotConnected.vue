<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../../shell/AdminBit.vue';
import { ADMIN_BUTTON_CLASS } from '../../ui/classes';

/** No key or secret saved: the list cannot be read. Settings for whoever may change them; the zip import always works. */
const { can } = usePermissions();
</script>

<template>
  <GlassCard class="flex flex-wrap items-center gap-4 p-5" data-testid="polygon-not-connected">
    <AdminBit placement="security" />
    <div class="min-w-[min(100%,16rem)] flex-1">
      <h2 class="font-bold">{{ $t('admin.polygonLink.notConnected.title') }}</h2>
      <p class="text-sm text-muted">
        {{
          can('judge.change_settings')
            ? $t('admin.polygonLink.notConnected.bodyAdmin')
            : $t('admin.polygonLink.notConnected.bodyAsk')
        }}
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <RouterLink
        v-if="can('judge.change_settings')"
        :to="{ name: 'admin-settings', hash: '#settings-polygon' }"
        :class="ADMIN_BUTTON_CLASS"
        >{{ $t('admin.polygonLink.notConnected.openSettings') }}</RouterLink
      >
      <RouterLink :to="{ name: 'admin-problemImport' }" :class="ADMIN_BUTTON_CLASS">{{
        $t('admin.polygonLink.wizard.zipInstead')
      }}</RouterLink>
    </div>
  </GlassCard>
</template>
