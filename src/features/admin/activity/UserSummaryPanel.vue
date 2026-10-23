<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { X } from 'lucide-vue-next';
import { computed, ref, useTemplateRef } from 'vue';
import { deleteUserActivity, fetchActivitySummary } from '@/api/activity-admin.api';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useRevealOnMount } from '@/lib/use-reveal-on-mount';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { CARD, buttonClass, iconButtonClass } from '../ui/controls';
import AdminFormSection from '../ui/form/AdminFormSection.vue';
import { useAdminMutation } from '../ui/use-admin-mutation';
import DailyBars from './DailyBars.vue';

const props = defineProps<{ username: string; days: number }>();
const emit = defineEmits<{ deleted: []; close: [] }>();
const panel = useTemplateRef<HTMLElement>('panel');
useRevealOnMount(panel);
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
  successText: () => translate('admin.activity.toast.userDeleted', { username: props.username }),
  onDone: () => {
    isConfirmOpen.value = false;
    emit('deleted');
  },
});

const numberOf = (value: number) => formatNumber(value, locale.locale);
const timeOf = (value: string) => formatDate(value, 'datetime', locale.locale);
const DEVICE_LABEL_KEYS: Record<string, string> = {
  mobile: 'admin.activity.summary.mobile',
  desktop: 'admin.activity.summary.desktop',
};
/** `mobile` and `desktop` read as Vietnamese words; any other device type is shown as the server sent it. */
const deviceText = (deviceType: string) => {
  const key = DEVICE_LABEL_KEYS[deviceType];
  return key ? translate(key) : deviceType;
};
const tops = computed(() =>
  data.value
    ? [
        { key: 'topIps', entries: data.value.topIps },
        { key: 'topPaths', entries: data.value.topPaths },
      ]
    : [],
);
</script>

<template>
  <section
    ref="panel"
    data-testid="user-summary"
    :class="[CARD, 'relative min-w-0 scroll-mt-20 @container']"
  >
    <button
      type="button"
      :class="[iconButtonClass('ghost', 'sm'), 'absolute top-3 right-3']"
      :aria-label="$t('admin.activity.summary.close')"
      :title="$t('admin.activity.summary.close')"
      @click="emit('close')"
    >
      <X aria-hidden="true" class="size-4" :stroke-width="1.75" />
    </button>
    <AdminFormSection
      class="pr-12"
      :title="$t('admin.activity.summary.heading', { username, days })"
      :columns="1"
    >
      <QueryState
        :loading="summary.isPending.value"
        :error="summary.error.value"
        @retry="summary.refetch()"
      >
        <template #skeleton><SkeletonBlock class="h-72 w-full" /></template>
        <template v-if="data">
          <p class="m-0 text-subtitle leading-7 font-semibold tabular-nums">
            {{ $t('admin.activity.summary.total', { total: numberOf(data.total) }) }}
          </p>
          <DailyBars :daily="data.daily" />
          <div class="grid gap-4 @md:grid-cols-2">
            <div v-for="top in tops" :key="top.key" class="min-w-0">
              <h3 class="mb-1 text-sm font-semibold">
                {{ $t(`admin.activity.summary.${top.key}`) }}
              </h3>
              <ul class="m-0 flex list-none flex-col gap-1 p-0 text-sm">
                <li
                  v-for="entry in top.entries"
                  :key="entry.value"
                  class="flex justify-between gap-2"
                >
                  <span class="min-w-0 font-mono break-all">{{ entry.value }}</span>
                  <span class="font-mono text-muted tabular-nums">{{ numberOf(entry.count) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </template>
      </QueryState>
    </AdminFormSection>
    <AdminFormSection v-if="data" :title="$t('admin.activity.summary.sessions')" :columns="1">
      <ul
        v-if="data.sessions.length > 0"
        class="m-0 flex list-none flex-col divide-y divide-line p-0 text-sm"
      >
        <li v-for="session in data.sessions" :key="session.id" class="flex flex-col gap-0.5 py-2">
          <span class="flex flex-wrap items-baseline justify-between gap-x-2">
            <span class="font-mono font-semibold">{{ session.ip }}</span>
            <span class="text-muted">{{ deviceText(session.deviceType) }}</span>
          </span>
          <span>{{ session.browser }} · {{ session.os }}</span>
          <span class="font-mono text-xs text-muted tabular-nums">
            {{
              $t('admin.activity.summary.sessionSpan', {
                created: timeOf(session.createdAt),
                last: timeOf(session.lastActivityAt),
              })
            }}
          </span>
        </li>
      </ul>
      <p v-else class="m-0 text-sm text-muted">{{ $t('admin.activity.summary.noSessions') }}</p>
    </AdminFormSection>
    <AdminFormSection
      v-if="data"
      :title="$t('admin.activity.summary.dangerTitle')"
      :description="$t('admin.activity.confirm.userBody')"
      :columns="1"
      danger
    >
      <div>
        <button type="button" :class="buttonClass('danger')" @click="isConfirmOpen = true">
          {{ $t('admin.activity.summary.delete', { username }) }}
        </button>
      </div>
    </AdminFormSection>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t('admin.activity.confirm.userTitle', { username })"
      :body="$t('admin.activity.confirm.userBody')"
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
