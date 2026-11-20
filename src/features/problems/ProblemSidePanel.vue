<script setup lang="ts">
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import AdminEditLink from '@/features/admin/edit-link/AdminEditLink.vue';
import { problemEditTarget } from '@/features/admin/edit-link/admin-edit-targets';
import type { ProblemSection } from '@/features/admin/edit-link/admin-edit-targets';
import { useSessionStore } from '@/stores/session.store';
import PdfLink from './PdfLink.vue';
import ProblemLimits from './ProblemLimits.vue';
import ProblemMoreMenu from './ProblemMoreMenu.vue';
import ProblemMySubmissions from './ProblemMySubmissions.vue';
import ProblemTypesCard from './ProblemTypesCard.vue';
import SubmitOpenButton from './SubmitOpenButton.vue';
import SubmitSignInButton from './SubmitSignInButton.vue';
import type { ProblemLayout } from './problem-layout';
import type { ScoreScale } from './submit-result';
import type { useSubmitForm } from './use-submit-form';

/**
 * The side panel of the problem page: what the viewer needs while coding, beside the statement and sticky. Top half: the
 * page's primary "Nộp bài" (signed out: "Đăng nhập để nộp bài"; gone while the editor is open, which then holds the
 * primary) and the limits. Second half: the viewer's last submissions, the PDF, the staff's edit link and the "⋯" menu
 * (report, short link, material), and the types, folded. In one column (`layout.stacked`) the top half lies above the
 * statement and the second half under it, and the sheet's bar is the submit entry, so the button here is left out.
 */
defineProps<{
  problem: ProblemDetail;
  /** The tab being read; the edit link opens its editor tab. */
  section: ProblemSection;
  layout: ProblemLayout;
  isSignedIn: boolean;
  contest?: ContestDetail | null;
  form: ReturnType<typeof useSubmitForm>;
  /** The in-place editor is open. */
  submitOpen: boolean;
  usesSheet: boolean;
  scale: ScoreScale;
}>();
defineEmits<{ open: [] }>();
const session = useSessionStore();
</script>

<template>
  <aside
    data-testid="problem-rail"
    :aria-label="$t('problem.rail.railLabel')"
    :class="layout.panel"
  >
    <div :class="['flex min-w-0 flex-col gap-4', layout.panelTop]">
      <template v-if="!usesSheet">
        <SubmitOpenButton
          v-if="isSignedIn"
          :form="form"
          :open="submitOpen"
          show-result
          @open="$emit('open')"
        />
        <div v-else data-testid="submit-sign-in"><SubmitSignInButton /></div>
      </template>
      <ProblemLimits
        :problem="problem"
        :is-signed-in="isSignedIn"
        :contest="contest"
        :layout="layout"
      />
    </div>
    <div :class="['flex min-w-0 flex-col gap-4', layout.panelRest]">
      <ProblemMySubmissions v-if="isSignedIn" :code="problem.code" :scale="scale" />
      <div class="flex flex-wrap items-center gap-2" data-testid="problem-links">
        <PdfLink v-if="!problem.pdfStatementUrl" :problem="problem" />
        <AdminEditLink :to="problemEditTarget(session.user, problem, section)" />
        <ProblemMoreMenu :problem="problem" :is-signed-in="isSignedIn" />
      </div>
      <ProblemTypesCard :problem="problem" />
    </div>
  </aside>
</template>
