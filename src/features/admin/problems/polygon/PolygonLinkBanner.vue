<script setup lang="ts">
import { Pencil, RefreshCw } from 'lucide-vue-next';
import { computed } from 'vue';
import type { PolygonLinkState } from '@/api/types/polygon';
import type { ImportJob } from '@/api/types/problem-imports';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import type { NoticeTone } from '@/components/ui/Notice.vue';
import { translate } from '@/i18n';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { queueLinesOf, runningLineOf } from './import-outcome';
import type { ImportErrorText } from './polygon-import-errors';
import type { BannerKind } from './polygon-link';

/**
 * The link panel's first row (option C): the link's state in words and its one action, "Đồng bộ ngay" / "Đồng bộ lại"
 * or "Sửa tùy chọn" when the options caused the failure; none while a sync runs.
 */
const props = defineProps<{
  kind: BannerKind;
  state: PolygonLinkState;
  /** The running sync, once its first state arrived. */
  job: ImportJob | null;
  /** The last sync's failure, translated. */
  error: ImportErrorText;
  action: 'sync' | 'editOptions' | null;
  busy: boolean;
}>();
const emit = defineEmits<{ sync: []; editOptions: [] }>();
const locale = useLocaleStore();

const TONES: Record<BannerKind, NoticeTone> = {
  running: 'info',
  saved: 'info',
  failed: 'danger',
  attention: 'warning',
  newer: 'warning',
  upToDate: 'success',
  notReady: 'info',
  unknown: 'info',
};
const KEY = 'admin.polygonLink.panel.banner';
const dateText = (date: string | null | undefined) =>
  date ? formatDate(date, 'datetime', locale.locale) : '';

function runningText() {
  const job = props.job;
  if (!job || job.step === 'queued') return queueLinesOf(job?.queuePosition ?? null).place;
  return runningLineOf(job);
}
function upToDateText() {
  const { lastSyncAt, linkedAt } = props.state.link;
  return lastSyncAt
    ? translate(`${KEY}.upToDate.text`, { date: dateText(lastSyncAt) })
    : translate('admin.polygonLink.panel.linkedAt', { date: dateText(linkedAt) });
}
const packageState = () =>
  translate(`admin.polygonLink.packageState.${props.state.latestPackage?.state ?? 'NONE'}`);
const TEXTS: Record<BannerKind, () => string> = {
  running: runningText,
  saved: () => translate(`${KEY}.saved.text`),
  failed: () => `${props.error.title}. ${props.error.fix}`,
  attention: () => props.error.fix,
  newer: () =>
    translate(`${KEY}.newer.text`, { date: dateText(props.state.latestPackage?.createdAt) }),
  upToDate: upToDateText,
  notReady: () =>
    translate('admin.polygonLink.panel.revisionText.notReady', { state: packageState() }),
  unknown: () => translate('admin.polygonLink.panel.revisionText.unknown'),
};
const title = computed(() =>
  translate(`${KEY}.${props.kind}.title`, {
    revision: props.state.link.revision,
    latest: props.state.latestPackage?.revision ?? '',
  }),
);
const syncLabel = computed(() =>
  translate(`admin.polygonLink.panel.${props.kind === 'newer' ? 'syncNow' : 'syncAgain'}`),
);
</script>

<template>
  <Notice
    compact
    :tone="TONES[kind]"
    :title="title"
    :role="kind === 'running' ? 'status' : null"
    :data-banner="kind"
  >
    <p class="break-words">{{ TEXTS[kind]() }}</p>
    <template #action>
      <AppButton
        v-if="action === 'sync'"
        tone="primary"
        class="mt-2"
        :loading="busy"
        @click="emit('sync')"
      >
        <template #icon><RefreshCw aria-hidden="true" class="size-4" /></template>
        {{ syncLabel }}
      </AppButton>
      <AppButton
        v-else-if="action === 'editOptions'"
        tone="primary"
        class="mt-2"
        @click="emit('editOptions')"
      >
        <template #icon><Pencil aria-hidden="true" class="size-4" /></template>
        {{ $t('admin.polygonLink.panel.editOptions') }}
      </AppButton>
    </template>
  </Notice>
</template>
