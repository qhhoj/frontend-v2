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
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useSessionStore } from '@/stores/session.store';
import EditorialTab from './EditorialTab.vue';
import NoStatement from './NoStatement.vue';
import PdfStatement from './PdfStatement.vue';
import ProblemFactsCard from './ProblemFactsCard.vue';
import ProblemHeader from './ProblemHeader.vue';
import ProblemLinksCard from './ProblemLinksCard.vue';
import ProblemMySubmissions from './ProblemMySubmissions.vue';
import ProblemSubmitCard from './ProblemSubmitCard.vue';
import StatementBody from './StatementBody.vue';
import StatementNote from './StatementNote.vue';
import SubmitDock from './SubmitDock.vue';
import { hasNoStatement } from './statement-presence';
import type { PROBLEM_LAYOUT } from './problem-layout';
import { useSubmitForm } from './use-submit-form';

const DEFAULT_TAB = 'statement';
/**
 * A loaded problem: header with tabs, the panels, the rail and the submit dock. The page keys it by code, so another problem
 * never inherits the typed code, pick or file.
 */
const props = defineProps<{
  problem: ProblemDetail;
  tabs: { id: string; labelKey: string }[];
  layout: (typeof PROBLEM_LAYOUT)[keyof typeof PROBLEM_LAYOUT];
  /** The viewer's contest holding this problem (its points and the viewer's cell replace the site-wide facts). */
  contest?: ContestDetail | null;
}>();
const tab = defineModel<string>('tab', { required: true });
defineEmits<{ gone: [] }>();
const route = useRoute();
// The submit form is this component's: the rail's card and the dock (desktop) or sheet (phone) are two doors to it.
const session = useSessionStore();
const isSignedIn = computed(() => session.status === 'authenticated');
const isPhone = useMediaQuery(PHONE_QUERY);
/** The dock starts open, the phone sheet closed so the statement is what a phone viewer sees first. */
const submitOpen = ref(!isPhone.value);
// Crossing the breakpoint swaps dock and sheet; each starts the way a fresh page would.
watch(isPhone, (phone) => (submitOpen.value = !phone));
// An anonymous viewer would only get a 401 for the fetch, so it is not started.
const resubmitId = computed(() =>
  isSignedIn.value && typeof route.query.resubmit === 'string' ? route.query.resubmit : null,
);
const submitForm = useSubmitForm(toRef(props, 'problem'), resubmitId);
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
  <div :class="layout.grid">
    <!-- The statement tab's card carries the problem header; on the editorial tab the card is header and tabs only. -->
    <Card
      as="div"
      data-testid="statement-card"
      :class="['min-w-0 rounded-panel p-6 sm:p-8', layout.left]"
    >
      <ProblemHeader :problem="problem">
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
    <aside
      data-testid="problem-rail"
      :aria-label="$t('problem.rail.railLabel')"
      :class="['-m-1 flex min-w-0 flex-col gap-3.5 p-1', layout.rail]"
    >
      <ProblemSubmitCard
        v-model:open="submitOpen"
        :problem="problem"
        :form="submitForm"
        :is-signed-in="isSignedIn"
      />
      <ProblemFactsCard :problem="problem" :is-signed-in="isSignedIn" :contest="contest" />
      <ProblemMySubmissions v-if="isSignedIn" :code="problem.code" :points="problem.points" />
      <ProblemLinksCard :problem="problem" :has-editorial="hasEditorial" />
    </aside>
    <div :class="['min-w-0', layout.left]">
      <CommentsSection
        v-if="tab === DEFAULT_TAB"
        type="problem"
        :page-key="problem.code"
        :contest-key="problem.contest?.contestKey ?? null"
        placeholder-key="comments.composer.problemPlaceholder"
        class="mt-3"
      />
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
    </div>
  </div>
  <!-- Keyed by code: another problem never inherits the typed code, pick or file. -->
  <SubmitDock
    :key="problem.code"
    v-model:open="submitOpen"
    :problem="problem"
    :form="submitForm"
    :is-phone="isPhone"
    :is-signed-in="isSignedIn"
    :resubmit-id="resubmitId"
  />
</template>
