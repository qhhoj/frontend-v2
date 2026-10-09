<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { contestDataDownloadUrl, fetchContestData } from '@/api/contest-editing.api';
import QueryState from '@/components/QueryState.vue';
import { formatDateTime, formatFileSize } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../../shell/AdminBit.vue';
import { ADMIN_BUTTON_CLASS, ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import { canPrepareAgain } from './contest-actions';
import PrepareDataDialog from './PrepareDataDialog.vue';

const props = defineProps<{ contestKey: string }>();
const locale = useLocaleStore();
const now = useNow();
const isPrepareOpen = ref(false);
const dataKey = () => ['admin', 'contest-data', props.contestKey] as const;
const {
  data: status,
  error,
  isPending,
  refetch,
} = useQuery({
  queryKey: computed(() => dataKey()),
  queryFn: () => fetchContestData(props.contestKey),
  /** Polls only while the export is being prepared, so the link appears without a reload. */
  refetchInterval: (query) => (query.state.data?.state === 'preparing' ? 5000 : false),
});
const mayPrepare = computed(() =>
  status.value ? canPrepareAgain(status.value, now.value) : false,
);
const isReady = computed(() => status.value?.state === 'ready');
</script>

<template>
  <section class="glass flex flex-col gap-4 rounded-panel p-5">
    <header class="flex flex-col gap-1">
      <h3 class="font-display text-lg font-semibold">
        {{ $t('admin.contests.actions.data.title') }}
      </h3>
      <p class="text-sm text-muted">{{ $t('admin.contests.actions.data.description') }}</p>
    </header>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <div v-if="status" class="flex flex-col gap-3">
        <p v-if="status.state === 'preparing'" class="flex items-center gap-2 text-sm">
          <AdminBit placement="queued" />{{ $t('admin.contests.actions.data.preparing') }}
        </p>
        <p
          v-else-if="status.state === 'ready' && status.size !== null"
          class="text-sm font-semibold"
        >
          {{ $t('admin.contests.actions.data.ready', { size: formatFileSize(status.size) }) }}
        </p>
        <p v-else class="text-sm text-muted">{{ $t('admin.contests.actions.data.none') }}</p>
        <p v-if="isReady && status.readyAt" class="text-sm text-muted">
          {{
            $t('admin.contests.actions.data.readyDetail', {
              readyAt: formatDateTime(status.readyAt, locale.locale),
              nextPrepareAt: status.nextPrepareAt
                ? formatDateTime(status.nextPrepareAt, locale.locale)
                : '',
            })
          }}
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            :class="ADMIN_PRIMARY_CLASS"
            :aria-disabled="!mayPrepare || undefined"
            @click="mayPrepare && (isPrepareOpen = true)"
          >
            {{ $t('admin.contests.actions.data.prepare') }}
          </button>
          <a
            v-if="isReady"
            :href="contestDataDownloadUrl(contestKey)"
            download
            :class="ADMIN_BUTTON_CLASS"
            >{{ $t('admin.contests.actions.data.download') }}</a
          >
        </div>
        <p
          v-if="!mayPrepare && status.state !== 'preparing' && status.nextPrepareAt"
          class="text-sm text-muted"
        >
          {{
            $t('admin.contests.actions.data.waitUntil', {
              time: formatDateTime(status.nextPrepareAt, locale.locale),
            })
          }}
        </p>
      </div>
    </QueryState>
    <PrepareDataDialog v-model:visible="isPrepareOpen" :contest-key="contestKey" />
  </section>
</template>
