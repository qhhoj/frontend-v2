<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import { buttonClass } from '../../ui/controls';
import AdminNotice from '../../ui/feedback/AdminNotice.vue';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import { EDIT_ALL_PROBLEM, permissionLock } from './field-lock';
import type { ProblemForm } from './problem-form';
import PublishReadinessNote from './PublishReadinessNote.vue';

/**
 * "Công khai" with what goes with it: the readiness checklist of a saved private problem being published, and the legacy
 * "make public and update publish date" offer.
 * `privateCode`: the saved problem's code while it is still private; `canPublishToMembers`: the API's
 * `editor.canPublishToMembers` (an organization creator may show an organization-private problem to its members without
 * `judge.change_public_visibility`).
 */
const form = defineModel<ProblemForm>({ required: true });
const props = defineProps<{ privateCode?: string; canPublishToMembers?: boolean }>();
const { can } = usePermissions();
/** Ticking Public offers today's date, so the problem lists as new. */
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
  <AdminCheckbox
    v-model="form.isPublic"
    input-id="problem-isPublic"
    :label="$t('admin.problems.status.public')"
    :description="props.canPublishToMembers ? $t('admin.creation.publishToMembers') : undefined"
    :locked-by="
      props.canPublishToMembers ? undefined : permissionLock(can, 'judge.change_public_visibility')
    "
  />
  <PublishReadinessNote
    v-if="privateCode && form.isPublic"
    :code="privateCode"
    :points="form.points"
  />
  <AdminNotice v-if="isDateOffered" :title="$t('admin.problems.status.dateOffer')">
    <template #action>
      <button type="button" :class="[buttonClass('secondary', 'sm'), 'mt-2']" @click="setDateToNow">
        {{ $t('admin.problems.status.dateNow') }}
      </button>
    </template>
  </AdminNotice>
</template>
