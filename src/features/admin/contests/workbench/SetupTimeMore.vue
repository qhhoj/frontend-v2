<script setup lang="ts">
import Checkbox from '@/components/ui/Checkbox.vue';
import DateTimeField from '@/components/ui/DateTimeField.vue';
import FormField from '@/components/ui/FormField.vue';
import SelectField from '@/components/ui/SelectField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import type { LabelStyle } from '@/api/types/contest-editing';
import UsernameChips from '../../ui/UsernameChips.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { numberBoxValue, requiredNumberValue } from '../../ui/form/number-box';
import type { ContestForm } from '../contest-form';
import { timeModel } from '../general/input-values';
import { usePermissionLocks } from '../general/permission-locks';

/**
 * The fold of "Thời gian và thể thức": the fields few contests change. Registration window, judging lock, the
 * per-participant time, virtual participation, label style and points digits, the contest-wide switches, who is rated
 * and within which bounds, and the ranking's cache, viewers and view code.
 */
const form = defineModel<ContestForm>({ required: true });
defineProps<{
  errors: FieldErrors;
  hasRankingCode: boolean;
  labelOptions: { value: LabelStyle; label: string }[];
}>();
const { lockedBy, hintOf } = usePermissionLocks();
const KEY = 'admin.contests.general';
const RATING = 'judge.contest_rating';
const LOCK = 'judge.lock_contest';
const BOUNDS = ['ratingFloor', 'ratingCeiling'] as const;
/** The contest-wide switches, saved with the form. */
const OPTIONS = [
  { field: 'runPretestsOnly', label: 'runPretestsOnly', hint: 'runPretestsOnlyHint' },
  { field: 'hideProblemTags', label: 'hideProblemTags', hint: 'hideProblemTagsHint' },
  { field: 'hideProblemAuthors', label: 'hideProblemAuthors', hint: undefined },
  { field: 'showShortDisplay', label: 'showShortDisplay', hint: undefined },
  { field: 'showSubmissionList', label: 'showSubmissionList', hint: 'showSubmissionListHint' },
  { field: 'pushAnnouncements', label: 'pushLabel', hint: 'pushHint' },
] as const;

const registrationStart = timeModel(form, 'registrationStart');
const registrationEnd = timeModel(form, 'registrationEnd');
const lockedAfter = timeModel(form, 'lockedAfter');
</script>

<template>
  <div class="grid gap-4 pt-2 md:grid-cols-2">
    <DateTimeField
      v-model="registrationStart"
      scale="admin"
      input-id="contest-registrationStart"
      :label="$t(`${KEY}.fields.registrationStart`)"
      :hint="$t(`${KEY}.hints.optionalTime`)"
    />
    <DateTimeField
      v-model="registrationEnd"
      scale="admin"
      input-id="contest-registrationEnd"
      :label="$t(`${KEY}.fields.registrationEnd`)"
      :hint="$t(`${KEY}.hints.optionalTime`)"
    />
    <DateTimeField
      v-model="lockedAfter"
      scale="admin"
      input-id="contest-lockedAfter"
      :label="$t(`${KEY}.fields.lockedAfter`)"
      :hint="hintOf(LOCK, $t(`${KEY}.hints.lockedAfter`))"
      :disabled="Boolean(lockedBy(LOCK))"
    />
    <FormField
      scale="admin"
      input-id="contest-timeLimit"
      :label="$t(`${KEY}.fields.timeLimit`)"
      :hint="$t(`${KEY}.hints.timeLimit`)"
      :error="errors.timeLimit"
    >
      <TextInput
        :model-value="form.timeLimit ?? ''"
        type="number"
        min="1"
        inputmode="numeric"
        class="font-mono"
        @input="form.timeLimit = numberBoxValue($event)"
      />
    </FormField>
    <Checkbox
      v-model="form.disallowVirtual"
      input-id="contest-disallowVirtual"
      class="md:col-span-2"
      :label="$t(`${KEY}.fields.disallowVirtual`)"
      :description="$t(`${KEY}.fields.disallowVirtualHint`)"
    />
    <FormField scale="admin" input-id="contest-labelStyle" :label="$t(`${KEY}.fields.labelStyle`)">
      <SelectField v-model="form.labelStyle" :options="labelOptions" />
    </FormField>
    <FormField
      scale="admin"
      input-id="contest-pointsPrecision"
      :label="$t(`${KEY}.fields.pointsPrecision`)"
      :hint="$t(`${KEY}.hints.pointsPrecision`)"
      :error="errors.pointsPrecision"
    >
      <TextInput
        :model-value="Number.isNaN(form.pointsPrecision) ? '' : form.pointsPrecision"
        type="number"
        min="0"
        max="10"
        class="font-mono"
        @input="form.pointsPrecision = requiredNumberValue($event)"
      />
    </FormField>
    <Checkbox
      v-for="option in OPTIONS"
      :key="option.field"
      v-model="form[option.field]"
      :input-id="`contest-${option.field}`"
      :label="$t(`${KEY}.fields.${option.label}`)"
      :description="option.hint ? $t(`${KEY}.fields.${option.hint}`) : undefined"
    />
    <Checkbox
      v-model="form.rateAll"
      input-id="contest-rateAll"
      class="md:col-span-2"
      :label="$t(`${KEY}.fields.rateAll`)"
      :description="hintOf(RATING, $t(`${KEY}.fields.rateAllHint`))"
      :disabled="Boolean(lockedBy(RATING))"
    />
    <FormField
      v-for="bound in BOUNDS"
      :key="bound"
      scale="admin"
      :input-id="`contest-${bound}`"
      :label="$t(`${KEY}.fields.${bound}`)"
      :hint="hintOf(RATING)"
      :error="errors[bound]"
    >
      <TextInput
        :model-value="form[bound] ?? ''"
        type="number"
        inputmode="numeric"
        class="font-mono"
        :disabled="Boolean(lockedBy(RATING))"
        @input="form[bound] = numberBoxValue($event)"
      />
    </FormField>
    <UsernameChips
      v-model="form.rateExclude"
      class="md:col-span-2"
      :label="$t(`${KEY}.fields.rateExclude`)"
      :locked-by="lockedBy(RATING)"
    />
    <FormField
      scale="admin"
      input-id="contest-scoreboardCacheTimeout"
      :label="$t(`${KEY}.fields.scoreboardCacheTimeout`)"
      :hint="$t(`${KEY}.hints.scoreboardCacheTimeout`)"
      :error="errors.scoreboardCacheTimeout"
    >
      <TextInput
        :model-value="Number.isNaN(form.scoreboardCacheTimeout) ? '' : form.scoreboardCacheTimeout"
        type="number"
        min="0"
        max="86400"
        class="font-mono"
        @input="form.scoreboardCacheTimeout = requiredNumberValue($event)"
      />
    </FormField>
    <div class="flex flex-col gap-2">
      <FormField
        scale="admin"
        input-id="contest-rankingAccessCode"
        :label="$t(`${KEY}.fields.rankingAccessCode`)"
        :hint="$t(`${KEY}.hints.${hasRankingCode ? 'rankingCodeSet' : 'accessCodeNone'}`)"
      >
        <TextInput
          v-model="form.rankingAccessCode"
          type="password"
          autocomplete="new-password"
          :disabled="form.removeRankingAccessCode"
        />
      </FormField>
      <Checkbox
        v-if="hasRankingCode"
        v-model="form.removeRankingAccessCode"
        input-id="contest-removeRankingAccessCode"
        :label="$t(`${KEY}.fields.removeRankingAccessCode`)"
      />
    </div>
    <UsernameChips
      v-model="form.viewContestScoreboard"
      class="md:col-span-2"
      :label="$t(`${KEY}.fields.viewContestScoreboard`)"
    />
  </div>
</template>
