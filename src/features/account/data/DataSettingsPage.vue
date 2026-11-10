<script setup lang="ts">
import Notice from '@/components/ui/Notice.vue';
import Card from '@/components/ui/Card.vue';
import { computed } from 'vue';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useSessionStore } from '@/stores/session.store';
import SettingsLayout from '../settings/SettingsLayout.vue';
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
    <Card
      v-if="session.impersonatorId !== null"
      padding="lg"
      class="flex flex-col gap-5"
      :title="$t('settings.data.title')"
    >
      <Notice tone="warning" bit="security">{{ $t('settings.data.locked') }}</Notice>
    </Card>
    <template v-else>
      <Card
        v-if="unavailable"
        padding="lg"
        class="flex flex-col gap-5"
        :title="$t('settings.data.title')"
      >
        <Notice tone="info">{{ $t('settings.data.unavailable') }}</Notice>
      </Card>
      <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <Card as="div" padding="lg" class="flex flex-col gap-5">
            <SkeletonBlock class="h-6 w-56" />
            <SkeletonBlock class="h-23 w-full" />
            <SkeletonBlock class="h-11 w-44" pill />
          </Card>
        </template>
        <DataExportCard v-if="status" :status="status" :username="session.user?.username ?? ''" />
      </QueryState>
      <Card
        padding="lg"
        class="flex flex-col gap-5"
        :title="$t('settings.data.limitsTitle')"
        :lead="$t('settings.data.limitsLead')"
      >
        <ul class="m-0 flex list-disc flex-col gap-1 pl-5 text-sm">
          <li>{{ $t('settings.data.limitInterval') }}</li>
          <li>{{ $t('settings.data.limitDaily') }}</li>
          <li>{{ $t('settings.data.limitOneAtATime') }}</li>
          <li>{{ $t('settings.data.limitLifetime') }}</li>
        </ul>
      </Card>
    </template>
  </SettingsLayout>
</template>
