<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import { computed, nextTick, ref } from 'vue';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { NOTIFICATION_BITS } from '@/features/notifications/notification-bits';
import { useOfficialMode } from '@/features/official-mode/official-mode.queries';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import SettingsCard from '../settings/SettingsCard.vue';
import SettingsLayout from '../settings/SettingsLayout.vue';
import SettingsNotice from '../settings/SettingsNotice.vue';
import DefaultsFields from './DefaultsFields.vue';
import IdentityFields from './IdentityFields.vue';
import OrganizationsEditor from './OrganizationsEditor.vue';
import SaveBar from './SaveBar.vue';
import SaveErrorSummary from './SaveErrorSummary.vue';
import {
  PROFILE_FIELD_ORDER,
  invalidSummary,
  lengthErrors,
  saveErrorText,
  serverFieldErrors,
} from './profile-errors';
import { profileFieldId } from './profile-field-ids';
import { useProfileDraft } from './use-profile-draft';

const locale = useLocaleStore();
const session = useSessionStore();
const officialMode = useOfficialMode();
const { query, draft, dirty, problems, pending, error, attempted, justSaved, save, undo } =
  useProfileDraft();
const { data: profile, isPending, error: loadError, refetch } = query;
/** The summary exposes only `focus()`. */
const summaryNotice = ref<{ focus: () => void } | null>(null);
const identityFields = ref<{ showAboutWriteTab: () => void } | null>(null);
const revealAbout = () => identityFields.value?.showAboutWriteTab();

/** The viewer's live count wins over an older server message for the same field. */
const fieldErrors = computed(() => ({
  ...serverFieldErrors(error.value),
  ...lengthErrors(problems.value, locale.locale),
}));
const invalidFields = computed(() =>
  PROFILE_FIELD_ORDER.filter((field) => field in fieldErrors.value),
);
/** After a failed save: a summary whose links go to the invalid fields. */
const fieldSummary = computed(() => {
  if (!attempted.value || !invalidFields.value.length) return null;
  return {
    title: invalidSummary(invalidFields.value, locale.locale),
    items: invalidFields.value.map((field) => ({
      fieldId: profileFieldId(field),
      reveal: field === 'about' ? revealAbout : undefined,
      text: `${translate(`settings.profile.fieldName.${field}`)}: ${fieldErrors.value[field]}`,
    })),
  };
});
/** A failed save that no field explains (locked, offline, the organizations conflict). */
const saveErrorSentence = computed(() =>
  error.value && !invalidFields.value.length ? saveErrorText(error.value) : null,
);
const offline = computed(
  () => error.value instanceof ApiError && error.value.code === 'network_error',
);

/** A failed save that names fields moves the focus to the summary, which lists them. */
async function submit() {
  if (await save()) return;
  await nextTick();
  if (fieldSummary.value) summaryNotice.value?.focus();
}
</script>

<template>
  <SettingsLayout>
    <QueryState :loading="isPending" :error="loadError" @retry="refetch()">
      <template #skeleton>
        <Card as="div" class="flex flex-col gap-5 p-5 md:p-7">
          <SkeletonBlock class="h-6 w-32" />
          <SkeletonBlock class="h-[76px] w-full" />
          <SkeletonBlock class="h-[230px] w-full" />
        </Card>
      </template>
      <form v-if="draft && profile" class="flex flex-col gap-5" novalidate @submit.prevent="submit">
        <SaveErrorSummary
          v-if="fieldSummary"
          ref="summaryNotice"
          :title="fieldSummary.title"
          :items="fieldSummary.items"
        />
        <SettingsCard :title="$t('settings.nav.profile')" :lead="$t('settings.profile.lead')">
          <SettingsNotice v-if="justSaved" tone="success" bit="crown">
            {{ $t('settings.profile.saved') }}
          </SettingsNotice>
          <SettingsNotice v-else-if="saveErrorSentence" tone="error" bit="sweat">
            {{ saveErrorSentence }}
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
          <SettingsNotice
            v-if="officialMode.isLocked.value"
            tone="warning"
            :bit="NOTIFICATION_BITS.locked"
          >
            {{ $t('officialMode.profileNote') }}
          </SettingsNotice>
          <IdentityFields
            ref="identityFields"
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
        <DefaultsFields
          v-model:language-id="draft.languageId"
          v-model:timezone="draft.timezone"
          :errors="fieldErrors"
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
