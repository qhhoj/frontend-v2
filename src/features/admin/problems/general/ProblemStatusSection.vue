<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePermissions } from '@/stores/use-permissions';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import { ADMIN_BUTTON_CLASS } from '../../ui/classes';
import { toLocalInput } from '../../ui/datetime';
import { EDIT_ALL_PROBLEM, permissionLock } from './field-lock';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
const { can } = usePermissions();
const lockFor = (permission: string) => permissionLock(can, permission);
/** Legacy "make public and update publish date": turning the switch on offers today's date, so the problem lists as new. */
const isDateOffered = ref(false);
const onPublicToggled = (isPublic: boolean) => {
  isDateOffered.value = isPublic && can(EDIT_ALL_PROBLEM);
};
// A re-seeded form (save, refetch, another problem) is the server's state, not a toggle: the offer goes.
watch(
  () => form.value,
  () => (isDateOffered.value = false),
);
function setDateToNow() {
  form.value.date = toLocalInput(new Date().toISOString());
  isDateOffered.value = false;
}
</script>

<template>
  <SettingsCard :title="$t('admin.problems.status.title')">
    <div class="flex flex-col gap-5">
      <AdminSwitch
        v-model="form.isPublic"
        :label="$t('admin.problems.status.public')"
        :locked-by="lockFor('judge.change_public_visibility')"
        @update:model-value="onPublicToggled"
      />
      <div
        v-if="isDateOffered"
        role="status"
        class="flex flex-wrap items-center gap-3 rounded-row border border-line-strong p-3 text-sm"
      >
        <span class="min-w-0 flex-1">{{ $t('admin.problems.status.dateOffer') }}</span>
        <button type="button" :class="ADMIN_BUTTON_CLASS" @click="setDateToNow">
          {{ $t('admin.problems.status.dateNow') }}
        </button>
      </div>
      <AdminSwitch
        v-model="form.isManuallyManaged"
        :label="$t('admin.problems.status.manual')"
        :locked-by="lockFor('judge.change_manually_managed')"
      />
      <AdminSwitch
        v-model="form.isFullMarkup"
        :label="$t('admin.problems.status.fullMarkup')"
        :description="$t('admin.problems.status.fullMarkupHint')"
        :locked-by="lockFor('judge.problem_full_markup')"
      />
    </div>
  </SettingsCard>
</template>
