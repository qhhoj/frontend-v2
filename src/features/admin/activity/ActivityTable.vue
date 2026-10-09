<script setup lang="ts">
import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchActivityLogs } from '@/api/activity-admin.api';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumericDateTimeSeconds } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminBit from '../shell/AdminBit.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { toActivityRequest } from './activity';
import type { ActivityFilter } from './activity';

const props = defineProps<{ filter: ActivityFilter }>();
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const viewer = useViewerId();
/** Backend `@Max(200)` on `page`: a request for page 201 is a 400. */
const MAX_ACTIVITY_PAGE = 200;
const page = ref(1);

const request = computed(() => ({ ...toActivityRequest(props.filter), page: page.value }));
const logs = useQuery({
  queryKey: computed(() => ['admin', 'activity', 'logs', request.value, viewer.value]),
  queryFn: () => fetchActivityLogs(request.value),
  placeholderData: keepPreviousData,
});

/** A new filter starts at the first page; the previous rows stay on screen until the new ones arrive. */
watch(
  () => JSON.stringify(props.filter),
  () => {
    page.value = 1;
  },
);

const rows = computed(() => logs.data.value?.items ?? []);
const meta = computed(() => logs.data.value?.meta);

/** A name opens that user's summary beside the table; the rest of the URL (the filter) stays. */
function openSummary(username: string) {
  void router.replace({ query: { ...route.query, summary: username } });
}

const isErrorStatus = (statusCode: number) => statusCode >= 400;
</script>

<template>
  <section data-testid="activity-table" class="flex min-w-0 flex-col gap-3">
    <QueryState :loading="logs.isPending.value" :error="logs.error.value" @retry="logs.refetch()">
      <template #skeleton
        ><SkeletonBlock
          data-skeleton-region="activity-table"
          class="h-[63rem] w-full sm:h-[13.8rem]"
      /></template>
      <div
        class="overflow-x-auto rounded-row border border-line"
        role="region"
        tabindex="0"
        :aria-label="$t('admin.activity.table.caption')"
      >
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            {{
              $t('admin.activity.table.caption')
            }}
          </caption>
          <thead class="bg-surface-solid text-muted">
            <tr>
              <th scope="col" class="px-3 py-2 font-semibold">
                {{ $t('admin.activity.table.at') }}
              </th>
              <th scope="col" class="px-3 py-2 font-semibold">
                {{ $t('admin.activity.table.user') }}
              </th>
              <th scope="col" class="px-3 py-2 font-semibold">
                {{ $t('admin.activity.table.ip') }}
              </th>
              <th scope="col" class="px-3 py-2 font-semibold">
                {{ $t('admin.activity.table.request') }}
              </th>
              <th scope="col" class="px-3 py-2 font-semibold">
                {{ $t('admin.activity.table.status') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-t border-line align-top">
              <td class="whitespace-nowrap px-3 py-2">
                {{ formatNumericDateTimeSeconds(row.at, locale.locale) }}
              </td>
              <td class="px-3 py-2">
                <button
                  v-if="row.username"
                  type="button"
                  class="min-h-11 max-w-full text-left"
                  @click="openSummary(row.username)"
                >
                  <AdminUserLabel :username="row.username" :link="false" />
                </button>
                <span v-else class="text-muted">{{ $t('admin.activity.table.guest') }}</span>
              </td>
              <td class="px-3 py-2 font-mono">{{ row.ip }}</td>
              <td class="px-3 py-2 font-mono break-all">{{ row.method }} {{ row.path }}</td>
              <td
                class="px-3 py-2 font-mono"
                :class="isErrorStatus(row.statusCode) ? 'text-negative' : ''"
              >
                {{ row.statusCode }}
              </td>
            </tr>
            <tr v-if="rows.length === 0">
              <td colspan="5" class="px-3 py-6 text-center text-muted">
                <AdminBit placement="empty" />
                {{ $t('admin.activity.table.empty') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav class="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span class="text-muted">{{ $t('admin.activity.table.page', { page }) }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            :class="ADMIN_BUTTON_CLASS"
            :disabled="page <= 1"
            @click="page -= 1"
          >
            {{ $t('admin.activity.table.previous') }}
          </button>
          <button
            v-if="meta?.hasMore && page < MAX_ACTIVITY_PAGE"
            type="button"
            :class="ADMIN_BUTTON_CLASS"
            @click="page += 1"
          >
            {{ $t('admin.activity.table.next') }}
          </button>
        </div>
      </nav>
    </QueryState>
  </section>
</template>
