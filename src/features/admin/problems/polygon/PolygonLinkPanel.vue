<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { ChevronRight, Link2, Unlink } from 'lucide-vue-next';
import { ApiError } from '@/api/client';
import { syncPolygonLink, unlinkPolygon, updatePolygonLink } from '@/api/polygon.api';
import type { Schemas } from '@/api/schemas';
import type { PolygonLink } from '@/api/types/polygon';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import type { ChipTone } from '@/components/ui/Chip.vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminStatus from '../../ui/AdminStatus.vue';
import ImportCheckbox from '../import/ImportCheckbox.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { SYNC_POLYGON } from '../../admin-screens';
import { needsPermissionText } from '../../ui/permission-text';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { isFinal } from '../import/import-job';
import { importRefusalText } from '../import/import-refusal';
import { useImportJob } from '../import/use-import-job';
import { PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import LocalEditsList from './LocalEditsList.vue';
import PolygonLinkBanner from './PolygonLinkBanner.vue';
import PolygonLinkOptionsDrawer from './PolygonLinkOptionsDrawer.vue';
import PolygonSyncHistory from './PolygonSyncHistory.vue';
import { importErrorOf } from '../import/import-errors';
import { bannerActionOf, bannerKindOf } from './polygon-link';
import type { BannerKind } from './polygon-link';
import { linkOptionsLineOf } from './polygon-link-options';
import { polygonLinkKey, usePolygonLinkQuery } from './polygon.queries';

/**
 * The data tab's Polygon card (option C), only for a linked problem (404 `polygon_not_linked` hides it): a status banner
 * with its one action, then the link, the saved options ("Sửa" opens a drawer) and auto-sync on one line each, then the
 * history and unlink. A running sync (started here, or found by its job id after a reload) replaces the action.
 * The sync dialog keeps the settings edited on QHHOJ unless "Ghi đè cả thiết lập…" is ticked (off on every open); a sync
 * that ended here then says which it kept and which it took from the package (the link does not record it).
 * Changing anything needs `judge.sync_polygon_problem`; without it the card only reads.
 */
const props = defineProps<{ code: string }>();
const viewer = useViewerId();
const queryClient = useQueryClient();
const { canAny } = usePermissions();
const canSync = computed(() => canAny(SYNC_POLYGON));
const linkQuery = usePolygonLinkQuery(() => props.code);
const state = computed(() => linkQuery.data.value ?? null);
const linkKey = () => polygonLinkKey(props.code, viewer.value);
/** The saved options skip the package tutorial: a sync leaves the editorial alone. */
const keepsEditorial = computed(() => state.value?.link.options.importTutorial === false);
const putLink = (link: PolygonLink) =>
  queryClient.setQueryData(linkKey(), state.value ? { ...state.value, link } : undefined);

/** The sync started here, else the one the server reports, until it ends (the link is read again then). */
const startedJobId = ref<string | null>(null);
const endedJobId = ref<string | null>(null);
const runningJobId = computed(() => {
  const reported = state.value?.runningJobId ?? null;
  return startedJobId.value ?? (reported !== endedJobId.value ? reported : null);
});
const syncJob = useImportJob(runningJobId);
const isRunning = computed(() => {
  const phase = syncJob.phase.value;
  return !!runningJobId.value && !syncJob.stop.value && !(phase && isFinal(phase));
});
/** What the sync that ended here did with the settings edited on QHHOJ; read before the job id is cleared. */
const lastLocalEdits = ref<Schemas['LocalEditsResponse'] | null>(null);
/** A finished sync changed the link's `lastSync*` and maybe every tab of the problem. */
watch(syncJob.phase, (phase) => {
  if (!phase || !isFinal(phase)) return;
  lastLocalEdits.value = syncJob.job.value?.result?.localEdits ?? null;
  endedJobId.value = runningJobId.value;
  startedJobId.value = null;
  void queryClient.invalidateQueries({ queryKey: ['admin'] });
  void queryClient.invalidateQueries({ queryKey: PUBLIC_PROBLEMS_KEY });
});

/** Options saved since the last sync: the banner asks for a sync to apply them. */
const isSaved = ref(false);
const lastError = computed(() =>
  importErrorOf(
    state.value?.link.lastSyncErrorCode ?? null,
    state.value?.link.lastSyncErrorParams ?? null,
  ),
);
const banner = computed<BannerKind | null>(() =>
  state.value
    ? bannerKindOf(state.value, { isRunning: isRunning.value, isSaved: isSaved.value })
    : null,
);
const action = computed(() =>
  state.value && banner.value && canSync.value
    ? bannerActionOf(banner.value, state.value, lastError.value.kind === 'options')
    : null,
);
const CHIP_TONES: Record<BannerKind, ChipTone> = {
  running: 'info',
  saved: 'info',
  failed: 'danger',
  attention: 'warning',
  newer: 'warning',
  upToDate: 'success',
  notReady: 'neutral',
  unknown: 'neutral',
};

const isSyncOpen = ref(false);
/** Off on every open: overwriting what was edited on QHHOJ is asked for each time. */
const isOverwrite = ref(false);
const sync = useAdminMutation({
  mutate: (overwrite: boolean) => syncPolygonLink(props.code, overwrite),
  onDone: ({ jobId }) => {
    isSyncOpen.value = false;
    isSaved.value = false;
    lastLocalEdits.value = null;
    // One job id per problem and package: the same id as the one followed is polled again.
    if (jobId === runningJobId.value) syncJob.recheck();
    startedJobId.value = jobId;
  },
});
function openSync() {
  sync.reset();
  isOverwrite.value = false;
  isSyncOpen.value = true;
}

/** Each open starts from the saved options: a new key mounts a fresh form. */
const isDrawerOpen = ref(false);
const drawerKey = ref(0);
function openDrawer() {
  drawerKey.value += 1;
  isDrawerOpen.value = true;
}
function onOptionsSaved(link: PolygonLink) {
  putLink(link);
  isSaved.value = true;
  isDrawerOpen.value = false;
}

const autoSync = useAdminMutation({
  mutate: (next: boolean) => updatePolygonLink(props.code, { autoSync: next }),
  onSuccess: putLink,
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
</script>

<template>
  <SettingsCard
    v-if="state && banner"
    :title="$t('admin.polygonLink.panel.title')"
    data-testid="polygon-link-panel"
  >
    <template #header-end>
      <span class="inline-flex items-center gap-2">
        <Link2 aria-hidden="true" class="size-4 text-muted" />
        <Chip :tone="CHIP_TONES[banner]">{{ $t(`admin.polygonLink.panel.status.${banner}`) }}</Chip>
      </span>
    </template>

    <PolygonLinkBanner
      :kind="banner"
      :state="state"
      :job="syncJob.job.value"
      :error="lastError"
      :action="action"
      :busy="sync.isPending.value"
      @sync="openSync"
      @edit-options="openDrawer"
    />
    <LocalEditsList
      v-if="lastLocalEdits && !isRunning"
      :local-edits="lastLocalEdits"
      is-last-sync
    />

    <dl class="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 text-sm">
      <dt class="text-muted">{{ $t('admin.polygonLink.panel.facts.polygon') }}</dt>
      <dd class="font-mono break-words">
        {{ state.link.name }} · {{ state.link.problemId }} · {{ state.link.owner }}
      </dd>
      <dt class="text-muted">{{ $t('admin.polygonLink.panel.facts.options') }}</dt>
      <dd class="flex flex-wrap items-baseline gap-x-2" data-testid="polygon-link-options">
        <span class="min-w-0 break-words">{{ linkOptionsLineOf(state.link.options) }}</span>
        <AppButton
          v-if="canSync"
          tone="ghost"
          size="sm"
          :aria-label="$t('admin.polygonLink.panel.editLabel')"
          @click="openDrawer"
        >
          {{ $t('admin.polygonLink.panel.edit') }}
        </AppButton>
      </dd>
      <dt class="text-muted">{{ $t('admin.polygonLink.panel.facts.autoSync') }}</dt>
      <dd class="flex flex-wrap items-baseline gap-x-2" data-testid="polygon-link-auto-sync">
        <span>{{ $t(`admin.polygonLink.panel.${state.link.autoSync ? 'on' : 'off'}`) }}</span>
        <AppButton
          v-if="canSync"
          tone="ghost"
          size="sm"
          :loading="autoSync.isPending.value"
          @click="autoSync.run(!state.link.autoSync)"
        >
          {{ $t(`admin.polygonLink.panel.${state.link.autoSync ? 'turnOff' : 'turnOn'}`) }}
        </AppButton>
      </dd>
    </dl>
    <AdminStatus
      v-if="autoSync.failure.value"
      kind="refused"
      :text="failureTextOf(autoSync.failure.value)"
    />
    <p v-if="!canSync" class="text-meta text-muted" data-testid="polygon-link-read-only">
      {{ $t('admin.polygonLink.panel.readOnly', { needs: needsPermissionText(SYNC_POLYGON) }) }}
    </p>

    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
      <AppButton
        tone="ghost"
        size="sm"
        :aria-expanded="isHistoryOpen"
        aria-controls="polygon-link-history"
        @click="isHistoryOpen = !isHistoryOpen"
      >
        <template #icon>
          <ChevronRight
            aria-hidden="true"
            class="size-4 text-muted transition-transform"
            :class="isHistoryOpen && 'rotate-90'"
            :stroke-width="1.75"
          />
        </template>
        {{ $t('admin.polygonLink.history.show') }}
      </AppButton>
      <AppButton v-if="canSync" tone="danger" size="sm" @click="openUnlink">
        <template #icon><Unlink aria-hidden="true" class="size-4" /></template>
        {{ $t('admin.polygonLink.panel.unlink') }}
      </AppButton>
    </div>
    <div id="polygon-link-history">
      <PolygonSyncHistory v-if="isHistoryOpen" :code="code" />
    </div>

    <PolygonLinkOptionsDrawer
      v-if="canSync"
      :key="drawerKey"
      v-model:visible="isDrawerOpen"
      :code="code"
      :link="state.link"
      :error="lastError"
      @saved="onOptionsSaved"
    />
    <ConfirmDialog
      v-model:visible="isSyncOpen"
      tone="danger"
      :title="$t('admin.polygonLink.panel.syncConfirm.title', { code })"
      :confirm-label="$t('admin.polygonLink.panel.syncConfirm.confirm')"
      :busy="sync.isPending.value"
      @confirm="sync.run(isOverwrite)"
    >
      <div class="flex flex-col gap-2 text-sm">
        <p class="font-semibold">
          {{
            $t(
              `admin.polygonLink.panel.syncConfirm.${keepsEditorial ? 'overwritesKeepEditorial' : 'overwrites'}`,
            )
          }}
        </p>
        <p>
          {{
            $t(
              `admin.polygonLink.panel.syncConfirm.${keepsEditorial ? 'lostKeepEditorial' : 'lost'}`,
            )
          }}
        </p>
        <p class="text-muted">{{ $t('admin.polygonLink.panel.syncConfirm.kept') }}</p>
        <ImportCheckbox
          v-model="isOverwrite"
          tone="danger"
          class="mt-1 border-t border-line pt-3"
          :label="$t('admin.polygonLink.panel.syncConfirm.overwriteLocal.label')"
          :description="$t('admin.polygonLink.panel.syncConfirm.overwriteLocal.consequence')"
        />
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
