<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminField from '../../ui/AdminField.vue';
import { INPUT, buttonClass } from '../../ui/controls';
import AdminNotice from '../../ui/feedback/AdminNotice.vue';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import { EDIT_ALL_PROBLEM, permissionLock } from './field-lock';
import type { ProblemForm } from './problem-form';
import PublishReadinessNote from './PublishReadinessNote.vue';

const form = defineModel<ProblemForm>({ required: true });
/** The revision comment of the next save (edit only; the create form leaves it out). */
const changeMessage = defineModel<string>('changeMessage');
/** `privateCode`: the saved problem's code while it is still private, so publishing it can be checked; unset on create and once public. */
/** `canPublishToMembers`: the API's `editor.canPublishToMembers` (an organization creator may show an organization-private problem to its members without `judge.change_public_visibility`). */
const props = defineProps<{
  privateCode?: string;
  sectionId?: string;
  hasChangeMessage?: boolean;
  canPublishToMembers?: boolean;
}>();
const { can } = usePermissions();
const lockFor = (permission: string) => permissionLock(can, permission);
/** Legacy "make public and update publish date": ticking Public offers today's date, so the problem lists as new. */
const isDateOffered = ref(false);
watch(
  () => form.value.isPublic,
  (isPublic, wasPublic) => {
    if (isPublic !== wasPublic) isDateOffered.value = isPublic && can(EDIT_ALL_PROBLEM);
  },
);
// A re-seeded form (save, refetch, another problem) is the server's state, not a toggle: the offer goes.
watch(
  () => form.value,
  () => (isDateOffered.value = false),
);
function setDateToNow() {
  const now = new Date();
  now.setSeconds(0, 0);
  form.value.date = now.toISOString();
  isDateOffered.value = false;
}
</script>

<template>
  <AdminFormSection
    :id="sectionId"
    :title="$t('admin.problems.status.title')"
    :description="$t('admin.problems.general.descriptions.status')"
    :columns="1"
  >
    <AdminCheckbox
      v-model="form.isPublic"
      input-id="problem-isPublic"
      :label="$t('admin.problems.status.public')"
      :description="props.canPublishToMembers ? $t('admin.creation.publishToMembers') : undefined"
      :locked-by="props.canPublishToMembers ? undefined : lockFor('judge.change_public_visibility')"
    />
    <PublishReadinessNote
      v-if="privateCode && form.isPublic"
      :code="privateCode"
      :points="form.points"
    />
    <AdminNotice v-if="isDateOffered" :title="$t('admin.problems.status.dateOffer')">
      <template #action>
        <button
          type="button"
          :class="[buttonClass('secondary', 'sm'), 'mt-2']"
          @click="setDateToNow"
        >
          {{ $t('admin.problems.status.dateNow') }}
        </button>
      </template>
    </AdminNotice>
    <AdminCheckbox
      v-model="form.isManuallyManaged"
      input-id="problem-isManuallyManaged"
      :label="$t('admin.problems.status.manual')"
      :locked-by="lockFor('judge.change_manually_managed')"
    />
    <AdminCheckbox
      v-model="form.isFullMarkup"
      input-id="problem-isFullMarkup"
      :label="$t('admin.problems.status.fullMarkup')"
      :description="$t('admin.problems.status.fullMarkupHint')"
      :locked-by="lockFor('judge.problem_full_markup')"
    />
    <AdminField
      v-if="hasChangeMessage"
      v-slot="{ id, describedBy }"
      class="max-w-xl"
      input-id="problem-changeMessage"
      :label="$t('admin.problems.general.changeMessage')"
      :hint="$t('admin.problems.general.changeMessagePlaceholder')"
    >
      <input
        :id="id"
        v-model="changeMessage"
        type="text"
        maxlength="500"
        :class="INPUT"
        :aria-describedby="describedBy"
      />
    </AdminField>
  </AdminFormSection>
</template>
