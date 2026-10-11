<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { fetchLiveActivity } from '@/api/activity-admin.api';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber, formatNumericDateTimeSeconds } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { CARD, buttonClass } from '../ui/controls';
import AdminFormSection from '../ui/form/AdminFormSection.vue';

/** Refreshes on its own: a visitor list that is 30 seconds old is still a fair picture of who is online. */
const LIVE_REFRESH_MS = 30_000;

const locale = useLocaleStore();
const viewer = useViewerId();
const page = ref(1);
const live = useQuery({
  queryKey: computed(() => ['admin', 'activity', 'live', page.value, viewer.value]),
  queryFn: () => fetchLiveActivity(page.value),
  refetchInterval: LIVE_REFRESH_MS,
});

const counts = computed(() => live.data.value);
const users = computed(() => counts.value?.users ?? []);
const tiles = computed(() => [
  { key: 'signedIn', value: counts.value?.authenticatedUsers ?? 0 },
  { key: 'guests', value: counts.value?.anonymousVisitors ?? 0 },
  { key: 'bots', value: counts.value?.bots ?? 0 },
]);
const mayHaveNextPage = computed(() => counts.value?.hasMore ?? false);
const numberOf = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <section data-testid="live-visitors" :class="CARD">
    <AdminFormSection
      :title="$t('admin.activity.live.heading')"
      :description="$t('admin.activity.live.window', { minutes: counts?.windowMinutes ?? 0 })"
      :columns="1"
    >
      <QueryState :loading="live.isPending.value" :error="live.error.value" @retry="live.refetch()">
        <template #skeleton><SkeletonBlock class="h-32 w-full" /></template>
        <dl class="m-0 grid grid-cols-3 gap-2">
          <div
            v-for="tile in tiles"
            :key="tile.key"
            class="rounded-cell border border-line bg-surface-solid px-3 py-2"
          >
            <dt class="text-xs text-muted">{{ $t(`admin.activity.live.${tile.key}`) }}</dt>
            <dd class="m-0 font-mono text-lg font-semibold tabular-nums">
              {{ numberOf(tile.value) }}
            </dd>
          </div>
        </dl>
        <ul v-if="users.length > 0" class="m-0 flex list-none flex-col divide-y divide-line p-0">
          <li
            v-for="entry in users"
            :key="entry.user.id"
            class="flex min-h-(--qa-row) flex-wrap items-center justify-between gap-x-2 text-sm"
          >
            <AdminUserLabel :username="entry.user.username" :rating="entry.user.rating" />
            <time :datetime="entry.lastSeenAt" class="font-mono text-xs text-muted tabular-nums">
              {{ formatNumericDateTimeSeconds(entry.lastSeenAt, locale.locale) }}
            </time>
          </li>
        </ul>
        <p v-else class="m-0 text-sm text-muted">{{ $t('admin.activity.live.empty') }}</p>
        <div v-if="page > 1 || mayHaveNextPage" class="flex justify-end gap-2">
          <button
            v-if="page > 1"
            type="button"
            :class="buttonClass('secondary', 'sm')"
            @click="page -= 1"
          >
            {{ $t('admin.activity.live.previousPage') }}
          </button>
          <button
            v-if="mayHaveNextPage"
            type="button"
            :class="buttonClass('secondary', 'sm')"
            @click="page += 1"
          >
            {{ $t('admin.activity.live.nextPage') }}
          </button>
        </div>
      </QueryState>
    </AdminFormSection>
  </section>
</template>
