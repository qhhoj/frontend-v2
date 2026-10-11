<script setup lang="ts">
import { computed } from 'vue';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { usePermissions } from '@/stores/use-permissions';
import AdminSwitch from '../../ui/AdminSwitch.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import OrganizationChips from '../../ui/OrganizationChips.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import { EDIT_ALL_PROBLEM, permissionLock } from './field-lock';
import type { ProblemForm } from './problem-form';
import type { UserSummaryView } from '@/api/types/problem-editing';
import AdminUserLabel from '../../ui/AdminUserLabel.vue';

const form = defineModel<ProblemForm>({ required: true });
/** `isSuggestionPending`: the saved problem is still private, so the suggestion awaits review. */
defineProps<{
  errors: FieldErrors;
  suggester: UserSummaryView | null;
  isSuggestionPending: boolean;
}>();
const { can } = usePermissions();
/** Staff-only people and organizations: a viewer without `judge.edit_all_problem` sees them locked. */
const staffLock = computed(() => permissionLock(can, EDIT_ALL_PROBLEM));
</script>

<template>
  <SettingsCard :title="$t('admin.problems.people.title')">
    <p
      v-if="suggester"
      data-testid="people-suggester"
      class="flex flex-wrap items-center gap-2 text-sm"
    >
      {{ $t('admin.problems.people.suggester') }}
      <AdminUserLabel :username="suggester.username" :rating="suggester.rating" />
      <span v-if="isSuggestionPending" class="text-muted">{{
        $t('admin.problems.people.suggesterPending')
      }}</span>
    </p>
    <div class="grid gap-5 sm:grid-cols-2">
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
      <AdminSwitch
        v-model="form.isOrganizationPrivate"
        :label="$t('admin.problems.people.orgPrivate')"
        :description="$t('admin.problems.people.orgPrivateHint')"
        :locked-by="staffLock"
      />
    </div>
  </SettingsCard>
</template>
