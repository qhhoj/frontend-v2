<script setup lang="ts">
import { computed, ref } from 'vue';
import { updateContest } from '@/api/contest-editing.api';
import { publishProblems } from '@/api/contest-ops.api';
import type { ContestActions, EditableContest } from '@/api/types/contest-editing';
import type { PublishOptions, PublishProblemsResult } from '@/api/types/contest-ops';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { translate } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { ADMIN_BUTTON_CLASS, ADMIN_DANGER_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { editableContestKey } from '../contest-editing.queries';
import { contestActionsKey } from '../contest-ops.queries';
import PublishResultTable from './PublishResultTable.vue';
import { autoReasonKey, mayPublishAfter, publishSummary } from './publish-outcomes';
import type { DryRunChoice } from './publish-outcomes';

const props = defineProps<{ contest: EditableContest; actions: ContestActions | undefined }>();
const viewer = useViewerId();
const locale = useLocaleStore();
const withEditorials = ref(true);
const dryRun = ref<DryRunChoice | null>(null);
/** What the table shows: the last dry run or the last real run. */
const shown = ref<PublishProblemsResult | null>(null);
const isConfirmOpen = ref(false);
const hasEnded = computed(() => props.contest.phase === 'ended');
const mayPublish = computed(() => mayPublishAfter(dryRun.value, withEditorials.value));
const summary = computed(() => (shown.value ? publishSummary(shown.value.items) : null));

const run = useAdminMutation({
  mutate: (options: PublishOptions) => publishProblems(props.contest.key, options),
  invalidates: (options) =>
    options.dryRun ? [] : [contestActionsKey(props.contest.key, viewer.value), ['problems']],
  onDone: (result, options) => {
    shown.value = result;
    dryRun.value = options.dryRun ? { editorials: options.editorials, result } : null;
    if (!options.dryRun) isConfirmOpen.value = false;
  },
});
/** The switch saves at once; the editor read and the actions status follow. */
const autoSwitch = useAdminMutation({
  mutate: (isOn: boolean) => updateContest(props.contest.key, { publishAfterEnd: isOn }),
  invalidates: () => [
    editableContestKey(props.contest.key, viewer.value),
    contestActionsKey(props.contest.key, viewer.value),
  ],
});
const isAutoOn = computed({
  get: () => props.contest.settings?.publishAfterEnd ?? false,
  set: (isOn: boolean) => void autoSwitch.run(isOn),
});
const runDry = () => run.run({ editorials: withEditorials.value, dryRun: true });
const runReal = () => run.run({ editorials: withEditorials.value, dryRun: false });
const openConfirm = () => {
  if (!mayPublish.value) return;
  run.reset();
  isConfirmOpen.value = true;
};

const isScheduled = computed(() => (props.actions?.publish ?? 'idle') !== 'idle');
const autoOutcome = computed(() => props.actions?.autoPublish ?? null);
const autoText = computed(() => {
  const outcome = autoOutcome.value;
  if (!outcome) return null;
  const at = formatDateTime(outcome.at, locale.locale);
  if (outcome.status === 'published') {
    return translate('admin.contestPublish.auto.published', { ...outcome, at });
  }
  return translate('admin.contestPublish.auto.failed', {
    at,
    reason: translate(autoReasonKey(outcome.reason)),
  });
});
const summaryText = computed(() =>
  translate(shown.value?.dryRun ? 'admin.contestPublish.summary' : 'admin.contestPublish.done', {
    ...summary.value,
  }),
);
</script>

<template>
  <section data-testid="publish-card" class="glass flex flex-col gap-4 rounded-panel p-5">
    <header class="flex flex-col gap-1">
      <h3 class="font-display text-lg font-semibold">{{ $t('admin.contestPublish.title') }}</h3>
      <p class="text-sm text-muted">{{ $t('admin.contestPublish.description') }}</p>
    </header>
    <AdminSwitch
      v-model="isAutoOn"
      :label="$t('admin.contestPublish.autoLabel')"
      :description="$t('admin.contestPublish.autoHint')"
    />
    <AdminStatus
      v-if="isScheduled"
      kind="queued"
      :text="$t('admin.contestPublish.auto.scheduled')"
    />
    <AdminStatus
      v-if="autoText"
      :kind="autoOutcome?.status === 'published' ? 'done' : 'refused'"
      :text="autoText"
    />
    <AdminStatus
      v-if="autoSwitch.failure.value"
      kind="refused"
      :text="failureTextOf(autoSwitch.failure.value)"
    />
    <p v-if="!hasEnded" class="text-sm text-muted">{{ $t('admin.contestPublish.notEnded') }}</p>
    <template v-else>
      <label class="flex min-h-11 items-center gap-3 font-semibold">
        <input v-model="withEditorials" type="checkbox" class="size-5" />
        {{ $t('admin.contestPublish.withEditorials') }}
      </label>
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-busy="run.isPending.value || undefined"
          @click="runDry"
        >
          {{ $t('admin.contestPublish.dryRun') }}
        </button>
        <button
          type="button"
          :class="ADMIN_DANGER_CLASS"
          :aria-disabled="!mayPublish || undefined"
          @click="openConfirm"
        >
          {{ $t('admin.contestPublish.publish') }}
        </button>
      </div>
      <p v-if="!mayPublish" class="text-sm text-muted">
        {{ $t('admin.contestPublish.dryRunFirst') }}
      </p>
      <AdminStatus
        v-if="run.isPending.value"
        kind="queued"
        :text="$t('admin.contestPublish.running')"
      />
      <AdminStatus
        v-if="run.failure.value && !isConfirmOpen"
        kind="refused"
        :text="failureTextOf(run.failure.value)"
      />
      <div v-if="shown" class="flex flex-col gap-2">
        <AdminStatus kind="done" :text="summaryText" />
        <p v-if="shown.items.length === 0" class="text-sm text-muted">
          {{ $t('admin.contestPublish.noProblems') }}
        </p>
        <PublishResultTable v-else :items="shown.items" />
      </div>
    </template>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t('admin.contestPublish.confirmTitle')"
      :body="$t('admin.contestPublish.confirmBody', { count: summary?.published ?? 0 })"
      :confirm-label="$t('admin.contestPublish.publish')"
      tone="danger"
      :busy="run.isPending.value"
      @confirm="runReal"
    >
      <template #error>
        <p v-if="run.failure.value" role="alert" class="text-sm text-negative">
          {{ failureTextOf(run.failure.value) }}
        </p>
      </template>
    </ConfirmDialog>
  </section>
</template>
