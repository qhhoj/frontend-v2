<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { ProblemDetail } from '@/api/types/problems';
import GlassCard from '@/components/GlassCard.vue';
import UserName from '@/components/UserName.vue';
import ProblemArchivedNotice from '@/features/organizations/problems/ProblemArchivedNotice.vue';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useSessionStore } from '@/stores/session.store';
import EditorialTab from './EditorialTab.vue';
import ProblemFactsCard from './ProblemFactsCard.vue';
import ProblemHeader from './ProblemHeader.vue';
import ProblemLinksCard from './ProblemLinksCard.vue';
import ProblemMySubmissions from './ProblemMySubmissions.vue';
import ProblemSubmissionsTab from './ProblemSubmissionsTab.vue';
import ProblemSubmitCard from './ProblemSubmitCard.vue';
import ProblemTabs from './ProblemTabs.vue';
import StatementBody from './StatementBody.vue';
import SubmitDock from './SubmitDock.vue';
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
</script>

<template>
  <ProblemArchivedNotice :code="problem.code" :organization-ids="problem.organizations" />
  <div :class="layout.grid">
    <ProblemHeader :problem="problem" :class="layout.left">
      <ProblemTabs v-model="tab" :tabs="tabs" :label="$t('problem.tabsLabel')" />
    </ProblemHeader>
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
      <ProblemFactsCard :problem="problem" :is-signed-in="isSignedIn" />
      <ProblemMySubmissions v-if="isSignedIn" :code="problem.code" :points="problem.points" />
      <ProblemLinksCard :problem="problem" :has-editorial="hasEditorial" />
    </aside>
    <div :class="['min-w-0', layout.left]">
      <div
        v-for="panel in tabs"
        :id="`problem-panel-${panel.id}`"
        :key="panel.id"
        role="tabpanel"
        :aria-labelledby="`problem-tab-${panel.id}`"
        :hidden="panel.id !== tab"
        :tabindex="panel.id === tab ? 0 : undefined"
      >
        <GlassCard
          v-if="panel.id === DEFAULT_TAB && tab === DEFAULT_TAB"
          as="div"
          data-testid="statement-card"
          class="rounded-panel p-6 sm:p-8"
        >
          <p v-if="!problem.translated" class="mb-4 text-sm text-muted">
            {{ $t('problem.untranslated') }}
          </p>
          <StatementBody :html="problem.descriptionHtml" />
          <p v-if="problem.authors.length" class="mt-6 text-sm text-muted">
            {{ $t('problem.authors') }}
            <template v-for="(author, index) in problem.authors" :key="author.id"
              ><template v-if="index">, </template><UserName :username="author.username"
            /></template>
          </p>
        </GlassCard>
        <!-- Mounted only while selected, so the editorial request is lazy. -->
        <EditorialTab
          v-if="panel.id === 'editorial' && tab === 'editorial'"
          :code="problem.code"
          @gone="$emit('gone')"
        />
        <ProblemSubmissionsTab
          v-if="panel.id === 'submissions' && tab === 'submissions'"
          :code="problem.code"
        />
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
