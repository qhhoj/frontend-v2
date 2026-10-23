<script setup lang="ts">
import { ChevronRight, ExternalLink, Pencil, RefreshCw, RotateCcw } from 'lucide-vue-next';
import { computed, ref, toRef, watch } from 'vue';
import { startPolygonLinkImport, syncPolygonLink } from '@/api/polygon.api';
import type { PolygonImportBody } from '@/api/types/polygon';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import Notice from '@/components/ui/Notice.vue';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import { SYNC_POLYGON } from '../../admin-screens';
import AdminStatus from '../../ui/AdminStatus.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import ImportStepList from '../import/ImportStepList.vue';
import { importRefusalText } from '../import/import-refusal';
import { readImportJob } from '../import/import-reading';
import { useImportJob } from '../import/use-import-job';
import { useImportSteps } from '../import/use-import-steps';
import ImportOutcomeHeader from './ImportOutcomeHeader.vue';
import ImportStepBar from './ImportStepBar.vue';
import ImportSummaryTable from './ImportSummaryTable.vue';
import LocalEditsList from './LocalEditsList.vue';

/**
 * Step 3 (progress option B): the outcome first (header, one segment per step), then its cause and fix or the
 * conversion summary, then its one action: "Thử lại" after a failure that may pass by itself, "Sửa thiết lập" back to the
 * options kept in the wizard (`canEdit`), "Đồng bộ lại" after a post-commit failure or a failed sync that may pass,
 * "Sửa tùy chọn đồng bộ" to the problem's Polygon card when a sync's options failed, "Kiểm tra lại" after polling gave up.
 * A finished sync also says which judging settings it kept as edited on QHHOJ and which it took from the package.
 * A sync answered with the job id already followed (one id per problem and package) is polled again.
 */
const props = defineProps<{ jobId: string; body: PolygonImportBody | null; canEdit: boolean }>();
const emit = defineEmits<{
  started: [jobId: string, body: PolygonImportBody | null];
  edit: [];
  restart: [];
}>();
const locale = useLocaleStore();
const { canAny } = usePermissions();
const { job, phase, failure: pollFailure, stop, recheck } = useImportJob(toRef(props, 'jobId'));
const steps = useImportSteps('polygon', job);
const code = computed(() => job.value?.result?.code ?? job.value?.code ?? props.body?.code ?? '');
/** When the job was last seen: the "Chưa rõ trạng thái" line says how old its step is. */
const lastSeenAt = ref(new Date().toISOString());
watch(job, () => (lastSeenAt.value = new Date().toISOString()));
const reading = computed(() =>
  readImportJob({
    source: 'polygon',
    job: job.value,
    phase: phase.value,
    stop: stop.value,
    code: code.value,
    lastSeenAt: lastSeenAt.value,
    locale: locale.locale,
    can: { retry: !!props.body, edit: props.canEdit, sync: canAny(SYNC_POLYGON) },
  }),
);
const KEY = 'admin.polygonLink.progress';
const kind = computed(() => reading.value.kind);
const action = computed(() => reading.value.action);

const retry = useAdminMutation({
  mutate: (body: PolygonImportBody) => startPolygonLinkImport(body),
  onDone: ({ jobId }, body) => emit('started', jobId, body),
});
const resync = useAdminMutation({
  mutate: (problem: string) => syncPolygonLink(problem),
  onDone: ({ jobId }) => {
    if (jobId === props.jobId) recheck();
    emit('started', jobId, null);
  },
});
const actionFailure = computed(() => retry.failure.value ?? resync.failure.value);
const openTo = computed(() => ({ name: 'admin-problemGeneral', params: { code: code.value } }));
const syncOptionsTo = computed(() => ({
  name: 'admin-problemData',
  params: { code: code.value },
  query: { view: 'advanced' },
}));
</script>

<template>
  <div class="flex max-w-220 flex-col gap-4">
    <Card
      variant="flat"
      class="flex flex-col gap-4 p-4 md:p-5"
      aria-labelledby="import-outcome-title"
      aria-live="polite"
      data-testid="import-outcome"
    >
      <ImportOutcomeHeader :kind="kind" :title="reading.title" :line="reading.line" />
      <ImportStepBar :steps="steps" :attention="kind === 'attention'" />
      <p v-if="reading.hint" class="text-meta text-muted">{{ reading.hint }}</p>

      <div v-if="kind === 'failed'" class="flex flex-col gap-1" data-testid="import-failure">
        <p class="font-semibold">{{ reading.cause }}</p>
        <p class="text-sm">{{ reading.fix }}</p>
        <p v-if="reading.detail" class="font-mono text-meta break-words text-muted">
          {{ $t(`${KEY}.serverSays`, { text: reading.detail }) }}
        </p>
      </div>
      <p v-else-if="kind === 'attention'" class="text-sm">{{ reading.fix }}</p>
      <ImportSummaryTable
        v-else-if="kind === 'done' && job?.result?.summary"
        :summary="job.result.summary"
        :kept="job.result.localEdits?.kept"
      />
      <Notice v-else-if="kind === 'lost'" compact tone="info" :title="$t(`${KEY}.lost.title`)">
        {{ $t(`${KEY}.lost.text`) }}
      </Notice>
      <LocalEditsList
        v-if="(kind === 'done' || kind === 'attention') && job?.result?.localEdits"
        :local-edits="job.result.localEdits"
      />
      <p v-if="pollFailure && !stop" class="text-meta text-muted">
        {{ $t('admin.polygon.progress.pollFailed') }}
      </p>

      <div class="flex flex-wrap gap-2 empty:hidden">
        <AppButton v-if="action === 'open'" tone="primary" :to="openTo">
          <template #icon><ExternalLink aria-hidden="true" class="size-4" /></template>
          {{ $t('admin.polygon.progress.open', { code }) }}
        </AppButton>
        <template v-else-if="action === 'resync'">
          <AppButton tone="primary" :loading="resync.isPending.value" @click="resync.run(code)">
            <template #icon><RefreshCw aria-hidden="true" class="size-4" /></template>
            {{ $t(`${KEY}.resync`, { code }) }}
          </AppButton>
          <AppButton :to="openTo">
            <template #icon><ExternalLink aria-hidden="true" class="size-4" /></template>
            {{ $t('admin.polygon.progress.open', { code }) }}
          </AppButton>
        </template>
        <AppButton
          v-else-if="action === 'retry' && body"
          tone="primary"
          :loading="retry.isPending.value"
          @click="retry.run(body)"
        >
          <template #icon><RotateCcw aria-hidden="true" class="size-4" /></template>
          {{ $t(`${KEY}.retry`) }}
        </AppButton>
        <AppButton v-else-if="action === 'edit'" tone="primary" @click="emit('edit')">
          <template #icon><Pencil aria-hidden="true" class="size-4" /></template>
          {{ $t(`${KEY}.edit`) }}
        </AppButton>
        <AppButton v-else-if="action === 'syncOptions'" tone="primary" :to="syncOptionsTo">
          <template #icon><Pencil aria-hidden="true" class="size-4" /></template>
          {{ $t(`${KEY}.syncOptions`) }}
        </AppButton>
        <AppButton v-else-if="action === 'recheck'" tone="primary" @click="recheck()">
          <template #icon><RefreshCw aria-hidden="true" class="size-4" /></template>
          {{ $t(`${KEY}.recheck`) }}
        </AppButton>
        <AppButton
          v-if="kind !== 'lost' && kind !== 'waiting'"
          :tone="action ? 'ghost' : 'secondary'"
          @click="emit('restart')"
        >
          {{ $t(`${KEY}.another`) }}
        </AppButton>
      </div>

      <details class="group border-t border-line pt-3">
        <summary class="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
          <ChevronRight
            aria-hidden="true"
            class="size-4 text-muted transition-transform group-open:rotate-90"
            :stroke-width="1.75"
          />
          {{ $t(`${KEY}.stepsFold`) }}
        </summary>
        <ImportStepList :steps="steps" :job="job" class="mt-2" />
      </details>
    </Card>
    <AdminStatus v-if="actionFailure" kind="refused" :text="importRefusalText(actionFailure)" />
  </div>
</template>
