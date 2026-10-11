<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { translate } from '@/i18n';
import { useRouter } from 'vue-router';
import { createContest, createOrganizationContest } from '@/api/contest-editing.api';
import type { ContestBody, EditableContest } from '@/api/types/contest-editing';
import CreationOwnerPicker from '../../creation/CreationOwnerPicker.vue';
import type { CreationOwner } from '../../creation/creation-owners';
import { failureTextOf } from '../../ui/admin-errors';
import AdminPageHeader from '../../ui/AdminPageHeader.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import { CARD, buttonClass } from '../../ui/controls';
import AdminSaveBar from '../../ui/form/AdminSaveBar.vue';
import { useEditorView } from '../../ui/form/use-editor-view';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY } from '../contest-editing.queries';
import { canSetVisible, checkContestForm, emptyContestForm, toContestBody } from '../contest-form';
import { usePermissions } from '@/stores/use-permissions';
import ContestGeneralForm from './ContestGeneralForm.vue';
import { CONTEST_BASIC_FIELDS } from './contest-views';

const router = useRouter();
const { can } = usePermissions();
const form = ref(emptyContestForm());
/** Mock-up 2C: an owning organization makes the contest its members-only one; the server sets those fields. */
const owner = ref<CreationOwner | null>(null);
/** Members of the owning organization should see the contest: it starts visible when the account may set that. */
watch(owner, (picked) => {
  form.value.isVisible = Boolean(picked) && canSetVisible(form.value, can, true);
});
const isOwnerReady = ref(false);
const localErrors = computed(() => checkContestForm(form.value));
/** Errors show once a save was tried, not while the first field is still being typed. */
const hasTried = ref(false);
const mutation = useAdminMutation({
  mutate: (body: ContestBody) =>
    owner.value ? createOrganizationContest(owner.value.slug, body) : createContest(body),
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

const EMPTY_FORM = emptyContestForm();
const { view, errorViews, revealErrors } = useEditorView(
  () => shownErrors.value,
  CONTEST_BASIC_FIELDS,
);

/**
 * Nothing is sent while a local check fails; the create body keeps out every group the account may not set. A refusal in
 * the view out of sight brings that view up.
 */
async function create() {
  hasTried.value = true;
  if (Object.keys(localErrors.value).length === 0 && isOwnerReady.value)
    await mutation.run(toContestBody(form.value, can, Boolean(owner.value)));
  await revealErrors();
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
      <section :class="CARD" class="p-4 sm:p-5">
        <CreationOwnerPicker v-model="owner" v-model:ready="isOwnerReady" kind="contest" />
      </section>
      <ContestGeneralForm
        v-model="form"
        :errors="shownErrors"
        :is-create="true"
        :has-codes="{ access: false, ranking: false }"
        :view="view"
        :error-views="errorViews"
        :saved="EMPTY_FORM"
        :owner="owner"
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
