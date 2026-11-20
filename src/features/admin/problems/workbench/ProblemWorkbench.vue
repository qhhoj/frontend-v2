<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { Copy } from 'lucide-vue-next';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import SaveBar from '@/components/ui/SaveBar.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminLeaveGuard from '../../ui/form/AdminLeaveGuard.vue';
import ProblemCloneDialog from '../general/ProblemCloneDialog.vue';
import { setupSteps, workbenchSteps } from '../setup-steps';
import type { WorkbenchStepId } from '../setup-steps';
import type { SavePartId } from './save-parts';
import WorkbenchInfo from './WorkbenchInfo.vue';
import WorkbenchOther from './WorkbenchOther.vue';
import WorkbenchPlate from './WorkbenchPlate.vue';
import WorkbenchSection from '../../ui/workbench/WorkbenchSection.vue';
import WorkbenchStatement from './WorkbenchStatement.vue';
import WorkbenchTests from './WorkbenchTests.vue';
import { useWorkbench } from './use-workbench';
import { sectionDomId, sectionOfRoute } from './workbench-sections';
import type { WorkbenchSectionId } from './workbench-sections';
import { infoSummary, statementSummary, testsSummary } from './workbench-summary';

/**
 * The teacher's problem workbench: one page to set a problem up. Header, the status plate (the one readiness signal and
 * the publish action), then the sections, each a one-line row until opened: info, statement, tests and judging, the trial
 * run, and the rarely used rest. One save bar saves info, statements, editorial and judging together (`useWorkbench`); it
 * holds the page's primary while it shows. One leave guard covers the page.
 */
const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const route = useRoute();
const { t } = useI18n();
const { can } = usePermissions();
const KEY = 'admin.problems.workbench';
const FORM_ID = 'problem-workbench-form';
const workbench = useWorkbench(
  () => props.problem,
  () => props.meta,
);
const { info, statements, editorial, data, changes, dirtyCount, guardedCount } = workbench;
const { isSaving, savedAt, report, invalidSections, hasUnreadableDate, save, discard } = workbench;

/** The saved state of the setup steps; null while the test data is not read yet (unknown, never "missing"). */
const steps = computed(() => {
  const cases = data.query.data.value?.cases ?? null;
  if (cases === null && !props.problem.externalJudge) return null;
  return setupSteps(props.problem, cases);
});
const tests = computed(() =>
  data.form.value ? testsSummary(data.form.value.cases, info.form.value.points) : null,
);
/** The trial's state comes from the same rule as the plate's fourth step. */
const isTrialDone = computed(() =>
  setupSteps(props.problem, null).some((step) => step.id === 'trial' && step.isDone),
);
const summaries = computed(() => ({
  info: infoSummary(info.form.value),
  statement: statementSummary(props.problem),
  tests: tests.value ? t(`${KEY}.tests.total`, { ...tests.value }) : '',
  trial: t(`${KEY}.trial.${isTrialDone.value ? 'done' : 'todo'}`),
  other: t(`${KEY}.other.summary`),
}));

const open = reactive<Record<WorkbenchSectionId, boolean>>({
  info: false,
  statement: false,
  tests: false,
  trial: false,
  other: false,
});
/** The last section asks for its own data (external judge, Polygon link) only once it is opened. */
const isOtherShown = ref(false);
watch(
  () => open.other,
  (isOpen) => {
    if (isOpen) isOtherShown.value = true;
  },
  { immediate: true },
);
const folds = reactive({ infoMore: false, editorial: false, files: false, testsAdvanced: false });
async function openSection(id: WorkbenchSectionId) {
  open[id] = true;
  await nextTick();
  document.getElementById(sectionDomId(id))?.scrollIntoView({ block: 'start' });
}
/** A plate step opens its section; the trial is done on the problem page, so its row is only brought into view. */
const openStep = (id: WorkbenchStepId) => openSection(id);

/** An old tab address opens its section; else the page opens at the next step, once, and never folds a section itself. */
function openRouteSection() {
  const section = sectionOfRoute(route.name);
  if (!section) return;
  if (route.name === 'admin-problemEditorial') folds.editorial = true;
  if (route.name === 'admin-problemFiles') folds.files = true;
  void openSection(section);
}
onMounted(openRouteSection);
watch(() => route.name, openRouteSection);
let isNextStepOpened = sectionOfRoute(route.name) !== null;
watch(
  steps,
  (known) => {
    if (isNextStepOpened || !known) return;
    isNextStepOpened = true;
    const next = workbenchSteps(known).find((step) => !step.isDone);
    if (next && next.id !== 'trial') open[next.id] = true;
  },
  { immediate: true },
);

/** The fields the info section shows before its fold: an error on any other field opens the fold. */
const INFO_FIRST_FIELDS = [
  'code',
  'name',
  'timeLimit',
  'memoryLimit',
  'points',
  'groupId',
  'typeIds',
  'allowedLanguages',
];
/** Opens every section (and fold) that holds something to fix. */
function openInvalid(sections: readonly WorkbenchSectionId[]) {
  sections.forEach((id) => (open[id] = true));
  if (Object.keys(info.errors.value).some((field) => !INFO_FIRST_FIELDS.includes(field)))
    folds.infoMore = true;
  if (hasUnreadableDate.value) folds.infoMore = true;
  if (editorial.contentError.value || hasUnreadableDate.value) folds.editorial = true;
  if (sections.includes('tests')) folds.testsAdvanced = true;
}
/** A save the page refused itself: the sections open and focus moves to the first invalid field. */
watch(invalidSections, async (sections) => {
  if (sections.length === 0) return;
  openInvalid(sections);
  await nextTick();
  const field = document.querySelector<HTMLElement>(`#${FORM_ID} [aria-invalid="true"]`);
  if (field) field.focus();
  else document.getElementById(sectionDomId(sections[0]!))?.scrollIntoView({ block: 'start' });
});

const SECTION_OF_PART: Record<SavePartId, WorkbenchSectionId> = {
  problem: 'info',
  'translation.vi': 'statement',
  'translation.en': 'statement',
  editorial: 'statement',
  data: 'tests',
};
const PART_LABEL: Record<SavePartId, string> = {
  problem: 'problem',
  'translation.vi': 'translationVi',
  'translation.en': 'translationEn',
  editorial: 'editorial',
  data: 'data',
};
/** The last save, part by part: what was saved, what was not and why. Shown while a part is unsaved or has a complaint. */
const reportLines = computed(() =>
  (report.value ?? []).map((part) => {
    const status = part.status === 'saved' && part.note ? 'savedWithNote' : part.status;
    const said = `${t(`${KEY}.save.parts.${PART_LABEL[part.id]}`)} — ${t(`${KEY}.save.status.${status}`)}`;
    return { id: part.id, status: part.status, text: part.note ? `${said}: ${part.note}` : said };
  }),
);
const isReportFailed = computed(() => (report.value ?? []).some((part) => part.status !== 'saved'));
/** A save the server refused in part: the report comes into view and the sections it names open below it. */
const reportBox = ref<HTMLElement>();
watch(report, async (parts) => {
  const toFix = (parts ?? []).filter((part) => part.status === 'failed' || part.note);
  if (toFix.length === 0) return;
  openInvalid(toFix.map((part) => SECTION_OF_PART[part.id]));
  await nextTick();
  reportBox.value?.scrollIntoView({ block: 'start' });
});

/** What the bar says changed: "Thông tin 2 · Đề bài 1". */
const changedText = computed(() => {
  const changed = (['info', 'statement', 'tests'] as const)
    .filter((id) => changes.value[id] > 0)
    .map((id) => `${t(`${KEY}.sections.${id}`)} ${changes.value[id]}`);
  return changed.length ? changed.join(' · ') : undefined;
});
/** Only the page form's own submit saves: a dialog's form inside a section must not. */
function submit(event: Event) {
  if (event.target === event.currentTarget) void save();
}

const canClone = computed(() => can('judge.clone_problem'));
const isCloneOpen = ref(false);
const overflow = computed(() =>
  canClone.value
    ? [{ label: t('admin.problems.clone.open'), icon: Copy, run: () => (isCloneOpen.value = true) }]
    : [],
);
const listLink = computed(() => ({ to: { name: 'admin-problems' }, label: t(`${KEY}.back`) }));
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="problem-workbench">
    <PageHeader
      :title="problem.name"
      :crumbs="[listLink, { label: problem.code, mono: true }]"
      :back="listLink"
      :overflow="overflow"
    >
      <template #actions>
        <AppButton :to="{ name: 'problem', params: { code: problem.code } }">
          {{ $t(`${KEY}.viewAsStudent`) }}
        </AppButton>
      </template>
    </PageHeader>
    <WorkbenchPlate
      :problem="problem"
      :steps="steps"
      :has-unsaved="dirtyCount > 0"
      :is-data-unread="data.query.isError.value"
      @open="openStep"
    />
    <div v-if="reportLines.length" ref="reportBox" class="scroll-mt-4">
      <Notice
        data-testid="save-report"
        :role="isReportFailed ? 'alert' : 'status'"
        :tone="isReportFailed ? 'danger' : 'warning'"
        :title="$t(`${KEY}.save.${isReportFailed ? 'partial' : 'complaint'}`)"
      >
        <ul class="m-0 list-none p-0">
          <li
            v-for="line in reportLines"
            :key="line.id"
            :data-part="line.id"
            :data-status="line.status"
          >
            {{ line.text }}
          </li>
        </ul>
      </Notice>
    </div>
    <div class="flex flex-col border-b border-line">
      <form :id="FORM_ID" novalidate @submit.prevent="submit">
        <fieldset :disabled="isSaving" class="m-0 flex min-w-0 flex-col border-0 p-0">
          <WorkbenchSection
            id="info"
            v-model:open="open.info"
            :index="1"
            :title="$t(`${KEY}.sections.info`)"
            :summary="summaries.info"
            :change-count="changes.info"
          >
            <WorkbenchInfo
              v-model:more-open="folds.infoMore"
              :problem="problem"
              :meta="meta"
              :info="info"
            />
          </WorkbenchSection>
          <WorkbenchSection
            id="statement"
            v-model:open="open.statement"
            :index="2"
            :title="$t(`${KEY}.sections.statement`)"
            :summary="summaries.statement"
            :change-count="changes.statement"
          >
            <WorkbenchStatement
              v-model:files-open="folds.files"
              v-model:editorial-open="folds.editorial"
              :problem="problem"
              :meta="meta"
              :statements="statements"
              :editorial="editorial"
            />
          </WorkbenchSection>
          <WorkbenchSection
            id="tests"
            v-model:open="open.tests"
            :index="3"
            :title="$t(`${KEY}.sections.tests`)"
            :summary="summaries.tests"
            :change-count="changes.tests"
          >
            <WorkbenchTests
              v-model:advanced-open="folds.testsAdvanced"
              :problem="problem"
              :data="data"
              :info="info"
              :summary="tests"
            />
          </WorkbenchSection>
        </fieldset>
      </form>
      <WorkbenchSection
        id="trial"
        :index="4"
        :title="$t(`${KEY}.sections.trial`)"
        :summary="`${summaries.trial} · ${$t(`${KEY}.trial.later`)}`"
        :to="{ name: 'problem', params: { code: problem.code } }"
        :action-label="$t(`${KEY}.trial.open`)"
      />
      <WorkbenchSection
        id="other"
        v-model:open="open.other"
        :index="5"
        :title="$t(`${KEY}.sections.other`)"
        :summary="summaries.other"
      >
        <WorkbenchOther v-if="isOtherShown" :problem="problem" :meta="meta" />
      </WorkbenchSection>
    </div>
    <SaveBar
      data-testid="problem-save-bar"
      :form="FORM_ID"
      :dirty-count="dirtyCount"
      :pending="isSaving"
      :saved-at="savedAt"
      :note="changedText"
      @discard="discard"
    />
    <AdminLeaveGuard :dirty-count="guardedCount" />
    <ProblemCloneDialog v-if="canClone" v-model:visible="isCloneOpen" :code="problem.code" />
  </div>
</template>
