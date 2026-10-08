<script setup lang="ts">
import { computed } from 'vue';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsLayout from '../settings/SettingsLayout.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';
import DataExportCard from './DataExportCard.vue';
import { useDataExportQuery } from './data.queries';

const session = useSessionStore();
const { data: status, isPending, error, refetch } = useDataExportQuery();
/** Export switched off, or a muted account: not a failure to retry. */
const unavailable = computed(
  () => error.value instanceof ApiError && error.value.code === 'not_found',
);
</script>

<template>
  <SettingsLayout>
    <!-- Export request and download are private data: the backend refuses them to staff (Decision 17), so nothing is asked or offered. -->
    <SettingsCard v-if="session.impersonatorId !== null" :title="$t('settings.data.title')">
      <SettingsNotice tone="warning" bit="security">{{
        $t('settings.data.locked')
      }}</SettingsNotice>
    </SettingsCard>
    <template v-else>
      <SettingsCard v-if="unavailable" :title="$t('settings.data.title')">
        <SettingsNotice tone="info">{{ $t('settings.data.unavailable') }}</SettingsNotice>
      </SettingsCard>
      <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <div class="glass flex flex-col gap-5 rounded-card p-5 md:p-7">
            <SkeletonBlock class="h-6 w-56" />
            <SkeletonBlock class="h-[92px] w-full" />
            <SkeletonBlock class="h-11 w-44" pill />
          </div>
        </template>
        <DataExportCard v-if="status" :status="status" :username="session.user?.username ?? ''" />
      </QueryState>
      <SettingsCard :title="$t('settings.data.limitsTitle')" :lead="$t('settings.data.limitsLead')">
        <ul class="m-0 flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>{{ $t('settings.data.limitInterval') }}</li>
          <li>{{ $t('settings.data.limitDaily') }}</li>
          <li>{{ $t('settings.data.limitOneAtATime') }}</li>
          <li>{{ $t('settings.data.limitLifetime') }}</li>
        </ul>
      </SettingsCard>
    </template>
  </SettingsLayout>
</template>
