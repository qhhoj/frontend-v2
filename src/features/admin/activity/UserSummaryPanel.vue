<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed, ref } from 'vue';
import { deleteUserActivity, fetchActivitySummary } from '@/api/activity-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { formatNumber, formatNumericDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { ADMIN_DANGER_CLASS } from '../ui/classes';
import { useAdminMutation } from '../ui/use-admin-mutation';
import DailyBars from './DailyBars.vue';

const props = defineProps<{ username: string; days: number }>();
const emit = defineEmits<{ deleted: [] }>();
const locale = useLocaleStore();
const viewer = useViewerId();

const summary = useQuery({
  queryKey: computed(() => [
    'admin',
    'activity',
    'summary',
    props.username,
    props.days,
    viewer.value,
  ]),
  queryFn: () => fetchActivitySummary(props.username, props.days),
});
const data = computed(() => summary.data.value);

const isConfirmOpen = ref(false);
const removal = useAdminMutation<void, void>({
  mutate: () => deleteUserActivity(props.username),
  invalidates: () => [['admin', 'activity'] as const],
  onDone: () => {
    isConfirmOpen.value = false;
    emit('deleted');
  },
});

const numberOf = (value: number) => formatNumber(value, locale.locale);
const DEVICE_LABEL_KEYS: Record<string, string> = {
  mobile: 'admin.activity.summary.mobile',
  desktop: 'admin.activity.summary.desktop',
};
/** `mobile` and `desktop` read as Vietnamese words; any other device type is shown as the server sent it. */
const deviceText = (deviceType: string) => {
  const key = DEVICE_LABEL_KEYS[deviceType];
  return key ? translate(key) : deviceType;
};
</script>

<template>
  <section data-testid="user-summary" class="min-w-0">
    <SettingsCard :title="$t('admin.activity.summary.heading', { username, days })">
      <QueryState
        :loading="summary.isPending.value"
        :error="summary.error.value"
        @retry="summary.refetch()"
      >
        <template #skeleton><SkeletonBlock class="h-72 w-full" /></template>
        <template v-if="data">
          <p class="text-lg font-semibold">
            {{ $t('admin.activity.summary.total', { total: numberOf(data.total) }) }}
          </p>
          <DailyBars :daily="data.daily" />
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 class="mb-1 text-sm font-semibold">{{ $t('admin.activity.summary.topIps') }}</h3>
              <ul class="flex flex-col gap-1 text-sm">
                <li
                  v-for="entry in data.topIps"
                  :key="entry.value"
                  class="flex justify-between gap-2"
                >
                  <span class="font-mono">{{ entry.value }}</span>
                  <span class="font-mono text-muted">{{ numberOf(entry.count) }}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="mb-1 text-sm font-semibold">
                {{ $t('admin.activity.summary.topPaths') }}
              </h3>
              <ul class="flex flex-col gap-1 text-sm">
                <li
                  v-for="entry in data.topPaths"
                  :key="entry.value"
                  class="flex justify-between gap-2"
                >
                  <span class="break-all font-mono">{{ entry.value }}</span>
                  <span class="font-mono text-muted">{{ numberOf(entry.count) }}</span>
                </li>
              </ul>
            </div>
          </div>
          <h3 class="text-sm font-semibold">{{ $t('admin.activity.summary.sessions') }}</h3>
          <div
            class="overflow-x-auto"
            role="region"
            tabindex="0"
            :aria-label="$t('admin.activity.summary.sessions')"
          >
            <table class="w-full text-left text-sm">
              <thead class="text-muted">
                <tr>
                  <th scope="col" class="py-1 pr-3 font-semibold">
                    {{ $t('admin.activity.summary.sessionIp') }}
                  </th>
                  <th scope="col" class="py-1 pr-3 font-semibold">
                    {{ $t('admin.activity.summary.sessionDevice') }}
                  </th>
                  <th scope="col" class="py-1 pr-3 font-semibold">
                    {{ $t('admin.activity.summary.sessionBrowser') }}
                  </th>
                  <th scope="col" class="py-1 pr-3 font-semibold">
                    {{ $t('admin.activity.summary.sessionCreated') }}
                  </th>
                  <th scope="col" class="py-1 font-semibold">
                    {{ $t('admin.activity.summary.sessionLast') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="session in data.sessions"
                  :key="session.id"
                  class="border-t border-line align-top"
                >
                  <td class="py-2 pr-3 font-mono">{{ session.ip }}</td>
                  <td class="py-2 pr-3">{{ deviceText(session.deviceType) }}</td>
                  <td class="py-2 pr-3">{{ session.browser }} · {{ session.os }}</td>
                  <td class="whitespace-nowrap py-2 pr-3">
                    {{ formatNumericDateTime(session.createdAt, locale.locale) }}
                  </td>
                  <td class="whitespace-nowrap py-2">
                    {{ formatNumericDateTime(session.lastActivityAt, locale.locale) }}
                  </td>
                </tr>
                <tr v-if="data.sessions.length === 0">
                  <td colspan="5" class="py-3 text-muted">
                    {{ $t('admin.activity.summary.noSessions') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="flex justify-end">
            <button type="button" :class="ADMIN_DANGER_CLASS" @click="isConfirmOpen = true">
              {{ $t('admin.activity.summary.delete', { username }) }}
            </button>
          </div>
        </template>
      </QueryState>
    </SettingsCard>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t('admin.activity.confirm.userTitle', { username })"
      :body="$t('admin.activity.confirm.userBody')"
      :confirm-label="$t('admin.activity.confirm.delete')"
      tone="danger"
      :busy="removal.isPending.value"
      @confirm="removal.run()"
    >
      <template #error>
        <AdminStatus
          v-if="removal.failure.value"
          kind="refused"
          :text="failureTextOf(removal.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </section>
</template>
