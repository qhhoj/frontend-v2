<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { ArrowRight, ChevronRight, Link2 } from 'lucide-vue-next';
import { ApiError } from '@/api/client';
import { syncPolygonLink, unlinkPolygon, updatePolygonLink } from '@/api/polygon.api';
import type { PolygonLink } from '@/api/types/polygon';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { SYNC_POLYGON } from '../../admin-screens';
import AdminChip from '../../ui/AdminChip.vue';
import type { ChipTone } from '../../ui/AdminChip.vue';
import { buttonClass } from '../../ui/controls';
import { needsPermissionText } from '../../ui/permission-text';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import ImportProgress from '../import/ImportProgress.vue';
import { isFinal } from '../import/import-job';
import { importRefusalText } from '../import/import-refusal';
import { useImportJob } from '../import/use-import-job';
import { PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import PackageTypePill from './PackageTypePill.vue';
import PolygonSyncHistory from './PolygonSyncHistory.vue';
import { canSyncNow, linkStatusOf } from './polygon-link';
import type { LinkStatus } from './polygon-link';
import { polygonLinkKey, usePolygonLinkQuery } from './polygon.queries';

/**
 * The data tab's Polygon card, only for a linked problem (404 `polygon_not_linked` hides it): revision in use against
 * the newest package, the last sync and the history for every editor of the test data; "Đồng bộ ngay" after an
 * overwrite warning, the auto-sync switch and unlink only with `judge.sync_polygon_problem` (else one line says so).
 */
const props = defineProps<{ code: string }>();
const locale = useLocaleStore();
const viewer = useViewerId();
const queryClient = useQueryClient();
const { canAny } = usePermissions();
const canSync = computed(() => canAny(SYNC_POLYGON));
const linkQuery = usePolygonLinkQuery(() => props.code);
const state = computed(() => linkQuery.data.value ?? null);
const status = computed(() => (state.value ? linkStatusOf(state.value) : null));
const linkKey = () => polygonLinkKey(props.code, viewer.value);

const STATUS_TONE: Record<LinkStatus, ChipTone> = {
  newer: 'caution',
  upToDate: 'positive',
  syncFailed: 'negative',
  notReady: 'neutral',
  unknown: 'neutral',
};
const dateText = (date: string | null) => (date ? formatDate(date, 'datetime', locale.locale) : '');
const putLink = (link: PolygonLink) =>
  queryClient.setQueryData(linkKey(), state.value ? { ...state.value, link } : undefined);

const syncJobId = ref<string | null>(null);
const isSyncOpen = ref(false);
const sync = useAdminMutation({
  mutate: () => syncPolygonLink(props.code),
  onDone: ({ jobId }) => {
    isSyncOpen.value = false;
    syncJobId.value = jobId;
  },
});
const syncJob = useImportJob(syncJobId);
/** A finished sync changed the link's `lastSync*` and maybe every tab of the problem. */
watch(syncJob.phase, (phase) => {
  if (!phase || !isFinal(phase)) return;
  void queryClient.invalidateQueries({ queryKey: ['admin'] });
  void queryClient.invalidateQueries({ queryKey: PUBLIC_PROBLEMS_KEY });
});
function openSync() {
  sync.reset();
  isSyncOpen.value = true;
}

const autoSync = useAdminMutation({
  mutate: (next: boolean) => updatePolygonLink(props.code, next),
  onSuccess: putLink,
});
const autoSyncModel = computed({
  get: () => state.value?.link.autoSync ?? false,
  set: (next: boolean) => void autoSync.run(next),
});

const isUnlinkOpen = ref(false);
const unlink = useAdminMutation({
  mutate: () => unlinkPolygon(props.code),
  onDone: () => {
    isUnlinkOpen.value = false;
    void queryClient.invalidateQueries({ queryKey: linkKey() });
  },
});
/** Someone changed the link meanwhile: show what it is now. */
watch(unlink.failure, (error) => {
  if (error instanceof ApiError && error.status === 409) void linkQuery.refetch();
});
function openUnlink() {
  unlink.reset();
  isUnlinkOpen.value = true;
}

/** The history is asked for only once opened. */
const isHistoryOpen = ref(false);
const onHistoryToggle = (event: Event) =>
  (isHistoryOpen.value = (event.target as HTMLDetailsElement).open);
</script>

<template>
  <SettingsCard
    v-if="state && status"
    :title="$t('admin.polygonLink.panel.title')"
    data-testid="polygon-link-panel"
  >
    <template #header-end>
      <span class="inline-flex items-center gap-2">
        <Link2 aria-hidden="true" class="size-4 text-muted" />
        <AdminChip :tone="STATUS_TONE[status]">{{
          $t(`admin.polygonLink.panel.status.${status}`)
        }}</AdminChip>
      </span>
    </template>
    <dl class="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <dt class="text-muted">{{ $t('admin.polygonLink.panel.problem') }}</dt>
        <dd v-if="state.link.title" class="font-semibold break-words">{{ state.link.title }}</dd>
        <dd
          class="font-mono break-all"
          :class="state.link.title ? 'text-xs text-muted' : 'font-semibold'"
        >
          {{ state.link.name }} · {{ state.link.problemId }}
        </dd>
      </div>
      <div>
        <dt class="text-muted">{{ $t('admin.polygonLink.source.owner') }}</dt>
        <dd class="font-semibold">{{ state.link.owner }}</dd>
      </div>
      <div>
        <dt class="text-muted">{{ $t('admin.polygonLink.panel.lastSync') }}</dt>
        <dd class="font-semibold">
          {{
            state.link.lastSyncAt
              ? dateText(state.link.lastSyncAt)
              : $t('admin.polygonLink.panel.linkedAt', { date: dateText(state.link.linkedAt) })
          }}
        </dd>
      </div>
      <div>
        <dt class="text-muted">{{ $t('admin.polygonLink.panel.result') }}</dt>
        <dd
          class="font-semibold"
          :class="
            state.link.lastSyncResult === 'ok'
              ? 'text-positive'
              : state.link.lastSyncResult === 'failed'
                ? 'text-negative'
                : ''
          "
        >
          {{
            $t(`admin.polygonLink.panel.results.${state.link.lastSyncResult ?? 'never'}`, {
              revision: state.link.revision,
            })
          }}
        </dd>
      </div>
    </dl>

    <div
      class="flex flex-wrap items-center gap-4 rounded-row border border-line bg-surface-strong p-4"
    >
      <div class="flex items-center gap-3 font-mono">
        <span class="flex flex-col">
          <span class="font-sans text-xs text-muted">{{
            $t('admin.polygonLink.panel.inUse')
          }}</span>
          <span class="text-section leading-7 font-bold">r{{ state.link.revision }}</span>
          <span v-if="state.link.packageCreatedAt" class="font-sans text-xs text-muted">{{
            $t('admin.polygonLink.history.builtAt', {
              date: dateText(state.link.packageCreatedAt),
            })
          }}</span>
        </span>
        <template v-if="state.latestPackage?.revision">
          <ArrowRight aria-hidden="true" class="size-5 text-muted" />
          <span class="flex flex-col">
            <span class="font-sans text-xs text-muted">{{
              $t('admin.polygonLink.panel.latest')
            }}</span>
            <span class="text-section leading-7 font-bold"
              >r{{ state.latestPackage.revision }}</span
            >
            <PackageTypePill class="font-sans" :type="state.latestPackage.type" />
            <span v-if="state.latestPackage.createdAt" class="font-sans text-xs text-muted">{{
              $t('admin.polygonLink.history.builtAt', {
                date: dateText(state.latestPackage.createdAt),
              })
            }}</span>
          </span>
        </template>
      </div>
      <p class="min-w-[min(100%,16rem)] flex-1 text-sm">
        {{
          $t(`admin.polygonLink.panel.revisionText.${status}`, {
            id: state.latestPackage?.id ?? '-',
            revision: state.latestPackage?.revision ?? '-',
            state: state.latestPackage
              ? $t(`admin.polygonLink.packageState.${state.latestPackage.state}`)
              : '-',
            package: state.link.packageId,
          })
        }}
      </p>
    </div>

    <AdminStatus
      v-if="state.link.lastSyncResult === 'failed'"
      kind="refused"
      :text="
        $t('admin.polygonLink.panel.syncFailed', {
          date: dateText(state.link.lastSyncAt),
          reason: state.link.lastSyncError || $t('admin.polygon.progress.failed'),
        })
      "
    />

    <p
      v-if="!canSync"
      class="border-t border-line pt-4 text-meta text-muted"
      data-testid="polygon-link-read-only"
    >
      {{
        $t('admin.polygonLink.panel.autoSyncState', {
          state: $t(`admin.polygonLink.panel.${state.link.autoSync ? 'on' : 'off'}`),
        })
      }}
      ·
      {{ $t('admin.polygonLink.panel.readOnly', { needs: needsPermissionText(SYNC_POLYGON) }) }}
    </p>
    <div v-else class="flex flex-wrap items-center gap-4 border-t border-line pt-4">
      <button
        type="button"
        :class="buttonClass('primary')"
        :aria-disabled="!canSyncNow(state) || undefined"
        :aria-describedby="canSyncNow(state) ? undefined : 'polygon-sync-blocked'"
        @click="canSyncNow(state) && openSync()"
      >
        {{
          state.latestPackage?.revision
            ? $t('admin.polygonLink.panel.syncNowRevision', {
                revision: state.latestPackage.revision,
              })
            : $t('admin.polygonLink.panel.syncNow')
        }}
      </button>
      <AdminSwitch
        v-model="autoSyncModel"
        class="min-w-[min(100%,16rem)] flex-1"
        :label="$t('admin.polygonLink.configure.autoSync')"
        :description="
          $t(
            state.link.autoSync
              ? 'admin.polygonLink.panel.autoSyncOn'
              : 'admin.polygonLink.panel.autoSyncOff',
          )
        "
      />
      <button type="button" :class="buttonClass('danger')" @click="openUnlink">
        {{ $t('admin.polygonLink.panel.unlink') }}
      </button>
    </div>
    <p v-if="canSync && !canSyncNow(state)" id="polygon-sync-blocked" class="text-sm text-muted">
      {{ $t('admin.polygonLink.panel.syncBlocked') }}
    </p>
    <AdminStatus
      v-if="autoSync.failure.value"
      kind="refused"
      :text="failureTextOf(autoSync.failure.value)"
    />

    <details class="group border-t border-line pt-4" @toggle="onHistoryToggle">
      <summary class="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
        <ChevronRight
          aria-hidden="true"
          class="size-4 text-muted transition-transform group-open:rotate-90"
          :stroke-width="1.75"
        />
        {{ $t('admin.polygonLink.history.show') }}
      </summary>
      <PolygonSyncHistory v-if="isHistoryOpen" :code="code" class="mt-3" />
    </details>

    <ImportProgress
      v-if="syncJobId"
      source="polygon"
      :code="code"
      :phase="syncJob.phase.value"
      :job="syncJob.job.value"
      :poll-failure="syncJob.failure.value"
      :stop="syncJob.stop.value"
    />

    <ConfirmDialog
      v-model:visible="isSyncOpen"
      tone="danger"
      :title="$t('admin.polygonLink.panel.syncConfirm.title', { code })"
      :confirm-label="$t('admin.polygonLink.panel.syncConfirm.confirm')"
      :busy="sync.isPending.value"
      @confirm="sync.run(undefined)"
    >
      <div class="flex flex-col gap-2 text-sm">
        <p class="font-semibold">{{ $t('admin.polygonLink.panel.syncConfirm.overwrites') }}</p>
        <p>{{ $t('admin.polygonLink.panel.syncConfirm.lost') }}</p>
        <p class="text-muted">{{ $t('admin.polygonLink.panel.syncConfirm.kept') }}</p>
      </div>
      <template #error>
        <AdminStatus
          v-if="sync.failure.value"
          kind="refused"
          :text="importRefusalText(sync.failure.value)"
        />
      </template>
    </ConfirmDialog>
    <ConfirmDialog
      v-model:visible="isUnlinkOpen"
      tone="danger"
      :title="$t('admin.polygonLink.panel.unlinkConfirm.title', { code })"
      :body="$t('admin.polygonLink.panel.unlinkConfirm.body')"
      :confirm-label="$t('admin.polygonLink.panel.unlinkConfirm.confirm')"
      :busy="unlink.isPending.value"
      @confirm="unlink.run(undefined)"
    >
      <template #error>
        <AdminStatus
          v-if="unlink.failure.value"
          kind="refused"
          :text="failureTextOf(unlink.failure.value)"
        />
      </template>
    </ConfirmDialog>
  </SettingsCard>
</template>
