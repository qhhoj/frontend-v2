<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminBit from '../../shell/AdminBit.vue';
import { BUTTON } from '../../ui/controls';

/** No base URL or token saved: nothing can be searched or verified. */
const { can } = usePermissions();
</script>

<template>
  <GlassCard class="flex flex-wrap items-center gap-4 p-5" data-testid="external-not-connected">
    <AdminBit placement="security" />
    <div class="min-w-[min(100%,16rem)] flex-1">
      <h2 class="font-bold">{{ $t('admin.externalJudge.notConnected.title') }}</h2>
      <p class="text-sm text-muted">
        {{
          can('judge.change_settings')
            ? $t('admin.externalJudge.notConnected.bodyAdmin')
            : $t('admin.externalJudge.notConnected.bodyAsk')
        }}
      </p>
    </div>
    <RouterLink
      v-if="can('judge.change_settings')"
      :to="{ name: 'admin-settings', hash: '#settings-externalJudge' }"
      :class="BUTTON.secondary"
      >{{ $t('admin.externalJudge.notConnected.openSettings') }}</RouterLink
    >
  </GlassCard>
</template>
