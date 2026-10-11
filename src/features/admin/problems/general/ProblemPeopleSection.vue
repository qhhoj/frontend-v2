<script setup lang="ts">
import { computed } from 'vue';
import type { UserSummaryView } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import AdminUserLabel from '../../ui/AdminUserLabel.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import OrganizationChips from '../../ui/OrganizationChips.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import { EDIT_ALL_PROBLEM, permissionLock } from './field-lock';
import type { ProblemForm } from './problem-form';

const form = defineModel<ProblemForm>({ required: true });
/** `isSuggestionPending`: the saved problem is still private, so the suggestion awaits review. */
defineProps<{
  errors: FieldErrors;
  suggester: UserSummaryView | null;
  isSuggestionPending: boolean;
  sectionId?: string;
}>();
const { can } = usePermissions();
/** Staff-only people and organizations: a viewer without `judge.edit_all_problem` sees them locked. */
const staffLock = computed(() => permissionLock(can, EDIT_ALL_PROBLEM));
</script>

<template>
  <AdminFormSection
    :id="sectionId"
    :title="$t('admin.problems.people.title')"
    :description="$t('admin.problems.general.descriptions.people')"
  >
    <p
      v-if="suggester"
      data-testid="people-suggester"
      class="flex flex-wrap items-center gap-2 text-sm lg:col-span-2"
    >
      {{ $t('admin.problems.people.suggester') }}
      <AdminUserLabel :username="suggester.username" :rating="suggester.rating" />
      <span v-if="isSuggestionPending" class="text-muted">{{
        $t('admin.problems.people.suggesterPending')
      }}</span>
    </p>
    <UsernameChips
      v-model="form.authors"
      data-testid="people-authors"
      :label="$t('admin.problems.people.authors')"
      :locked-by="staffLock"
      :error="errors.authors"
    />
    <UsernameChips
      v-model="form.curators"
      data-testid="people-curators"
      :label="$t('admin.problems.people.curators')"
      :locked-by="staffLock"
      :error="errors.curators"
    />
    <UsernameChips
      v-model="form.testers"
      data-testid="people-testers"
      :label="$t('admin.problems.people.testers')"
      :error="errors.testers"
    />
    <UsernameChips
      v-model="form.bannedUsers"
      data-testid="people-bannedUsers"
      :label="$t('admin.problems.people.banned')"
      :locked-by="staffLock"
      :error="errors.bannedUsers"
    />
    <OrganizationChips
      v-model="form.organizations"
      data-testid="people-organizations"
      :label="$t('admin.problems.people.organizations')"
      :locked-by="staffLock"
      :error="errors.organizations"
    />
    <AdminCheckbox
      v-model="form.isOrganizationPrivate"
      class="lg:mt-7"
      input-id="problem-isOrganizationPrivate"
      :label="$t('admin.problems.people.orgPrivate')"
      :description="$t('admin.problems.people.orgPrivateHint')"
      :locked-by="staffLock"
    />
  </AdminFormSection>
</template>
