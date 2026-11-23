<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { EditableContest } from '@/api/types/contest-editing';
import AppButton from '@/components/ui/AppButton.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import SaveBar from '@/components/ui/SaveBar.vue';
import Tabs from '@/components/ui/Tabs.vue';
import { freezesInFormat } from '@/lib/board-freeze';
import { formatLabel } from '@/lib/contest-format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminLeaveGuard from '../../ui/form/AdminLeaveGuard.vue';
import SaveReport from '../../ui/workbench/SaveReport.vue';
import WorkbenchSection from '../../ui/workbench/WorkbenchSection.vue';
import { sectionDomId } from '../../ui/workbench/section-dom-id';
import ContestAnnouncementsTab from '../announcements/ContestAnnouncementsTab.vue';
import { useContestLength } from '../general/contest-length';
import { isPointsValid } from '../problems/contest-problems';
import ContestTools from '../tools/ContestTools.vue';
import ContestOtherTab from './ContestOtherTab.vue';
import ContestPlate from './ContestPlate.vue';
import ContestResultsTab from './ContestResultsTab.vue';
import ParticipantsWidenDialog from './ParticipantsWidenDialog.vue';
import SetupInfo from './SetupInfo.vue';
import SetupParticipants from './SetupParticipants.vue';
import SetupProblems from './SetupProblems.vue';
import SetupTime from './SetupTime.vue';
import { useContestProblemMarks } from './contest-problem-marks';
import { provideSaveBarShown } from './card-primary';
import { contestGapsOf } from './contest-status';
import {
  CONTEST_TOOLS_ANCHORS,
  CONTEST_TOOLS_SECTION,
  CONTEST_WORKBENCH_TABS,
  sectionOfRoute,
  tabOfRoute,
} from './contest-workbench-tabs';
import type { ContestSectionId } from './contest-workbench-tabs';
import { sectionOfField, useContestWorkbench } from './use-contest-workbench';
import type { ContestSavePartId } from './use-contest-workbench';

/**
 * The teacher's contest workbench: one page to set a contest up and run it. Header, the status plate (the one place
 * that says whether students see the contest, and the show/hide action), three tabs. The setup tab holds the sections,
 * each a one-line row until opened: time and format, problems, participants, announcements, and the presentation; under
 * them the running tools (submissions, rejudge, similarity), open while the contest runs. One
 * save bar saves the settings and the problem list together (`useContestWorkbench`); it holds the page's primary while
 * it shows. One leave guard covers the page; the tab lives in `?tab=`, so switching tabs never asks.
 */
const props = defineProps<{ contest: EditableContest }>();
const route = useRoute();
const { t } = useI18n();
const locale = useLocaleStore();
const KEY = 'admin.contests.workbench';
const FORM_ID = 'contest-workbench-form';
const SETUP_ID = 'contest-workbench-setup';
const workbench = useContestWorkbench(() => props.contest);
const { settings, problems, changes, dirtyCount, isSaving, savedAt, report, invalidSections } =
  workbench;
provideSaveBarShown(computed(() => dirtyCount.value > 0));
const { save, discard } = workbench;

const marksQuery = useContestProblemMarks(() =>
  (props.contest.problems ?? []).map((problem) => problem.code),
);
/** What the saved contest still lacks; null while the problems' setup is not read yet. */
const gaps = computed(() =>
  marksQuery.isLoading.value ? null : contestGapsOf(props.contest, marksQuery.marks.value),
);

const tab = computed(() => tabOfRoute(route));
const tabs = computed(() =>
  CONTEST_WORKBENCH_TABS.map((id) => ({
    key: id,
    label: t(`${KEY}.tabs.${id}`),
    to: { name: route.name!, params: route.params, query: { tab: id } },
    isCurrent: tab.value === id,
    dirty: id === 'setup' ? dirtyCount.value : 0,
    testid: `contest-tab-${id}`,
  })),
);

const open = reactive<Record<ContestSectionId, boolean>>({
  time: false,
  problems: false,
  participants: false,
  announcements: false,
  info: false,
});
/** The lists inside a section (participants, announcements) are read only once the section was opened. */
const wasOpened = reactive({ participants: false, announcements: false });
watch(
  () => [open.participants, open.announcements] as const,
  ([participants, announcements]) => {
    if (participants) wasOpened.participants = true;
    if (announcements) wasOpened.announcements = true;
  },
  { immediate: true },
);
const folds = reactive({ timeMore: false, participantsMore: false });
/** The running tools: open while the contest runs, one closed row before it starts and after it ends; read once opened. */
const isToolsOpen = ref(props.contest.phase === 'running');
const wasToolsOpened = ref(isToolsOpen.value);
watch(isToolsOpen, (isOpen) => {
  if (isOpen) wasToolsOpened.value = true;
});
async function openSection(id: ContestSectionId) {
  open[id] = true;
  await nextTick();
  document.getElementById(sectionDomId(id))?.scrollIntoView({ block: 'start' });
}

/** An old tab address opens its section, and a hash from an old link (`#contest-actions-problem`) is brought into view. */
async function openRoutePlace() {
  const section = sectionOfRoute(route.name);
  if (section && tab.value === 'setup') void openSection(section);
  if (!route.hash) return;
  if (Object.values<string>(CONTEST_TOOLS_ANCHORS).includes(route.hash.slice(1)))
    isToolsOpen.value = true;
  await nextTick();
  document.getElementById(route.hash.slice(1))?.scrollIntoView({ block: 'start' });
}
onMounted(openRoutePlace);
watch(() => [route.name, route.hash], openRoutePlace);
/** Without a section in the address the page opens, once, at the first thing the contest still lacks. */
let isFirstGapOpened = sectionOfRoute(route.name) !== null;
watch(
  gaps,
  (known) => {
    if (isFirstGapOpened || !known) return;
    isFirstGapOpened = true;
    const first = known[0];
    if (first) open[first.kind === 'participants' ? 'participants' : 'problems'] = true;
  },
  { immediate: true },
);

/** The fields the time section shows before its fold: an error on any other field of the section opens the fold. */
const TIME_FIRST_FIELDS = [
  'startTime',
  'endTime',
  'formatName',
  'formatConfig',
  'frozenLastMinutes',
  'scoreboardVisibility',
  'isRated',
];
/** Opens every section (and fold) that holds something to fix, then moves to the first invalid field. */
async function revealInvalid(sections: readonly ContestSectionId[]) {
  sections.forEach((id) => (open[id] = true));
  const fields = Object.keys(settings.errors.value).map((field) => field.split('.')[0]!);
  if (fields.some((name) => sectionOfField(name) === 'time' && !TIME_FIRST_FIELDS.includes(name)))
    folds.timeMore = true;
  if (fields.some((name) => name === 'bannedUsers' || name === 'bannedJudges'))
    folds.participantsMore = true;
  await nextTick();
  const field = document.querySelector<HTMLElement>(`#${SETUP_ID} [aria-invalid="true"]`);
  if (field) field.focus();
  else if (sections[0])
    document.getElementById(sectionDomId(sections[0]))?.scrollIntoView({ block: 'start' });
}
/** A save the page refused itself. */
watch(invalidSections, (sections) => {
  if (sections.length > 0) void revealInvalid(sections);
});

/** The last save, part by part. Shown while a part is unsaved. */
const reportLines = computed(() =>
  (report.value ?? []).map((part) => {
    const said = `${t(`${KEY}.save.parts.${part.id}`)} — ${t(`admin.problems.workbench.save.status.${part.status}`)}`;
    return { id: part.id, status: part.status, text: part.note ? `${said}: ${part.note}` : said };
  }),
);
/** A save the server refused in part: the report comes into view and the sections it names open below it. */
const reportBox = ref<HTMLElement>();
watch(report, async (parts) => {
  const failed = (parts ?? []).filter((part) => part.status === 'failed').map((part) => part.id);
  if (failed.length === 0) return;
  const sections = new Set<ContestSectionId>();
  const sectionsOf: Record<ContestSavePartId, () => void> = {
    settings: () =>
      Object.keys(settings.errors.value).forEach((field) => sections.add(sectionOfField(field))),
    problems: () => sections.add('problems'),
  };
  failed.forEach((id) => sectionsOf[id]());
  if (workbench.participants.refusal.value) sections.add('participants');
  await revealInvalid([...sections]);
  reportBox.value?.scrollIntoView({ block: 'start' });
});

/** The participants row: every restriction the form has on ("Cả tổ chức + Ai có mã vào"), then what one still lacks. */
const participantsSummary = computed(() => {
  const { restrictions, gaps: missing } = workbench.participants;
  const modes = restrictions.value.length > 0 ? restrictions.value : (['open'] as const);
  return [
    modes.map((id) => t(`${KEY}.participants.modes.${id}`)).join(' + '),
    ...missing.value.map((id) => t(`${KEY}.participants.gaps.${id}`)),
  ].join(' · ');
});

const { lengthText } = useContestLength(settings.form);
const summaries = computed(() => {
  const form = settings.form.value;
  const rows = problems.rows.value;
  const points = rows.reduce((sum, row) => sum + (isPointsValid(row.points) ? row.points : 0), 0);
  const time = [
    form.startTime ? formatDate(form.startTime, 'datetime', locale.locale) : '',
    lengthText.value ?? '',
    formatLabel(form.formatName),
    freezesInFormat(form.formatName) && form.frozenLastMinutes > 0
      ? t(`${KEY}.time.freeze`, { minutes: form.frozenLastMinutes })
      : '',
  ];
  return {
    time: time.filter(Boolean).join(' · '),
    problems: rows.length
      ? t(`${KEY}.problems.total`, { count: rows.length, points })
      : t(`${KEY}.problems.none`),
    participants: participantsSummary.value,
    announcements: t(`${KEY}.announcements.summary`),
    info: t(`${KEY}.info.summary`),
  };
});
/** What the bar says changed: "Thời gian và thể thức 2 · Bài 1". */
const changedParts = computed(() =>
  (['time', 'problems', 'participants', 'info'] as const).map((id) => ({
    label: t(`${KEY}.sections.${id}`),
    count: changes.value[id],
  })),
);

const listLink = computed(() => ({ to: { name: 'admin-contests' }, label: t(`${KEY}.back`) }));
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="contest-workbench">
    <PageHeader
      :title="contest.name"
      :crumbs="[listLink, { label: contest.key, mono: true }]"
      :back="listLink"
    >
      <template #actions>
        <AppButton :to="{ name: 'contest', params: { key: contest.key } }">
          {{ $t(`${KEY}.viewAsStudent`) }}
        </AppButton>
      </template>
    </PageHeader>
    <ContestPlate :contest="contest" :gaps="gaps" :has-unsaved="dirtyCount > 0" />
    <div v-if="reportLines.length" ref="reportBox" class="scroll-mt-4">
      <SaveReport
        :title="$t('admin.problems.workbench.save.partial')"
        failed
        :lines="reportLines"
      />
    </div>
    <Tabs :items="tabs" :label="$t('admin.contests.tabsLabel')" />
    <div v-show="tab === 'setup'" :id="SETUP_ID" class="flex flex-col gap-4">
      <form :id="FORM_ID" class="hidden" novalidate @submit.prevent="save" />
      <fieldset
        :disabled="isSaving"
        class="m-0 flex min-w-0 flex-col border-0 border-b border-line p-0"
      >
        <WorkbenchSection
          id="time"
          v-model:open="open.time"
          :index="1"
          :title="$t(`${KEY}.sections.time`)"
          :summary="summaries.time"
          :change-count="changes.time"
        >
          <SetupTime
            v-model="settings.form.value"
            v-model:more-open="folds.timeMore"
            :errors="settings.errors.value"
            :has-ranking-code="contest.settings?.hasRankingAccessCode ?? false"
            :will-rescore="workbench.willRescore.value"
          />
        </WorkbenchSection>
        <WorkbenchSection
          id="problems"
          v-model:open="open.problems"
          :index="2"
          :title="$t(`${KEY}.sections.problems`)"
          :summary="summaries.problems"
          :change-count="changes.problems"
        >
          <SetupProblems
            :contest-key="contest.key"
            :label-style="settings.form.value.labelStyle"
            :problems="problems"
            :marks="marksQuery.marks.value"
          />
        </WorkbenchSection>
        <WorkbenchSection
          id="participants"
          v-model:open="open.participants"
          :index="3"
          :title="$t(`${KEY}.sections.participants`)"
          :summary="summaries.participants"
          :change-count="changes.participants"
        >
          <SetupParticipants
            v-model:more-open="folds.participantsMore"
            :contest="contest"
            :workbench="workbench"
            :list-shown="wasOpened.participants"
          />
        </WorkbenchSection>
        <WorkbenchSection
          id="announcements"
          v-model:open="open.announcements"
          :index="4"
          :title="$t(`${KEY}.sections.announcements`)"
          :summary="summaries.announcements"
        >
          <ContestAnnouncementsTab v-if="wasOpened.announcements" :contest="contest" />
        </WorkbenchSection>
        <WorkbenchSection
          id="info"
          v-model:open="open.info"
          :index="5"
          :title="$t(`${KEY}.sections.info`)"
          :summary="summaries.info"
          :change-count="changes.info"
        >
          <SetupInfo v-model="settings.form.value" :errors="settings.errors.value" />
        </WorkbenchSection>
      </fieldset>
      <div class="border-b border-line">
        <WorkbenchSection
          :id="CONTEST_TOOLS_SECTION"
          v-model:open="isToolsOpen"
          :title="$t(`${KEY}.tools.label`)"
          :summary="$t(`${KEY}.tools.summary`)"
          :action-label="
            $t(isToolsOpen ? 'admin.problems.workbench.sections.collapse' : `${KEY}.tools.open`)
          "
        >
          <ContestTools v-if="wasToolsOpened" :contest="contest" />
        </WorkbenchSection>
      </div>
    </div>
    <ContestResultsTab v-if="tab === 'results'" :contest="contest" />
    <ContestOtherTab v-if="tab === 'other'" :contest="contest" />
    <SaveBar
      data-testid="contest-save-bar"
      :form="FORM_ID"
      :dirty-count="dirtyCount"
      :pending="isSaving"
      :saved-at="savedAt"
      :changed-parts="changedParts"
      @discard="discard"
    />
    <ParticipantsWidenDialog :contest="contest" :workbench="workbench" />
    <AdminLeaveGuard :dirty-count="dirtyCount" />
  </div>
</template>
