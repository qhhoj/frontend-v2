<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { contestDataDownloadUrl, fetchContestData } from '@/api/contest-editing.api';
import QueryState from '@/components/QueryState.vue';
import { formatDateTime, formatFileSize } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import AdminBit from '../../shell/AdminBit.vue';
import { CARD, buttonClass } from '../../ui/controls';
import { canPrepareAgain } from './contest-actions';
import PrepareDataDialog from './PrepareDataDialog.vue';
import { isNotFound } from '../../ui/admin-errors';

const props = defineProps<{ contestKey: string; isEnded: boolean }>();
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
  /** The backend refuses (409) until the contest has ended, so asking earlier would only show an error. */
  enabled: computed(() => props.isEnded),
  /** Polls only while the export is being prepared, so the link appears without a reload. */
  refetchInterval: (query) => (query.state.data?.state === 'preparing' ? 5000 : false),
});
const mayPrepare = computed(() =>
  status.value ? canPrepareAgain(status.value, now.value) : false,
);
/** A 404 means this install has no export root. */
const isNotConfigured = computed(() => isNotFound(error.value));
const isReady = computed(() => status.value?.state === 'ready');
</script>

<template>
  <section :class="[CARD, 'flex flex-col gap-4 p-5']">
    <header class="flex flex-col gap-1">
      <h3 class="m-0 text-base font-semibold">
        {{ $t('admin.contests.actions.data.title') }}
      </h3>
      <p class="text-sm text-muted">{{ $t('admin.contests.actions.data.description') }}</p>
    </header>
    <p v-if="!isEnded" class="text-sm text-muted">
      {{ $t('admin.contests.actions.data.notEnded') }}
    </p>
    <p v-else-if="isNotConfigured" class="text-sm text-muted">
      {{ $t('admin.contests.actions.data.notConfigured') }}
    </p>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
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
            :class="buttonClass('primary')"
            :aria-disabled="!mayPrepare || undefined"
            @click="mayPrepare && (isPrepareOpen = true)"
          >
            {{ $t('admin.contests.actions.data.prepare') }}
          </button>
          <a
            v-if="isReady"
            :href="contestDataDownloadUrl(contestKey)"
            download
            :class="buttonClass('secondary')"
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
    <PrepareDataDialog v-if="isEnded" v-model:visible="isPrepareOpen" :contest-key="contestKey" />
  </section>
</template>
