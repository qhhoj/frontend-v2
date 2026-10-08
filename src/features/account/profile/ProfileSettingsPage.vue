<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsLayout from '../settings/SettingsLayout.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';
import IdentityFields from './IdentityFields.vue';
import OrganizationsEditor from './OrganizationsEditor.vue';
import SaveBar from './SaveBar.vue';
import { invalidSummary, lengthErrors, saveErrorText, serverFieldErrors } from './profile-errors';
import { useProfileDraft } from './use-profile-draft';

/** Screen order: the summary names the fields in the order the viewer meets them. */
const PROFILE_FIELD_ORDER = ['firstName', 'about', 'organizations', 'languageId', 'timezone'];
const locale = useLocaleStore();
const session = useSessionStore();
const { query, draft, dirty, problems, pending, error, attempted, justSaved, save, undo } =
  useProfileDraft();
const { data: profile, isPending, error: loadError, refetch } = query;
const formElement = ref<HTMLFormElement | null>(null);

/** The viewer's live count wins over an older server message for the same field. */
const fieldErrors = computed(() => ({
  ...serverFieldErrors(error.value),
  ...lengthErrors(problems.value, locale.locale),
}));
const invalidFields = computed(() =>
  PROFILE_FIELD_ORDER.filter((field) => field in fieldErrors.value),
);
const summary = computed(() => {
  if (!attempted.value && !error.value) return null;
  return invalidFields.value.length
    ? invalidSummary(invalidFields.value, locale.locale)
    : saveErrorText(error.value);
});
const offline = computed(
  () => error.value instanceof ApiError && error.value.code === 'network_error',
);

/** A failed save puts the focus on the first field that is wrong, so the viewer can fix it at once. */
async function submit() {
  if (await save()) return;
  await nextTick();
  formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}
</script>

<template>
  <SettingsLayout>
    <QueryState :loading="isPending" :error="loadError" @retry="refetch()">
      <template #skeleton>
        <div class="glass flex flex-col gap-5 rounded-card p-5 md:p-7">
          <SkeletonBlock class="h-6 w-32" />
          <SkeletonBlock class="h-[76px] w-full" />
          <SkeletonBlock class="h-[230px] w-full" />
        </div>
      </template>
      <form
        v-if="draft && profile"
        ref="formElement"
        class="flex flex-col gap-5"
        novalidate
        @submit.prevent="submit"
      >
        <SettingsCard :title="$t('settings.nav.profile')" :lead="$t('settings.profile.lead')">
          <SettingsNotice v-if="justSaved" tone="success" bit="crown">
            {{ $t('settings.profile.saved') }}
          </SettingsNotice>
          <SettingsNotice v-if="summary" tone="error" bit="sweat">
            {{ summary }}
            <template v-if="offline" #action>
              <button
                type="button"
                class="min-h-11 rounded-pill px-3 font-semibold underline"
                @click="submit"
              >
                {{ $t('common.retry') }}
              </button>
            </template>
          </SettingsNotice>
          <IdentityFields
            v-model:first-name="draft.firstName"
            v-model:about="draft.about"
            :username="session.user?.username ?? ''"
            :saved-about-html="profile.aboutHtml"
            :errors="fieldErrors"
          />
        </SettingsCard>
        <OrganizationsEditor
          v-model="draft.organizationIds"
          :organizations="profile.organizations"
          :error="fieldErrors.organizations"
        />
        <SaveBar
          :dirty="dirty"
          :pending="pending"
          :invalid-count="attempted ? invalidFields.length : 0"
          @undo="undo"
        />
      </form>
    </QueryState>
  </SettingsLayout>
</template>
