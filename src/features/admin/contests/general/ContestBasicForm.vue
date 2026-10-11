<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Lock } from 'lucide-vue-next';
import type { ContestFormatName } from '@/api/types/contest-editing';
import type { CreationOwner } from '../../creation/creation-owners';
import AdminField from '../../ui/AdminField.vue';
import { INPUT } from '../../ui/controls';
import AdminCheckbox from '../../ui/form/AdminCheckbox.vue';
import AdminFormSection from '../../ui/form/AdminFormSection.vue';
import ChoiceCards from '../../ui/form/ChoiceCards.vue';
import type { FieldErrors } from '../../ui/admin-errors';
import { canSetVisible } from '../contest-form';
import type { ContestForm } from '../contest-form';
import { usePermissions } from '@/stores/use-permissions';
import { chooseFormat, COMMON_FORMATS } from '../format-config';
import ContestBasicTime from './ContestBasicTime.vue';

/** The Basic view ("Cơ bản"): key and name, start and end, the scoring format, and who sees the contest. */
const form = defineModel<ContestForm>({ required: true });
const props = defineProps<{
  errors: FieldErrors;
  isCreate: boolean;
  owner?: CreationOwner | null;
}>();
const { t } = useI18n();
const { can } = usePermissions();
/** Visibility unlocks for `judge.change_contest_visibility`, or `judge.create_private_contest` on a private contest. */
const visibleLock = computed(() =>
  canSetVisible(form.value, can, Boolean(props.owner))
    ? undefined
    : 'judge.change_contest_visibility',
);
const KEY = 'admin.contests.general';
const SCOREBOARD_OPTIONS = ['V', 'H', 'C', 'P'] as const;

const formatOptions = computed(() =>
  COMMON_FORMATS.map((value) => ({
    value,
    label: t(`admin.contests.formats.${value}`),
    description: t(`${KEY}.basic.formats.${value}`),
  })),
);
const isCommonFormat = computed(() =>
  (COMMON_FORMATS as readonly string[]).includes(form.value.formatName),
);
const format = computed<ContestFormatName>({
  get: () => form.value.formatName,
  set: (name) => chooseFormat(form.value, name),
});
</script>

<template>
  <AdminFormSection
    :title="t(`${KEY}.basic.sections.info`)"
    :description="t(`${KEY}.basic.leads.info`)"
  >
    <p
      v-if="owner"
      class="m-0 flex items-center gap-2 text-sm lg:col-span-2"
      data-testid="contest-owner-access"
    >
      <Lock class="size-4 shrink-0 text-muted" aria-hidden="true" />
      {{ t('admin.creation.contest.ownerAccess', { name: owner.name }) }}
    </p>
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      input-id="contest-key"
      :label="t(`${KEY}.fields.key`)"
      :hint="isCreate ? t(`${KEY}.hints.key`) : undefined"
      :error="errors.key"
      :required="isCreate"
    >
      <input
        :id="id"
        v-model="form.key"
        :readonly="!isCreate"
        :class="[INPUT, 'font-mono', !isCreate && 'bg-surface-strong text-muted']"
        :aria-describedby="describedBy"
        :aria-invalid="invalid ? 'true' : undefined"
        autocomplete="off"
      />
    </AdminField>
    <AdminField
      v-slot="{ id, describedBy, invalid }"
      input-id="contest-name"
      :label="t(`${KEY}.fields.name`)"
      :error="errors.name"
      required
    >
      <input
        :id="id"
        v-model="form.name"
        :class="INPUT"
        :aria-describedby="describedBy"
        :aria-invalid="invalid ? 'true' : undefined"
      />
    </AdminField>
  </AdminFormSection>
  <ContestBasicTime v-model="form" :errors="errors" />
  <AdminFormSection :title="t(`${KEY}.basic.sections.format`)" :columns="1">
    <ChoiceCards
      v-model="format"
      :legend="t(`${KEY}.basic.formatLegend`)"
      name="contest-format"
      :options="formatOptions"
    />
    <p class="m-0 text-sm text-muted" data-testid="contest-format-note">
      {{
        isCommonFormat
          ? t(`${KEY}.basic.moreFormats`)
          : t(`${KEY}.basic.otherFormat`, {
              format: t(`admin.contests.formats.${form.formatName}`),
            })
      }}
    </p>
  </AdminFormSection>
  <AdminFormSection
    :title="t(`${KEY}.basic.sections.access`)"
    :description="t(`${KEY}.basic.leads.access`)"
  >
    <AdminCheckbox
      v-model="form.isVisible"
      class="lg:col-span-2"
      input-id="contest-isVisible"
      :label="t(`${KEY}.fields.isVisible`)"
      :description="t(`${KEY}.fields.isVisibleHint`)"
      :locked-by="visibleLock"
    />
    <AdminField
      v-slot="{ id, describedBy }"
      input-id="contest-scoreboardVisibility"
      :label="t(`${KEY}.fields.scoreboardVisibility`)"
    >
      <select
        :id="id"
        v-model="form.scoreboardVisibility"
        :class="INPUT"
        :aria-describedby="describedBy"
      >
        <option v-for="option in SCOREBOARD_OPTIONS" :key="option" :value="option">
          {{ t(`${KEY}.scoreboardOptions.${option}`) }}
        </option>
      </select>
    </AdminField>
  </AdminFormSection>
</template>
