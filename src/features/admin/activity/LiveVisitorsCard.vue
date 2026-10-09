<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { fetchLiveActivity } from '@/api/activity-admin.api';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { formatNumber, formatNumericDateTimeSeconds } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminBit from '../shell/AdminBit.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { ACTIVITY_PAGE_SIZE } from './activity';

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
const isAnyoneOnline = computed(() => {
  const data = counts.value;
  return data !== undefined && data.authenticatedUsers + data.anonymousVisitors > 0;
});
/** The live endpoint sends no page metadata: a full page means there may be another. */
const mayHaveNextPage = computed(() => users.value.length === ACTIVITY_PAGE_SIZE);
const numberOf = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <SettingsCard :title="$t('admin.activity.live.heading')">
    <template #header-end>
      <AdminBit v-if="isAnyoneOnline" placement="queued" />
    </template>
    <QueryState :loading="live.isPending.value" :error="live.error.value" @retry="live.refetch()">
      <template #skeleton><SkeletonBlock class="h-32 w-full" /></template>
      <p class="text-sm text-muted">
        {{ $t('admin.activity.live.window', { minutes: counts?.windowMinutes ?? 0 }) }}
      </p>
      <dl class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-row bg-surface-solid p-2">
          <dt class="text-xs text-muted">{{ $t('admin.activity.live.signedIn') }}</dt>
          <dd class="font-mono text-lg font-semibold">
            {{ numberOf(counts?.authenticatedUsers ?? 0) }}
          </dd>
        </div>
        <div class="rounded-row bg-surface-solid p-2">
          <dt class="text-xs text-muted">{{ $t('admin.activity.live.guests') }}</dt>
          <dd class="font-mono text-lg font-semibold">
            {{ numberOf(counts?.anonymousVisitors ?? 0) }}
          </dd>
        </div>
        <div class="rounded-row bg-surface-solid p-2">
          <dt class="text-xs text-muted">{{ $t('admin.activity.live.bots') }}</dt>
          <dd class="font-mono text-lg font-semibold">{{ numberOf(counts?.bots ?? 0) }}</dd>
        </div>
      </dl>
      <ul v-if="users.length > 0" class="flex flex-col gap-2">
        <li
          v-for="entry in users"
          :key="entry.user.id"
          class="flex flex-wrap items-center justify-between gap-2 text-sm"
        >
          <AdminUserLabel :username="entry.user.username" />
          <time :datetime="entry.lastSeenAt" class="font-mono text-muted">
            {{ formatNumericDateTimeSeconds(entry.lastSeenAt, locale.locale) }}
          </time>
        </li>
      </ul>
      <p v-else class="text-sm text-muted">{{ $t('admin.activity.live.empty') }}</p>
      <div v-if="mayHaveNextPage" class="flex justify-end">
        <button type="button" :class="ADMIN_BUTTON_CLASS" @click="page += 1">
          {{ $t('admin.activity.live.nextPage') }}
        </button>
      </div>
    </QueryState>
  </SettingsCard>
</template>
