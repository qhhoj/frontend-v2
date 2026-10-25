<script setup lang="ts">
import { computed } from 'vue';
import AdminField from '../../ui/AdminField.vue';
import { INPUT } from '../../ui/controls';
import AdminDateTimeField from '../../ui/form/AdminDateTimeField.vue';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import type { ContestForm } from '../contest-form';
import ContestTimeline from './ContestTimeline.vue';
import { numberBoxValue, requiredNumberValue } from '../../ui/form/number-box';
import { timeModel } from './input-values';
import { usePermissionLocks } from './permission-locks';

/** When the contest runs: a timeline over the start, end, registration, freeze and judging lock, all in the site zone. */
const form = defineModel<ContestForm>({ required: true });
defineProps<{ errors: FieldErrors }>();
const { lockedBy, hintOf } = usePermissionLocks();

const start = timeModel(form, 'startTime');
const end = timeModel(form, 'endTime');
const registrationStart = timeModel(form, 'registrationStart');
const registrationEnd = timeModel(form, 'registrationEnd');
const lockedAfter = timeModel(form, 'lockedAfter');

const timelineInput = computed(() => ({
  registrationStart: registrationStart.value,
  startTime: start.value,
  endTime: end.value,
  lockedAfter: lockedAfter.value,
  frozenLastMinutes: form.value.frozenLastMinutes,
}));
const isLockLocked = computed(() => Boolean(lockedBy('judge.lock_contest')));
</script>

<template>
  <AdminFormSection
    id="contest-section-time"
    :title="$t('admin.contests.general.sections.time')"
    :description="$t('admin.contests.general.sectionLeads.time')"
  >
    <ContestTimeline :times="timelineInput" />
    <AdminDateTimeField
      v-model="registrationStart"
      input-id="contest-registrationStart"
      :label="$t('admin.contests.general.fields.registrationStart')"
      :hint="$t('admin.contests.general.hints.optionalTime')"
    />
    <AdminDateTimeField
      v-model="registrationEnd"
      input-id="contest-registrationEnd"
      :label="$t('admin.contests.general.fields.registrationEnd')"
      :hint="$t('admin.contests.general.hints.optionalTime')"
    />
    <!-- A locked field: the fieldset disables both the box and its "Bây giờ" button. -->
    <fieldset :disabled="isLockLocked" class="m-0 min-w-0 border-0 p-0">
      <AdminDateTimeField
        v-model="lockedAfter"
        input-id="contest-lockedAfter"
        :label="$t('admin.contests.general.fields.lockedAfter')"
        :hint="hintOf('judge.lock_contest', $t('admin.contests.general.hints.lockedAfter'))"
      />
    </fieldset>
    <AdminField
      input-id="contest-frozenLastMinutes"
      :label="$t('admin.contests.general.fields.frozenLastMinutes')"
      :hint="$t('admin.contests.general.hints.frozenLastMinutes')"
      :error="errors.frozenLastMinutes"
    >
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          :value="form.frozenLastMinutes"
          type="number"
          min="0"
          inputmode="numeric"
          :class="[INPUT, 'font-mono tabular-nums']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          @input="form.frozenLastMinutes = requiredNumberValue($event)"
        />
      </template>
    </AdminField>
    <AdminField
      input-id="contest-timeLimit"
      :label="$t('admin.contests.general.fields.timeLimit')"
      :hint="$t('admin.contests.general.hints.timeLimit')"
      :error="errors.timeLimit"
    >
      <template #default="{ id, describedBy, invalid }">
        <input
          :id="id"
          :value="form.timeLimit ?? ''"
          type="number"
          min="1"
          inputmode="numeric"
          :class="[INPUT, 'font-mono tabular-nums']"
          :aria-describedby="describedBy"
          :aria-invalid="invalid ? 'true' : undefined"
          @input="form.timeLimit = numberBoxValue($event)"
        />
      </template>
    </AdminField>
    <AdminCheckbox
      v-model="form.disallowVirtual"
      class="self-end"
      input-id="contest-disallowVirtual"
      :label="$t('admin.contests.general.fields.disallowVirtual')"
      :description="$t('admin.contests.general.fields.disallowVirtualHint')"
    />
  </AdminFormSection>
</template>
