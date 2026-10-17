<script setup lang="ts">
import { computed } from 'vue';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import AdminStatus from '../../ui/AdminStatus.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { CARD } from '../../ui/controls';
import AdminLeaveGuard from '../../ui/form/AdminLeaveGuard.vue';
import AdminSaveBar from '../../ui/form/AdminSaveBar.vue';
import AdminSectionNav from '../../ui/form/AdminSectionNav.vue';
import EditorViewTabs from '../../ui/form/EditorViewTabs.vue';
import { useEditorView } from '../../ui/form/use-editor-view';
import ProblemDangerZone from '../lifecycle/ProblemDangerZone.vue';
import ProblemGeneralForm from './ProblemGeneralForm.vue';
import ProblemVisibilityCard from './ProblemVisibilityCard.vue';
import { PROBLEM_SECTION_IDS, problemSections } from './problem-sections';
import { problemAdvancedCount, PROBLEM_BASIC_FIELDS } from './problem-views';
import { useProblemForm } from './use-problem-form';

/**
 * The Basic/Advanced switch, one form card, and the save bar for both views. Basic opens with the visibility card, which saves on its own. Advanced adds the danger zone under the card
 * and a section rail from 1280 px ("Đi tới mục" below). Attachments live on the Files tab, Polygon on the Data tab, clone
 * in the header's "Thêm" menu.
 */
const props = defineProps<{ problem: EditableProblem; meta: ProblemEditingMeta }>();
const { form, seed, dirtyCount, savedAt, save, discard, errors, mutation, changeMessage } =
  useProblemForm(
    () => props.problem,
    () => props.meta,
  );
const { view, errorViews, revealErrors } = useEditorView(() => errors.value, PROBLEM_BASIC_FIELDS);
const advancedCount = computed(() => problemAdvancedCount(form.value, seed.value, props.meta));
/** One save for both views; a refusal in the view out of sight brings that view up. */
async function submit() {
  await save();
  await revealErrors();
}
const { can } = usePermissions();
const canDelete = computed(() => can('judge.delete_problem'));
const sections = computed(() => problemSections(canDelete.value));
/** A refusal no field shows (a field error is already under its box) goes above the save bar. */
const pageFailure = computed(() =>
  mutation.failure.value && Object.keys(mutation.fieldErrors.value).length === 0
    ? failureTextOf(mutation.failure.value)
    : null,
);
const FORM_ID = 'problem-general-form';
const isAdvanced = computed(() => view.value === 'advanced');
</script>

<template>
  <div class="flex flex-col gap-4">
    <EditorViewTabs :view="view" :advanced-count="advancedCount" :error-views="errorViews" />
    <AdminSectionNav
      v-if="isAdvanced"
      :sections="sections"
      mode="select"
      class="max-w-xs xl:hidden"
    />
    <div
      class="grid gap-6"
      :class="isAdvanced ? 'xl:grid-cols-[minmax(0,55rem)_15rem] xl:items-start' : 'max-w-[55rem]'"
    >
      <div class="flex min-w-0 flex-col gap-6">
        <ProblemVisibilityCard v-if="!isAdvanced" :problem="problem" />
        <form :id="FORM_ID" novalidate @submit.prevent="submit">
          <fieldset
            :disabled="mutation.isPending.value"
            :class="[CARD, 'm-0 flex min-w-0 flex-col p-0']"
          >
            <ProblemGeneralForm
              v-model="form"
              v-model:change-message="changeMessage"
              :view="view"
              :meta="meta"
              :errors="errors"
              :suggester="problem.editor?.suggester ?? null"
              :is-suggestion-pending="!problem.isPublic"
              has-change-message
            />
          </fieldset>
        </form>
        <div v-if="isAdvanced && canDelete" :id="PROBLEM_SECTION_IDS.danger">
          <ProblemDangerZone :code="problem.code" />
        </div>
      </div>
      <AdminSectionNav v-if="isAdvanced" :sections="sections" class="hidden xl:flex" />
    </div>
    <AdminStatus v-if="pageFailure" kind="refused" :text="pageFailure" />
    <AdminSaveBar
      data-testid="problem-save-bar"
      :form="FORM_ID"
      :dirty-count="dirtyCount"
      :pending="mutation.isPending.value"
      :saved-at="savedAt"
      @discard="discard"
    />
    <AdminLeaveGuard :dirty-count="dirtyCount" />
  </div>
</template>
