<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import { ADMIN_BUTTON_CLASS } from '../../ui/classes';
import PolygonConfigureStep from './PolygonConfigureStep.vue';
import PolygonLinkStep from './PolygonLinkStep.vue';
import PolygonNotConnected from './PolygonNotConnected.vue';
import PolygonProgressStep from './PolygonProgressStep.vue';
import PolygonSyncHistory from './PolygonSyncHistory.vue';
import WizardStepper from './WizardStepper.vue';
import { initialWizardState, wizardReducer } from './polygon-wizard';
import type { WizardEvent } from './polygon-wizard';
import { usePolygonStatusQuery } from './polygon.queries';

/**
 * Board I2 with step 1 as board W1: paste a problem link, configure it, follow the import. The job id rides in `?job=`, so a reload (or a link)
 * reopens the progress step.
 */
const route = useRoute();
const router = useRouter();
const status = usePolygonStatusQuery();
const queryJob = typeof route.query.job === 'string' ? route.query.job : null;
const state = ref(initialWizardState(queryJob));
const accountName = computed(() => status.data.value?.accountName ?? '');
/** Every problem's history names every problem, so the server asks for `judge.edit_all_problem`; asked for once opened. */
const { can } = usePermissions();
const isHistoryOpen = ref(false);
const onHistoryToggle = (event: Event) =>
  (isHistoryOpen.value = (event.target as HTMLDetailsElement).open);

/** The sidebar link (no `?job=`) or a pasted job link reuses this page: the URL decides the step then. */
watch(
  () => route.query.job,
  (job) => {
    const current = state.value.step === 'progress' ? state.value.jobId : undefined;
    if (job !== current) state.value = initialWizardState(typeof job === 'string' ? job : null);
  },
);

function send(event: WizardEvent) {
  state.value = wizardReducer(state.value, event);
  const job = state.value.step === 'progress' ? state.value.jobId : undefined;
  if (job !== route.query.job) void router.replace({ query: job ? { job } : {} });
}

const TITLE_KEYS = {
  link: 'admin.polygonLink.wizard.title',
  configure: 'admin.polygonLink.configure.title',
  progress: 'admin.polygonLink.progress.title',
} as const;
const LEAD_KEYS = {
  link: 'admin.polygonLink.wizard.lead',
  configure: 'admin.polygonLink.configure.lead',
  progress: 'admin.polygonLink.progress.lead',
} as const;
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :crumbs="[{ label: $t('admin.shell.groups.content') }]"
      :title="$t(TITLE_KEYS[state.step])"
      :lead="$t(LEAD_KEYS[state.step], { account: accountName || 'qhhoj' })"
    >
      <template #actions>
        <span
          class="self-center rounded-pill bg-surface-strong px-2.5 py-1 font-mono text-xs text-muted"
        >
          {{
            $t('admin.polygon.form.permissionChip', { permission: 'judge.import_polygon_package' })
          }}
        </span>
        <RouterLink :to="{ name: 'admin-problemImport' }" :class="ADMIN_BUTTON_CLASS">{{
          $t('admin.polygonLink.wizard.zipFile')
        }}</RouterLink>
      </template>
    </AdminPageHeader>
    <WizardStepper :current="state.step" />

    <PolygonProgressStep
      v-if="state.step === 'progress'"
      :key="state.jobId"
      :job-id="state.jobId"
      :body="state.body"
      @started="(jobId, body) => send({ type: 'started', jobId, body })"
      @restart="send({ type: 'restart' })"
    />
    <QueryState
      v-else
      :loading="status.isPending.value"
      :error="status.error.value"
      @retry="status.refetch()"
    >
      <template #skeleton>
        <SkeletonBlock data-skeleton-region="polygon-status" class="h-96 w-full rounded-card" />
      </template>
      <PolygonNotConnected v-if="status.data.value && !status.data.value.connected" />
      <PolygonLinkStep
        v-else-if="state.step === 'link'"
        :account-name="accountName"
        :initial-link="state.link"
        @resolved="(link, problem) => send({ type: 'resolved', link, problem })"
      />
      <PolygonConfigureStep
        v-else
        :link="state.link"
        :problem="state.problem"
        @back="send({ type: 'back' })"
        @started="(jobId, body) => send({ type: 'started', jobId, body })"
      />
    </QueryState>
    <details
      v-if="state.step === 'link' && can('judge.edit_all_problem')"
      class="glass rounded-panel p-5"
      data-testid="polygon-all-syncs"
      @toggle="onHistoryToggle"
    >
      <summary class="min-h-11 cursor-pointer font-semibold">
        {{ $t('admin.polygonLink.history.showAll') }}
      </summary>
      <PolygonSyncHistory v-if="isHistoryOpen" :code="null" class="mt-3" />
    </details>
  </div>
</template>
