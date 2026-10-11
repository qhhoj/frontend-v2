<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createContest } from '@/api/contest-editing.api';
import type { ContestBody, EditableContest } from '@/api/types/contest-editing';
import { failureTextOf } from '../../ui/admin-errors';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { ADMIN_PRIMARY_CLASS } from '../../ui/classes';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY } from '../contest-editing.queries';
import { checkContestForm, emptyContestForm, toContestBody } from '../contest-form';
import { usePermissions } from '@/stores/use-permissions';
import ContestGeneralForm from './ContestGeneralForm.vue';

const router = useRouter();
const { can } = usePermissions();
const form = ref(emptyContestForm());
const localErrors = computed(() => checkContestForm(form.value));
const mutation = useAdminMutation({
  mutate: (body: ContestBody) => createContest(body),
  invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
  onDone: (created: EditableContest) => {
    void router.push({ name: 'admin-contestGeneral', params: { key: created.key } });
  },
});
const shownErrors = computed(() => ({ ...localErrors.value, ...mutation.fieldErrors.value }));

/** Nothing is sent while a local check fails; the create body keeps out every group the account may not set. */
async function create() {
  if (Object.keys(localErrors.value).length > 0) return;
  await mutation.run(toContestBody(form.value, can));
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminPageHeader :title="$t('admin.contests.create.title')" />
    <form class="flex flex-col gap-6" @submit.prevent="create">
      <ContestGeneralForm
        v-model="form"
        :errors="shownErrors"
        :is-create="true"
        :has-codes="{ access: false, ranking: false }"
      />
      <div class="flex flex-wrap items-center gap-3">
        <button type="submit" :class="ADMIN_PRIMARY_CLASS">
          {{ $t('admin.contests.create.submit') }}
        </button>
        <AdminStatus
          v-if="mutation.failure.value"
          kind="refused"
          :text="failureTextOf(mutation.failure.value)"
        />
      </div>
    </form>
  </div>
</template>
