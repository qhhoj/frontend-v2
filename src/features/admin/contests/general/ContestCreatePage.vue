<script setup lang="ts">
import { computed, ref } from 'vue';
import { translate } from '@/i18n';
import { useRouter } from 'vue-router';
import { createContest } from '@/api/contest-editing.api';
import type { ContestBody, EditableContest } from '@/api/types/contest-editing';
import { failureTextOf } from '../../ui/admin-errors';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { buttonClass } from '../../ui/controls';
import AdminSaveBar from '../../ui/form/AdminSaveBar.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY } from '../contest-editing.queries';
import { checkContestForm, emptyContestForm, toContestBody } from '../contest-form';
import { usePermissions } from '@/stores/use-permissions';
import ContestGeneralForm from './ContestGeneralForm.vue';

const router = useRouter();
const { can } = usePermissions();
const form = ref(emptyContestForm());
const localErrors = computed(() => checkContestForm(form.value));
/** Errors show once a save was tried, not while the first field is still being typed. */
const hasTried = ref(false);
const mutation = useAdminMutation({
  mutate: (body: ContestBody) => createContest(body),
  invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
  successText: (created: EditableContest) =>
    translate('admin.contests.create.done', { key: created.key }),
  onDone: (created: EditableContest) => {
    void router.push({ name: 'admin-contestGeneral', params: { key: created.key } });
  },
});
const shownErrors = computed(() => ({
  ...(hasTried.value ? localErrors.value : {}),
  ...mutation.fieldErrors.value,
}));

/** Nothing is sent while a local check fails; the create body keeps out every group the account may not set. */
async function create() {
  hasTried.value = true;
  if (Object.keys(localErrors.value).length > 0) return;
  await mutation.run(toContestBody(form.value, can));
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminPageHeader
      :title="$t('admin.contests.create.title')"
      :lead="$t('admin.contests.create.lead')"
      :back="{ to: { name: 'admin-contests' }, label: $t('admin.contests.index.title') }"
    />
    <form class="flex flex-col gap-6" novalidate @submit.prevent="create">
      <ContestGeneralForm
        v-model="form"
        :errors="shownErrors"
        :is-create="true"
        :has-codes="{ access: false, ranking: false }"
      />
      <AdminStatus
        v-if="mutation.failure.value"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
      <AdminSaveBar
        :dirty-count="0"
        allow-clean
        :pending="mutation.isPending.value"
        :save-label="$t('admin.contests.create.submit')"
      >
        <template #status>
          <span class="text-muted">{{ $t('admin.contests.create.required') }}</span>
        </template>
        <template #actions>
          <RouterLink :to="{ name: 'admin-contests' }" :class="buttonClass('ghost')">
            {{ $t('admin.contests.create.cancel') }}
          </RouterLink>
        </template>
      </AdminSaveBar>
    </form>
  </div>
</template>
