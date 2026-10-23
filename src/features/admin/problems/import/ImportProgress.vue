<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { ImportJob } from '@/api/types/problem-imports';
import { useLocaleStore } from '@/stores/locale.store';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD, buttonClass } from '../../ui/controls';
import ImportStepList from './ImportStepList.vue';
import type { ImportPhase, PollStop } from './import-job';
import { readImportJob } from './import-reading';
import { useImportSteps } from './use-import-steps';

/** The zip import's job: its steps from its `step`, then the end: link or reason (read by `readImportJob`). */
const props = defineProps<{
  code: string;
  phase: ImportPhase | null;
  job: ImportJob | null;
  pollFailure: unknown;
  stop: PollStop | null;
}>();

const locale = useLocaleStore();
const steps = useImportSteps('zip', toRef(props, 'job'));
const reading = computed(() =>
  readImportJob({
    source: 'zip',
    job: props.job,
    phase: props.phase,
    stop: props.stop,
    code: props.code,
    lastSeenAt: '',
    locale: locale.locale,
    can: { retry: false, edit: false, sync: false },
  }),
);
const isFinished = computed(() => props.phase === 'done' || props.phase === 'failed');
</script>

<template>
  <section
    :class="[CARD, 'flex flex-col gap-4 p-4 md:p-5']"
    aria-labelledby="import-progress-title"
  >
    <h2 id="import-progress-title" class="font-display text-base font-semibold">
      {{ reading.title }}
    </h2>
    <p v-if="job && !isFinished" class="text-sm text-muted">
      {{ $t('admin.polygon.progress.runningHint') }}
    </p>

    <ImportStepList :steps="steps" :job="job" />

    <AdminStatus
      v-if="phase === 'done' && job?.result"
      kind="done"
      :text="$t('admin.polygon.progress.doneText')"
    />
    <div v-if="reading.kind === 'failed'" class="flex flex-col gap-1" data-testid="import-failure">
      <AdminStatus kind="refused" :text="`${reading.cause}. ${reading.fix}`" />
      <p v-if="reading.detail" class="font-mono text-meta break-words text-muted">
        {{ $t('admin.polygonLink.progress.serverSays', { text: reading.detail }) }}
      </p>
    </div>
    <p
      v-if="reading.kind === 'failed' && reading.line"
      class="text-sm text-muted"
      data-testid="failed-step"
    >
      {{ reading.line }}
    </p>
    <AdminStatus v-if="stop" kind="refused" :text="reading.line" />
    <p v-else-if="pollFailure" class="text-sm text-negative">
      {{ $t('admin.polygon.progress.pollFailed') }} {{ failureTextOf(pollFailure) }}
    </p>
    <div class="flex flex-wrap gap-2 empty:hidden">
      <RouterLink
        v-if="reading.action === 'open' && job?.result"
        :to="{ name: 'admin-problemGeneral', params: { code: job.result.code } }"
        :class="buttonClass('primary')"
        >{{ $t('admin.polygon.progress.open', { code: job.result.code }) }}</RouterLink
      >
      <slot name="actions" :phase="phase" />
    </div>
  </section>
</template>
