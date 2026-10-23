<script setup lang="ts">
import { computed, ref } from 'vue';
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
import { provideDateValidity } from '../../ui/form/date-validity';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { CONTEST_INDEX_KEY, PUBLIC_CONTESTS_KEY } from '../contest-editing.queries';
import {
  checkContestForm,
  checkContestIdentity,
  emptyContestForm,
  toContestBody,
} from '../contest-form';
import { usePermissions } from '@/stores/use-permissions';
import ContestBasicForm from './ContestBasicForm.vue';

/**
 * Creating a contest asks only what it cannot start without: key, name, time and owner. Everything else is edited
 * afterwards, starting on the problems tab.
 */
const router = useRouter();
const { can } = usePermissions();
const form = ref(emptyContestForm());
/**
 * Mock-up 2C: an owning organization makes the contest its members-only one; the server sets those fields. Every new
 * contest starts hidden, also for members: it is shown from the summary's switch once its problems are in.
 */
const owner = ref<CreationOwner | null>(null);
const isOwnerReady = ref(false);
const isOwnerBlocked = ref(false);
/** The picker is not ready while it loads and while there is nowhere to create; the save bar says which instead of doing nothing. */
const ownerBlockedText = computed(() => {
  if (isOwnerReady.value) return undefined;
  return translate(
    isOwnerBlocked.value ? 'admin.creation.owner.blocked' : 'admin.creation.owner.loading',
  );
});
const localErrors = computed(() => ({
  ...checkContestForm(form.value),
  ...checkContestIdentity(form.value),
}));
/** Errors show once a save was tried, not while the first field is still being typed. */
const hasTried = ref(false);
const { hasUnreadableDate } = provideDateValidity();
const mutation = useAdminMutation({
  mutate: (body: ContestBody) =>
    owner.value ? createOrganizationContest(owner.value.slug, body) : createContest(body),
  invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
  successText: (created: EditableContest) =>
    translate('admin.contests.create.done', { key: created.key }),
  onDone: (created: EditableContest) => {
    void router.push({ name: 'admin-contestProblems', params: { key: created.key } });
  },
});
/** A refusal already written under a field ("Khóa này đã có.") needs no second line. */
const hasServerFieldErrors = computed(() => Object.keys(mutation.fieldErrors.value).length > 0);
const shownErrors = computed(() => ({
  ...(hasTried.value ? localErrors.value : {}),
  ...mutation.fieldErrors.value,
}));

/** Nothing is sent while a local check fails; the create body keeps out every group the account may not set. */
async function create() {
  hasTried.value = true;
  if (Object.keys(localErrors.value).length === 0 && !hasUnreadableDate.value && isOwnerReady.value)
    await mutation.run(toContestBody(form.value, can, Boolean(owner.value)));
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <AdminPageHeader
      :title="$t('admin.contests.create.title')"
      :lead="$t('admin.contests.create.lead')"
      :back="{ to: { name: 'admin-contests' }, label: $t('admin.contests.index.title') }"
    />
    <form class="flex max-w-4xl flex-col gap-6" novalidate @submit.prevent="create">
      <div :class="[CARD, 'flex min-w-0 flex-col']">
        <ContestBasicForm v-model="form" :errors="shownErrors" :is-create="true" :owner="owner" />
        <div class="border-t border-line px-4 py-5 sm:px-5">
          <CreationOwnerPicker
            v-model="owner"
            v-model:ready="isOwnerReady"
            v-model:blocked="isOwnerBlocked"
            kind="contest"
            layout="field"
          />
        </div>
      </div>
      <AdminStatus
        v-if="mutation.failure.value && !hasServerFieldErrors"
        kind="refused"
        :text="failureTextOf(mutation.failure.value)"
      />
      <AdminSaveBar
        :dirty-count="0"
        allow-clean
        :pending="mutation.isPending.value"
        :save-label="$t('admin.contests.create.submit')"
        :blocked-reason="ownerBlockedText"
      >
        <template v-if="!ownerBlockedText" #status>
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
