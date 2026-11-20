<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EditableContest } from '@/api/types/contest-editing';
import Checkbox from '@/components/ui/Checkbox.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import FormField from '@/components/ui/FormField.vue';
import Notice from '@/components/ui/Notice.vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import OrganizationChips from '../../ui/OrganizationChips.vue';
import UsernameChips from '../../ui/UsernameChips.vue';
import { needsPermissionText } from '../../ui/permission-text';
import TagChips from '../general/TagChips.vue';
import ContestParticipantsTab from '../participants/ContestParticipantsTab.vue';
import { PARTICIPANT_MODES, activeModes } from './participants-mode';
import type { ParticipantMode } from './participants-mode';
import type { ContestWorkbenchState } from './use-contest-workbench';

/**
 * Section "Thí sinh": who may take part, as one choice (members of organizations, anyone with the access code, a chosen
 * list, or no limit), then the people who have joined, with the list's own actions. The choice is saved by the page's
 * save bar; the list's actions apply at once. `listShown`: the list is read only once the section was opened.
 */
const props = defineProps<{
  contest: EditableContest;
  workbench: ContestWorkbenchState;
  listShown: boolean;
}>();
const moreOpen = defineModel<boolean>('moreOpen', { default: false });
const { t } = useI18n();
const { can } = usePermissions();
const locale = useLocaleStore();
const KEY = 'admin.contests.workbench.participants';
const FIELDS = 'admin.contests.general';
const PRIVATE = 'judge.create_private_contest';
const ACCESS_CODE = 'judge.contest_access_code';

const form = props.workbench.settings.form;
const mode = props.workbench.participantMode;
const hasStoredCode = computed(() => props.contest.requiresAccessCode);
const NEEDS: Record<ParticipantMode, string | null> = {
  organization: PRIVATE,
  list: PRIVATE,
  code: ACCESS_CODE,
  open: null,
};
/** A mode is offered to an account that may set its fields, or when it is the contest's mode already. */
const options = computed(() =>
  PARTICIPANT_MODES.filter(
    (value) => NEEDS[value] === null || can(NEEDS[value]) || mode.value === value,
  ).map((value) => ({ value, label: t(`${KEY}.modes.${value}`), testid: `contest-mode-${value}` })),
);
/** Leaving a mode clears its fields, which needs that mode's permission too. */
const lockedBy = computed(() => {
  const needed = NEEDS[mode.value];
  return needed !== null && !can(needed) ? needed : undefined;
});
const isLocked = computed(() => lockedBy.value !== undefined);
/** An old contest may limit in two ways at once; picking a mode keeps one. */
const mixed = computed(() => activeModes(form.value, hasStoredCode.value));
const joined = computed(() =>
  t(`${KEY}.joined`, { count: formatNumber(props.contest.userCount, locale.locale) }),
);
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="contest-participants">
    <div class="flex flex-col gap-2">
      <SegmentedControl
        size="sm"
        :label="$t(`${KEY}.label`)"
        :options="options"
        :model-value="mode"
        :disabled="isLocked"
        @update:model-value="workbench.pickParticipantMode($event)"
      />
      <p v-if="lockedBy" class="m-0 text-meta text-muted">{{ needsPermissionText(lockedBy) }}</p>
      <p class="m-0 text-meta text-muted" data-testid="contest-mode-note">
        {{ $t(`${KEY}.notes.${mode}`) }} {{ joined }}
      </p>
      <Notice v-if="mixed.length > 1" tone="warning" compact role="status">
        {{ $t(`${KEY}.mixed`, { modes: mixed.map((id) => $t(`${KEY}.modes.${id}`)).join(' + ') }) }}
      </Notice>
    </div>
    <OrganizationChips
      v-if="mode === 'organization'"
      v-model="form.organizations"
      :label="$t(`${FIELDS}.fields.organizations`)"
      :locked-by="can(PRIVATE) ? undefined : PRIVATE"
    />
    <UsernameChips
      v-if="mode === 'list'"
      v-model="form.privateContestants"
      :label="$t(`${FIELDS}.fields.privateContestants`)"
      :locked-by="can(PRIVATE) ? undefined : PRIVATE"
    />
    <div v-if="mode === 'code'" class="flex max-w-md flex-col gap-2">
      <FormField
        scale="admin"
        input-id="contest-accessCode"
        :label="$t(`${KEY}.code.${hasStoredCode ? 'replace' : 'set'}`)"
        :hint="
          can(ACCESS_CODE)
            ? $t(`${FIELDS}.hints.${hasStoredCode ? 'accessCodeSet' : 'accessCodeNone'}`)
            : needsPermissionText(ACCESS_CODE)
        "
        :error="workbench.isCodeMissing.value ? $t(`${KEY}.code.missing`) : undefined"
      >
        <TextInput
          v-model="form.accessCode"
          type="password"
          autocomplete="new-password"
          :disabled="!can(ACCESS_CODE) || form.removeAccessCode"
        />
      </FormField>
      <Checkbox
        v-if="hasStoredCode && can(ACCESS_CODE)"
        v-model="form.removeAccessCode"
        input-id="contest-removeAccessCode"
        :label="$t(`${FIELDS}.fields.removeAccessCode`)"
      />
    </div>
    <Disclosure v-model:open="moreOpen" :label="$t(`${KEY}.more`)">
      <div class="grid gap-4 pt-2 md:grid-cols-2">
        <UsernameChips v-model="form.bannedUsers" :label="$t(`${FIELDS}.fields.bannedUsers`)" />
        <TagChips v-model="form.bannedJudges" :label="$t(`${FIELDS}.fields.bannedJudges`)" />
      </div>
    </Disclosure>
    <section class="flex flex-col gap-3" :aria-label="$t(`${KEY}.list`)">
      <h3 class="m-0 text-body font-semibold">{{ $t(`${KEY}.list`) }}</h3>
      <ContestParticipantsTab v-if="listShown" :contest="contest" />
    </section>
  </div>
</template>
