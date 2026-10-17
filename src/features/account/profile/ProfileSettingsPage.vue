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
import SaveBar from '@/components/ui/SaveBar.vue';
import AdminLeaveGuard from '@/features/admin/ui/form/AdminLeaveGuard.vue';
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
const {
  query,
  draft,
  changedCount,
  problems,
  pending,
  error,
  attempted,
  saved,
  savedAt,
  save,
  undo,
} = useProfileDraft();
const { data: profile, isPending, error: loadError, refetch } = query;
/** "Đã lưu lúc …" in the zone the viewer keeps on their profile, not the site's. */
const savedTimeZone = computed(() => saved.value?.timezone || undefined);
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
/** After a failed save that named fields, the bar says what to fix (saving stays possible: a server error clears only on the next save). */
const fixText = computed(() =>
  attempted.value && invalidFields.value.length
    ? translate('settings.profile.fixToSave', { count: invalidFields.value.length })
    : null,
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
          <SettingsNotice v-if="saveErrorSentence" tone="error" bit="sweat">
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
          >
            <DefaultsFields
              v-model:language-id="draft.languageId"
              v-model:timezone="draft.timezone"
              :errors="fieldErrors"
            />
          </IdentityFields>
        </SettingsCard>
        <OrganizationsEditor
          v-model="draft.organizationIds"
          :organizations="profile.organizations"
          :error="fieldErrors.organizations"
        />
        <!-- The save result lives here and only here. The bar's edges follow the layout's gutters (the nav sits beside it from lg). -->
        <SaveBar
          class="[--qa-gutter:1rem] md:[--qa-gutter:2rem] lg:rounded-t-card lg:[--qa-gutter:0px] lg:px-5"
          :dirty-count="changedCount"
          :pending="pending"
          :saved-at="savedAt"
          :time-zone="savedTimeZone"
          hide-idle-on-phone
          @discard="undo"
        >
          <template v-if="fixText" #status>
            <span class="font-semibold text-negative">{{ fixText }}</span>
          </template>
        </SaveBar>
      </form>
    </QueryState>
    <AdminLeaveGuard :dirty-count="changedCount" />
  </SettingsLayout>
</template>
