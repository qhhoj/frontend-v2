<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import Card from '@/components/ui/Card.vue';
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
import ProblemLimitStrip from './ProblemLimitStrip.vue';
import ProblemLinksCard from './ProblemLinksCard.vue';
import ProblemMySubmissions from './ProblemMySubmissions.vue';
import StatementBody from './StatementBody.vue';
import ProblemTypesCard from './ProblemTypesCard.vue';
import StatementNote from './StatementNote.vue';
import SubmitOpenButton from './SubmitOpenButton.vue';
import SubmitPane from './SubmitPane.vue';
import { hasNoStatement } from './statement-presence';
import type { ProblemLayout } from './problem-layout';
import { useScoreScale } from './use-contest-problem';
import { useSubmitForm } from './use-submit-form';

const DEFAULT_TAB = 'statement';
/**
 * A loaded problem (Workbench split): left the statement card (header, facts strip, tabs), then the viewer's submissions,
 * links, types and comments; right the submit pane once the viewer opens it from the header. The page keys it by code, so another problem never inherits the typed
 * code, pick or file.
 */
const props = defineProps<{
  problem: ProblemDetail;
  tabs: { id: string; labelKey: string }[];
  layout: ProblemLayout;
  /** The viewer's contest holding this problem (its points and the viewer's cell replace the site-wide facts). */
  contest?: ContestDetail | null;
  /** False for an ended contest shown for context: submissions are practice ones, so they score on the site's scale. */
  contestIsLive?: boolean;
}>();
const tab = defineModel<string>('tab', { required: true });
const emit = defineEmits<{ gone: []; panel: [open: boolean] }>();
const route = useRoute();
// The submit form is this component's: beside the statement the pane shows it; where the statement takes the whole column
// (phones, tablets) the sheet does.
const session = useSessionStore();
const isSignedIn = computed(() => session.status === 'authenticated');
const usesSheet = useMediaQuery(() => props.layout.stacked);
/** The pane and the sheet start closed, so the statement is what the viewer sees first; the header button opens them. */
const submitOpen = ref(false);
/** The pane takes a column beside the statement; the page widens its column for it. */
const paneIsOpen = computed(() => isSignedIn.value && !usesSheet.value && submitOpen.value);
watch(paneIsOpen, (isOpen) => emit('panel', isOpen), { immediate: true });
/** The pane and the facts strip stick under whatever bar stays at the top: the impersonation banner, else the contest bar. */
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
const hasEditorial = computed(() => props.tabs.some((candidate) => candidate.id === 'editorial'));
const { t } = useI18n();
const tabItems = computed(() =>
  props.tabs.map(({ id, labelKey }) => ({ key: id, label: t(labelKey), panelId: panelIdOf(id) })),
);
function panelIdOf(tabId: string) {
  return `problem-panel-${tabId}`;
}
</script>

<template>
  <ProblemArchivedNotice :code="problem.code" :organization-ids="problem.organizations" />
  <div
    :class="[
      layout.grid,
      isSignedIn ? (paneIsOpen ? layout.columns.editor : '') : layout.columns.signIn,
    ]"
    :style="stickyTop"
  >
    <!-- The statement tab's card carries the problem header; on the editorial tab the card is header and tabs only. -->
    <Card as="div" data-testid="statement-card" :class="['min-w-0 p-6 sm:p-8', layout.left]">
      <ProblemHeader :problem="problem" :section="tab === 'editorial' ? 'editorial' : 'statement'">
        <template v-if="isSignedIn" #actions>
          <SubmitOpenButton
            :form="submitForm"
            :open="submitOpen && !usesSheet"
            :show-result="!usesSheet"
            @open="submitOpen = true"
          />
        </template>
        <template #strip>
          <ProblemLimitStrip
            :problem="problem"
            :is-signed-in="isSignedIn"
            :has-editorial="hasEditorial"
            :contest="contest"
            :cells-class="layout.facts"
          />
        </template>
        <Tabs
          v-if="tabs.length > 1"
          v-model="tab"
          :items="tabItems"
          :label="$t('problem.tabsLabel')"
          overflow="scroll"
        />
      </ProblemHeader>
      <div
        :id="panelIdOf(DEFAULT_TAB)"
        :role="tabs.length > 1 ? 'tabpanel' : undefined"
        :aria-labelledby="tabs.length > 1 ? `${panelIdOf(DEFAULT_TAB)}-tab` : undefined"
        :hidden="tab !== DEFAULT_TAB"
        :tabindex="tab === DEFAULT_TAB ? 0 : undefined"
      >
        <template v-if="tab === DEFAULT_TAB">
          <StatementNote v-if="!problem.translated && !problem.pdfStatementUrl" class="mt-4" />
          <PdfStatement
            v-if="problem.pdfStatementUrl"
            :problem="problem"
            :url="problem.pdfStatementUrl"
            :untranslated="!problem.translated"
            class="mt-4 mb-6 last:mb-0"
          />
          <NoStatement
            v-if="hasNoStatement(problem)"
            :code="problem.code"
            :can-edit="problem.canEdit"
            class="mt-4"
          />
          <StatementBody v-else :html="problem.descriptionHtml" class="mt-4" />
          <p v-if="problem.authors.length" class="mt-6 text-sm text-muted">
            {{ $t('problem.authors') }}
            <template v-for="(author, index) in problem.authors" :key="author.id"
              ><template v-if="index">, </template
              ><UserName :username="author.username" :rating="author.rating"
            /></template>
          </p>
        </template>
      </div>
    </Card>
    <!-- Keyed by code: another problem never inherits the typed code, pick or file. -->
    <SubmitPane
      :key="problem.code"
      v-model:open="submitOpen"
      :problem="problem"
      :form="submitForm"
      :uses-sheet="usesSheet"
      :is-signed-in="isSignedIn"
      :place-class="isSignedIn ? layout.pane : layout.signIn"
    />
    <div :class="['@container flex min-w-0 flex-col gap-5', layout.left]">
      <div
        v-if="hasEditorial"
        :id="panelIdOf('editorial')"
        role="tabpanel"
        :aria-labelledby="`${panelIdOf('editorial')}-tab`"
        :hidden="tab !== 'editorial'"
        :tabindex="tab === 'editorial' ? 0 : undefined"
      >
        <!-- Mounted only while selected, so the editorial request is lazy. -->
        <EditorialTab v-if="tab === 'editorial'" :code="problem.code" @gone="$emit('gone')" />
      </div>
      <aside
        data-testid="problem-rail"
        :aria-label="$t('problem.rail.railLabel')"
        class="-mb-3.5 gap-3.5 @lg:columns-2"
      >
        <!-- Two columns of cards where the column is wide enough (512 px), each card whole in one column. -->
        <ProblemMySubmissions
          v-if="isSignedIn"
          :code="problem.code"
          :scale="scoreScale"
          class="mb-3.5 break-inside-avoid"
        />
        <ProblemLinksCard
          :problem="problem"
          :has-editorial="hasEditorial"
          :show-pdf="false"
          class="mb-3.5 break-inside-avoid"
        />
        <ProblemTypesCard :problem="problem" class="mb-3.5 break-inside-avoid" />
      </aside>
      <CommentsSection
        v-if="tab === DEFAULT_TAB"
        type="problem"
        :page-key="problem.code"
        :contest-key="problem.contest?.contestKey ?? null"
        placeholder-key="comments.composer.problemPlaceholder"
        fold-when-empty
      />
    </div>
  </div>
</template>
