<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatAgo, formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import { ADMIN_SCREENS, adminRouteName } from '../admin-screens';
import { CARD } from '../ui/controls';
import { priorityKey, queueAlerts } from './queue-health';
import { JUDGE_POLL_MS, useJudgeQueueQuery } from './queue.queries';

/** Legacy judge status page: what waits, at which priority, and whether a judge can drain it. */
const { data, isPending, error, refetch } = useJudgeQueueQuery();
const locale = useLocaleStore();
/** The judges screen and the submission list need different permissions: link only for staff who can open the list. */
const { canAny } = usePermissions();
const canOpenList = computed(() => canAny(ADMIN_SCREENS.submissions.permission));
const now = useNow(JUDGE_POLL_MS);
const alerts = computed(() => (data.value ? queueAlerts(data.value, now.value) : []));
const tiles = computed(() => {
  const queue = data.value;
  if (!queue) return [];
  return [
    { key: 'queued', value: formatNumber(queue.queued, locale.locale) },
    { key: 'processing', value: formatNumber(queue.processing, locale.locale) },
    { key: 'grading', value: formatNumber(queue.grading, locale.locale) },
    {
      key: 'oldest',
      value: queue.oldestQueuedSince
        ? formatAgo(queue.oldestQueuedSince, now.value, locale.locale)
        : '—',
    },
  ];
});
const largest = computed(() =>
  Math.max(1, ...(data.value?.byPriority ?? []).map((row) => row.count)),
);
</script>

<template>
  <section
    data-testid="judge-queue"
    :class="[CARD, 'flex flex-col gap-4 p-5']"
    aria-labelledby="judge-queue-title"
  >
    <header class="flex flex-wrap items-center gap-3">
      <h2 id="judge-queue-title" class="font-display text-base font-bold">
        {{ $t('admin.judges.queue.title') }}
      </h2>
      <RouterLink
        v-if="canOpenList"
        :to="{ name: adminRouteName('submissions'), query: { status: 'QU' } }"
        class="ml-auto text-sm font-semibold text-accent-text underline"
      >
        {{ $t('admin.judges.queue.openQueued') }}
      </RouterLink>
    </header>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock class="h-16 w-full" />
      </template>
      <dl class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div v-for="tile in tiles" :key="tile.key">
          <dt class="text-sm text-muted">{{ $t(`admin.judges.queue.${tile.key}`) }}</dt>
          <dd class="font-display text-2xl font-semibold">{{ tile.value }}</dd>
        </div>
      </dl>
      <ul v-if="alerts.length" role="alert" class="flex flex-col gap-2">
        <li
          v-for="alert in alerts"
          :key="alert.kind + alert.subject"
          class="rounded-row border border-negative p-3 text-sm text-negative"
        >
          {{
            $t(`admin.judges.queue.alerts.${alert.kind}`, {
              subject: alert.subject,
              count: alert.count,
            })
          }}
        </li>
      </ul>
      <div v-if="data" class="grid gap-5 md:grid-cols-2">
        <section aria-labelledby="queue-priority">
          <h3 id="queue-priority" class="mb-2 text-sm font-semibold">
            {{ $t('admin.judges.queue.byPriority') }}
          </h3>
          <p v-if="!data.byPriority.length" class="text-sm text-muted">
            {{ $t('admin.judges.queue.empty') }}
          </p>
          <ul class="flex flex-col gap-2 text-sm">
            <li v-for="row in data.byPriority" :key="row.priority" class="flex flex-col gap-1">
              <span class="flex justify-between gap-3">
                <span>{{ $t(`admin.judges.queue.priority.${priorityKey(row.priority)}`) }}</span>
                <span class="font-mono">{{ formatNumber(row.count, locale.locale) }}</span>
              </span>
              <span class="h-1.5 rounded-pill bg-surface-hover" aria-hidden="true">
                <span
                  class="block h-full rounded-pill bg-accent"
                  :style="{ width: `${(row.count / largest) * 100}%` }"
                />
              </span>
            </li>
          </ul>
        </section>
        <section aria-labelledby="queue-language">
          <h3 id="queue-language" class="mb-2 text-sm font-semibold">
            {{ $t('admin.judges.queue.byLanguage') }}
          </h3>
          <p v-if="!data.byLanguage.length" class="text-sm text-muted">
            {{ $t('admin.judges.queue.empty') }}
          </p>
          <ul class="flex flex-col divide-y divide-line text-sm">
            <li
              v-for="row in data.byLanguage"
              :key="row.id"
              class="flex justify-between gap-3 py-1.5"
            >
              <span>{{ row.name ?? row.id }}</span>
              <span class="flex gap-3">
                <span class="font-mono">{{ formatNumber(row.count, locale.locale) }}</span>
                <span
                  :class="row.onlineJudges === 0 ? 'font-semibold text-negative' : 'text-muted'"
                >
                  {{ $t('admin.judges.queue.judgesOnline', { count: row.onlineJudges }) }}
                </span>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </QueryState>
  </section>
</template>
