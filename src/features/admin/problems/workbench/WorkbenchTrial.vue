<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue';
import type { EditableProblem } from '@/api/types/problem-editing';
import InlineBit from '@/components/InlineBit.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import PageSection from '@/components/ui/PageSection.vue';
import Readout from '@/components/ui/Readout.vue';
import ReadoutCell from '@/components/ui/ReadoutCell.vue';
import TestSquares from '@/components/ui/TestSquares.vue';
import type { TestSquare } from '@/components/ui/TestSquares.vue';
import SubmitForm from '@/features/problems/SubmitForm.vue';
import SubmissionPlate from '@/features/submissions/SubmissionPlate.vue';
import SubmissionTable from '@/features/submissions/SubmissionTable.vue';
import { translate } from '@/i18n';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import type { TrialRun } from './trial/use-trial-run';

/**
 * Section 4: a model solution is run and judged on this page. Left: the verdict plate of the run on show (the site's own
 * `SubmissionPlate`, live while the judge works; an idle plate before the first run), a line that says which run it is
 * and whether the tests changed after it, and the viewer's last runs. Right (above on a narrow page): the submit panel,
 * the student form in its compact layout, with the one secondary button "Chạy lời giải này". The per-test results also
 * fill the column "Lời giải mẫu" of section 3.
 */
const props = defineProps<{
  problem: EditableProblem;
  trial: TrialRun;
  /** How many tests are saved: the idle plate shows one waiting square for each. */
  testCount: number;
}>();
const KEY = 'admin.problems.workbench.trial';
const RUN_COLUMNS = ['verdict', 'language', 'when'] as const;
const locale = useLocaleStore();
const session = useSessionStore();
const { form, run, verdict, isLive, currentTestcase, isPageRun, isStale, runs, list } = props.trial;

const idleSquares = computed<TestSquare[]>(() =>
  Array.from({ length: props.testCount }, (_test, index) => ({
    tone: 'waiting',
    number: index + 1,
    label: translate(`${KEY}.idle.waiting`, { number: index + 1 }),
  })),
);
const runWhen = computed(() =>
  run.value ? formatDate(run.value.date, 'datetime', locale.locale) : '',
);
const allRuns = computed(() => ({
  to: {
    name: 'submissions',
    query: { problem: props.problem.code, user: session.user?.username },
  },
  label: translate('common.viewAll'),
}));

/** A run just sent: the plate comes into view (on a phone it sits under the panel). */
const plate = useTemplateRef<HTMLElement>('plate');
watch(form.lastSubmissionId, async (id) => {
  if (!id) return;
  await nextTick();
  plate.value?.scrollIntoView({ block: 'nearest' });
});
</script>

<template>
  <div
    class="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)] xl:items-start"
  >
    <div class="flex min-w-0 flex-col gap-3">
      <div ref="plate" class="scroll-mt-4">
        <SubmissionPlate
          v-if="run && verdict"
          :submission="run"
          :verdict="verdict"
          :problem="problem"
          :is-problem-loading="false"
          :is-live="isLive"
          :current-testcase="currentTestcase"
          without-test-rows
        />
        <Readout v-else :label="$t(`${KEY}.label`)" data-testid="trial-idle">
          <div class="flex flex-wrap items-start gap-x-6 gap-y-4">
            <ReadoutCell
              :label="$t(`${KEY}.idle.label`)"
              size="word"
              class="flex-1 basis-64 max-sm:basis-full"
            >
              {{ $t(`${KEY}.idle.word`) }}
              <template #below>
                <span class="text-small text-muted">{{ $t(`${KEY}.idle.note`) }}</span>
              </template>
            </ReadoutCell>
            <ReadoutCell
              v-if="idleSquares.length"
              :label="$t(`${KEY}.idle.tests`)"
              class="max-w-64 shrink-0 max-sm:basis-full"
            >
              {{ idleSquares.length }}
              <template #below>
                <TestSquares :tests="idleSquares" :label="$t(`${KEY}.idle.squares`)" />
              </template>
            </ReadoutCell>
          </div>
        </Readout>
      </div>
      <p
        v-if="run"
        data-testid="trial-run-line"
        class="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-muted"
      >
        <span>
          {{ $t(`${KEY}.source.${isPageRun ? 'page' : 'earlier'}`) }} ·
          <time :datetime="run.date">{{ runWhen }}</time>
        </span>
        <span v-if="isStale" data-testid="trial-stale">{{ $t(`${KEY}.stale`) }}</span>
        <AppButton
          tone="link"
          class="ml-auto text-meta"
          :to="{ name: 'submission', params: { id: run.id } }"
        >
          {{ $t(`${KEY}.full`) }}
        </AppButton>
      </p>
      <PageSection :title="$t(`${KEY}.runs.title`)" :see-all="runs.length ? allRuns : undefined">
        <QueryState
          :loading="list.isPending.value"
          :error="list.error.value"
          @retry="() => void list.refetch()"
        >
          <template #skeleton>
            <SkeletonBlock data-skeleton-region="trial-runs" class="h-(--qh-row) w-full" />
          </template>
          <SubmissionTable
            v-if="runs.length"
            data-testid="trial-runs"
            :submissions="runs"
            :show-problem="false"
            :column-keys="RUN_COLUMNS"
          />
          <p v-else class="m-0 flex items-center gap-2 text-meta text-muted">
            <InlineBit kind="asleep" />{{ $t(`${KEY}.runs.empty`) }}
          </p>
        </QueryState>
      </PageSection>
    </div>
    <Card
      panel
      as="div"
      :title="$t(`${KEY}.panel`)"
      class="max-xl:order-first"
      data-testid="trial-panel"
    >
      <div class="flex flex-col gap-3">
        <SubmitForm
          :problem="problem"
          :form="form"
          layout="compact"
          :submit-label="$t(`${KEY}.run`)"
        />
        <p class="m-0 text-small text-muted">{{ $t(`${KEY}.hint`) }}</p>
      </div>
    </Card>
  </div>
</template>
