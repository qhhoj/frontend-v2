<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import Tabs from '@/components/ui/Tabs.vue';
import UserName from '@/components/UserName.vue';
import CommentsSection from '@/features/comments/CommentsSection.vue';
import ProblemArchivedNotice from '@/features/organizations/problems/ProblemArchivedNotice.vue';
import { useMediaQuery } from '@/lib/use-media-query';
import { useSessionStore } from '@/stores/session.store';
import EditorialTab from './EditorialTab.vue';
import NoStatement from './NoStatement.vue';
import PdfStatement from './PdfStatement.vue';
import ProblemHeader from './ProblemHeader.vue';
import StatementBody from './StatementBody.vue';
import StatementNote from './StatementNote.vue';
import SubmitOpenButton from './SubmitOpenButton.vue';
import ProblemSidePanel from './ProblemSidePanel.vue';
import SubmitPane from './SubmitPane.vue';
import SubmitSignInButton from './SubmitSignInButton.vue';
import { useVerdictToastTracking } from '@/features/submissions/verdict-toast/use-toast-tracking';
import { hasNoStatement } from './statement-presence';
import type { ProblemLayout } from './problem-layout';
import type { ProblemTab } from './problem-tab';
import { useScoreScale } from './use-contest-problem';
import { useSubmitForm } from './use-submit-form';

const DEFAULT_TAB = 'statement';
/**
 * A loaded problem (redesign "Sơn mài"): the header on the page background (eyebrow, title, tabs), then two columns: the
 * statement capped at the reading measure with the in-place editor and the folded comments under it, and the sticky side
 * panel (the primary "Nộp bài", limits, my submissions, links). The editor opens only when the viewer asks. A submission
 * tab has no panel (its table takes the width): its "Nộp bài" is in the header and the editor opens above the table.
 * The page keys this by code, so another problem never inherits the typed code, pick or file.
 */
const props = defineProps<{
  problem: ProblemDetail;
  /** The open tab's id. */
  tab: string;
  tabs: ProblemTab[];
  layout: ProblemLayout;
  /** The viewer's contest holding this problem (its points and the viewer's cell replace the site-wide facts). */
  contest?: ContestDetail | null;
  /** False for an ended contest shown for context: submissions are practice ones, so they score on the site's scale. */
  contestIsLive?: boolean;
}>();
const emit = defineEmits<{ gone: []; panel: [open: boolean] }>();
const route = useRoute();
// The submit form is this component's: beside the statement the pane shows it; where the statement takes the whole column
// (phones, tablets) the sheet does.
const session = useSessionStore();
const isSignedIn = computed(() => session.status === 'authenticated');
const usesSheet = useMediaQuery(() => props.layout.stacked);
/** The editor and the sheet start closed, so the statement is what the viewer sees first; the panel's button opens them. */
const submitOpen = ref(false);
/** The in-place editor is open (the contest's problem list folds to give it room). */
const paneIsOpen = computed(() => isSignedIn.value && !usesSheet.value && submitOpen.value);
watch(paneIsOpen, (isOpen) => emit('panel', isOpen), { immediate: true });
/** The side panel sticks under whatever bar stays at the top: the impersonation banner, else the contest bar. */
const IMPERSONATION_BANNER_HEIGHT = '3.5rem';
const stickyTop = computed(() => ({
  '--pane-top': session.impersonatorId
    ? IMPERSONATION_BANNER_HEIGHT
    : 'var(--contest-bar-height, 0px)',
}));
// An anonymous viewer would only get a 401 for the fetch, so it is not started.
const resubmitId = computed(() =>
  isSignedIn.value && typeof route.query.resubmit === 'string' ? route.query.resubmit : null,
);
// `?resubmit=`: the prefilled code is the point of the visit, so the pane or the sheet opens for it. Every time the id
// appears, not only on load: an anonymous viewer arrives with it after signing in.
watch(
  resubmitId,
  (id) => {
    if (id) submitOpen.value = true;
  },
  { immediate: true },
);
const scaleContest = () => (props.contestIsLive === false ? null : props.contest);
const submitForm = useSubmitForm(toRef(props, 'problem'), resubmitId, scaleContest);
const scoreScale = useScoreScale(() => props.problem, scaleContest);
// A submission sent here is followed to its verdict by the shell, which toasts it only once the viewer left this page: here the
// result is always shown (the open pane, the header line beside the closed pane's button, or the phone sheet's bar).
useVerdictToastTracking({
  submissionId: submitForm.lastSubmissionId,
  scale: () => scoreScale.value,
  wasSolvedBefore: () => props.problem.viewerStatus === 'solved',
  isResultVisible: () => isSignedIn.value,
});
const hasEditorial = computed(() => props.tabs.some((candidate) => candidate.id === 'editorial'));
const { t } = useI18n();
const tabItems = computed(() =>
  props.tabs.map(({ id, labelKey, to }) => ({
    key: id,
    label: t(labelKey),
    to,
    isCurrent: id === props.tab,
  })),
);
/** The statement and the editorial are the frame's own panels; the submission tabs hand the space to the child route. */
const isFramePanel = computed(() => props.tab === DEFAULT_TAB || props.tab === 'editorial');
</script>

<template>
  <ProblemArchivedNotice :code="problem.code" :organization-ids="problem.organizations" />
  <ProblemHeader :problem="problem" :contest="contest">
    <!-- A submission tab has no side panel: the submit entry sits in its header (the sheet's bar where there is one). -->
    <template v-if="!isFramePanel && !usesSheet" #actions>
      <SubmitOpenButton
        v-if="isSignedIn"
        :form="submitForm"
        :open="submitOpen"
        :show-result="false"
        @open="submitOpen = true"
      />
      <div v-else data-testid="submit-sign-in"><SubmitSignInButton /></div>
    </template>
    <Tabs :items="tabItems" :label="$t('problem.tabsLabel')" overflow="scroll" />
  </ProblemHeader>
  <!-- The submission tabs: the editor (once opened) above the child route's list or ranking, under the same header. -->
  <div v-if="!isFramePanel" class="flex min-w-0 flex-col gap-6">
    <SubmitPane
      v-model:open="submitOpen"
      :problem="problem"
      :form="submitForm"
      :uses-sheet="usesSheet"
      :is-signed-in="isSignedIn"
    />
    <RouterView />
  </div>
  <div v-else :class="layout.grid" :style="stickyTop">
    <div class="flex min-w-0 flex-col gap-6">
      <div
        v-if="tab === DEFAULT_TAB"
        data-testid="statement-card"
        class="flex min-w-0 flex-col gap-4"
      >
        <StatementNote v-if="!problem.translated && !problem.pdfStatementUrl" />
        <PdfStatement
          v-if="problem.pdfStatementUrl"
          :problem="problem"
          :url="problem.pdfStatementUrl"
          :untranslated="!problem.translated"
        />
        <NoStatement
          v-if="hasNoStatement(problem)"
          :code="problem.code"
          :can-edit="problem.canEdit"
        />
        <StatementBody v-else :html="problem.descriptionHtml" />
        <p v-if="problem.authors.length" class="text-meta text-muted">
          {{ $t('problem.authors') }}
          <template v-for="(author, index) in problem.authors" :key="author.id"
            ><template v-if="index">, </template
            ><UserName :username="author.username" :rating="author.rating"
          /></template>
        </p>
      </div>
      <!-- Mounted only while selected, so the editorial request is lazy. -->
      <EditorialTab v-else-if="hasEditorial" :code="problem.code" @gone="$emit('gone')" />
      <!-- The editor opens in place, under what the viewer was reading. -->
      <SubmitPane
        v-model:open="submitOpen"
        :problem="problem"
        :form="submitForm"
        :uses-sheet="usesSheet"
        :is-signed-in="isSignedIn"
      />
      <CommentsSection
        v-if="tab === DEFAULT_TAB"
        type="problem"
        :page-key="problem.code"
        :contest-key="problem.contest?.contestKey ?? null"
        placeholder-key="comments.composer.problemPlaceholder"
      />
    </div>
    <ProblemSidePanel
      :problem="problem"
      :section="tab === 'editorial' ? 'editorial' : 'statement'"
      :layout="layout"
      :is-signed-in="isSignedIn"
      :contest="contest"
      :form="submitForm"
      :submit-open="submitOpen"
      :uses-sheet="usesSheet"
      :scale="scoreScale"
      @open="submitOpen = true"
    />
  </div>
</template>
