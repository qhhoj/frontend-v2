<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EditableContest } from '@/api/types/contest-editing';
import AppButton from '@/components/ui/AppButton.vue';
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
import { PARTICIPANT_MODES } from './participants-mode';
import type { ParticipantMode, Restriction } from './participants-mode';
import { useAccessChangeLines } from './use-access-change-lines';
import type { ContestWorkbenchState } from './use-contest-workbench';

/**
 * Section "Thí sinh": who may take part, as one choice (members of organizations, anyone with the access code, a chosen
 * list, or no limit), then the people who have joined, with the list's own actions. A contest that has two or three
 * restrictions at once shows each of them and no chosen mode. A pick changes nothing by itself: the section lists what
 * the save would remove and add, and a restriction that is not filled in blocks the save with the reason at its field.
 * The choice is saved by the page's save bar; the list's actions apply at once. `listShown`: the list is read only
 * once the section was opened.
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
const { mode, restrictions, gaps, refusal, pick, undo } = props.workbench.participants;
const hasStoredCode = computed(() => props.contest.requiresAccessCode);
const NEEDS: Record<Restriction, string> = {
  organization: PRIVATE,
  list: PRIVATE,
  code: ACCESS_CODE,
};
const mayPick = (value: ParticipantMode) => value === 'open' || can(NEEDS[value]);
/** A mode is offered to an account that may set its fields, or when it is the contest's mode already. */
const options = computed(() =>
  PARTICIPANT_MODES.filter((value) => mayPick(value) || mode.value === value).map((value) => ({
    value,
    label: t(`${KEY}.modes.${value}`),
    testid: `contest-mode-${value}`,
  })),
);
/** A pick switches off every other restriction, which needs the permission of each one that is on. */
const lockedBy = computed(() =>
  restrictions.value.map((restriction) => NEEDS[restriction]).find((needed) => !can(needed)),
);
const note = computed(() =>
  mode.value === null
    ? t(`${KEY}.mixed`, {
        modes: restrictions.value.map((id) => t(`${KEY}.modes.${id}`)).join(' + '),
      })
    : t(`${KEY}.notes.${mode.value}`),
);
const joined = computed(() =>
  t(`${KEY}.joined`, { count: formatNumber(props.contest.userCount, locale.locale) }),
);
const gapText = (restriction: Restriction) =>
  gaps.value.includes(restriction) ? t(`${KEY}.gaps.${restriction}`) : undefined;
const lockOf = (permission: string) => (can(permission) ? undefined : permission);
const changeLines = useAccessChangeLines(props.workbench);
const removesSomething = computed(() => changeLines.value.some((line) => line.kind === 'removed'));
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="contest-participants">
    <div class="flex flex-col gap-2">
      <SegmentedControl
        size="sm"
        :label="$t(`${KEY}.label`)"
        :options="options"
        :model-value="mode"
        :disabled="lockedBy !== undefined"
        @update:model-value="pick($event)"
      />
      <p v-if="lockedBy" class="m-0 text-meta text-muted">{{ needsPermissionText(lockedBy) }}</p>
      <p class="m-0 text-meta text-muted" data-testid="contest-mode-note">
        {{ note }} {{ joined }}
      </p>
    </div>
    <OrganizationChips
      v-if="restrictions.includes('organization')"
      v-model="form.organizations"
      :label="$t(`${FIELDS}.fields.organizations`)"
      :error="gapText('organization')"
      :locked-by="lockOf(PRIVATE)"
    />
    <div v-if="restrictions.includes('code')" class="max-w-md">
      <FormField
        scale="admin"
        input-id="contest-accessCode"
        :label="$t(`${KEY}.code.${hasStoredCode ? 'replace' : 'set'}`)"
        :hint="
          can(ACCESS_CODE)
            ? $t(`${FIELDS}.hints.${hasStoredCode ? 'accessCodeSet' : 'accessCodeNone'}`)
            : needsPermissionText(ACCESS_CODE)
        "
        :error="gapText('code')"
      >
        <TextInput
          v-model="form.accessCode"
          type="password"
          autocomplete="new-password"
          :disabled="!can(ACCESS_CODE)"
        />
      </FormField>
    </div>
    <UsernameChips
      v-if="restrictions.includes('list')"
      v-model="form.privateContestants"
      :label="$t(`${FIELDS}.fields.privateContestants`)"
      :error="gapText('list')"
      :locked-by="lockOf(PRIVATE)"
    />
    <Notice
      v-if="changeLines.length"
      :tone="removesSomething ? 'warning' : 'info'"
      compact
      role="status"
      :title="$t(`${KEY}.changes.title`)"
      data-testid="contest-access-changes"
    >
      <ul class="m-0 list-disc pl-5">
        <li v-for="line in changeLines" :key="line.id">{{ line.text }}</li>
      </ul>
      <template #action>
        <AppButton tone="quiet" size="sm" @click="undo()">{{ $t('common.undo') }}</AppButton>
      </template>
    </Notice>
    <Notice
      v-if="refusal"
      tone="danger"
      compact
      :title="$t(`${KEY}.refused`)"
      data-testid="contest-access-refusal"
    >
      {{ refusal }}
    </Notice>
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
