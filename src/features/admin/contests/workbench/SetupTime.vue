<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestFormatName, LabelStyle } from '@/api/types/contest-editing';
import AppButton from '@/components/ui/AppButton.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import DateTimeField from '@/components/ui/DateTimeField.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import FormField from '@/components/ui/FormField.vue';
import Notice from '@/components/ui/Notice.vue';
import SelectField from '@/components/ui/SelectField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { freezesInFormat } from '@/lib/board-freeze';
import { formatLabel } from '@/lib/contest-format';
import type { FieldErrors } from '../../ui/admin-errors';
import { requiredNumberValue } from '../../ui/form/number-box';
import type { ContestForm } from '../contest-form';
import { chooseFormat, FORMAT_FIELDS } from '../format-config';
import { QUICK_MINUTES, useContestLength } from '../general/contest-length';
import { timeModel } from '../general/input-values';
import { usePermissionLocks } from '../general/permission-locks';
import SetupTimeMore from './SetupTimeMore.vue';

/**
 * Section "Thời gian và thể thức": when the contest runs and how it is scored. The format comes before the options
 * that depend on it. What few contests change (registration window, lock, per-participant time, labels, digits, rating
 * bounds, ranking cache) sits behind one fold. Saved by the page's save bar.
 */
const form = defineModel<ContestForm>({ required: true });
const moreOpen = defineModel<boolean>('moreOpen', { default: false });
defineProps<{ errors: FieldErrors; hasRankingCode: boolean; willRescore: boolean }>();
const { t } = useI18n();
const { lockedBy, hintOf } = usePermissionLocks();
const KEY = 'admin.contests.general';
const BENCH = 'admin.contests.workbench.time';
const RATING = 'judge.contest_rating';
const FORMAT_NAMES: ContestFormatName[] = [
  'ioi',
  'icpc',
  'default',
  'ioi16',
  'vnoj',
  'final_submission',
  'ultimate',
];
const SCOREBOARD_OPTIONS = ['V', 'H', 'C', 'P'] as const;
const LABEL_STYLES: LabelStyle[] = ['alpha', 'numeric'];

const start = timeModel(form, 'startTime');
const end = timeModel(form, 'endTime');
const { lastFor, lengthHint } = useContestLength(form);
const formatOptions = FORMAT_NAMES.map((value) => ({ value, label: formatLabel(value) }));
const scoreboardOptions = computed(() =>
  SCOREBOARD_OPTIONS.map((value) => ({ value, label: t(`${BENCH}.scoreboard.${value}`) })),
);
const labelOptions = computed(() =>
  LABEL_STYLES.map((value) => ({
    value,
    label: t(`${KEY}.fields.${value === 'alpha' ? 'labelAlpha' : 'labelNumeric'}`),
  })),
);
const formatFields = computed(() => FORMAT_FIELDS[form.value.formatName]);
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2" data-testid="contest-time">
    <DateTimeField
      v-model="start"
      scale="admin"
      input-id="contest-startTime"
      :label="$t(`${KEY}.fields.start`)"
      :error="errors.startTime"
      required
    />
    <div class="flex flex-col gap-2">
      <DateTimeField
        v-model="end"
        scale="admin"
        input-id="contest-endTime"
        :label="$t(`${KEY}.fields.end`)"
        :error="errors.endTime"
        :hint="lengthHint"
        required
      />
      <div
        class="flex flex-wrap items-center gap-2"
        role="group"
        :aria-label="$t(`${KEY}.basic.quickHint`)"
      >
        <span class="text-meta text-muted">{{ $t(`${KEY}.basic.quickLegend`) }}</span>
        <AppButton
          v-for="minutes in QUICK_MINUTES"
          :key="minutes"
          size="sm"
          :data-testid="`contest-quick-${minutes}`"
          :disabled="!form.startTime"
          :disabled-reason="form.startTime ? undefined : $t(`${BENCH}.startFirst`)"
          @click="lastFor(minutes)"
        >
          {{ $t(`${KEY}.basic.quick`, { n: minutes }) }}
        </AppButton>
      </div>
    </div>
    <FormField input-id="contest-formatName" scale="admin" :label="$t(`${KEY}.fields.formatName`)">
      <SelectField
        :model-value="form.formatName"
        :options="formatOptions"
        @update:model-value="chooseFormat(form, $event)"
      />
    </FormField>
    <div class="flex flex-col gap-2" data-testid="contest-format-options">
      <span class="text-meta font-semibold">{{
        $t(`${KEY}.fields.formatConfigTitle`, { format: formatLabel(form.formatName) })
      }}</span>
      <span v-if="formatFields.length === 0" class="text-meta text-muted">{{
        $t(`${KEY}.fields.formatNoOptions`)
      }}</span>
      <template v-for="field in formatFields" :key="field.name">
        <FormField
          v-if="field.kind === 'minutes'"
          scale="admin"
          :input-id="`contest-format-${field.name}`"
          :label="$t(field.labelKey)"
          :error="errors[`formatConfig.${field.name}`]"
        >
          <TextInput
            :model-value="Number(form.formatConfig[field.name])"
            type="number"
            min="0"
            class="font-mono"
            @input="form.formatConfig[field.name] = requiredNumberValue($event)"
          />
        </FormField>
        <Checkbox
          v-else
          :model-value="Boolean(form.formatConfig[field.name])"
          :input-id="`contest-format-${field.name}`"
          :label="$t(field.labelKey)"
          @update:model-value="form.formatConfig[field.name] = $event"
        />
      </template>
    </div>
    <FormField
      scale="admin"
      input-id="contest-frozenLastMinutes"
      :label="$t(`${KEY}.fields.frozenLastMinutes`)"
      :hint="
        freezesInFormat(form.formatName)
          ? $t(`${KEY}.hints.frozenLastMinutes`)
          : $t(`${BENCH}.noFreeze`, { format: formatLabel(form.formatName) })
      "
      :error="errors.frozenLastMinutes"
    >
      <TextInput
        :model-value="Number.isNaN(form.frozenLastMinutes) ? '' : form.frozenLastMinutes"
        type="number"
        min="0"
        inputmode="numeric"
        class="font-mono"
        @input="form.frozenLastMinutes = requiredNumberValue($event)"
      />
    </FormField>
    <FormField
      scale="admin"
      input-id="contest-scoreboardVisibility"
      :label="$t(`${BENCH}.scoreboardLabel`)"
    >
      <SelectField v-model="form.scoreboardVisibility" :options="scoreboardOptions" />
    </FormField>
    <Checkbox
      v-model="form.isRated"
      input-id="contest-isRated"
      :label="$t(`${KEY}.fields.isRated`)"
      :description="hintOf(RATING)"
      :disabled="Boolean(lockedBy(RATING))"
    />
    <Notice v-if="willRescore" tone="warning" compact role="status" class="md:col-span-2">
      {{ $t('admin.contestOps.general.rescoreNotice') }}
    </Notice>
    <Disclosure
      v-model:open="moreOpen"
      :label="$t(`${BENCH}.more`)"
      class="md:col-span-2"
      data-testid="contest-time-more"
    >
      <SetupTimeMore
        v-model="form"
        :errors="errors"
        :has-ranking-code="hasRankingCode"
        :label-options="labelOptions"
      />
    </Disclosure>
  </div>
</template>
