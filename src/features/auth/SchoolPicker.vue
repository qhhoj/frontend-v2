<script setup lang="ts">
import { useId } from 'vue';
import type { OrganizationListItem } from '@/api/types/organizations';
import ComboBox from '@/components/ui/ComboBox.vue';
import AuthFieldError from './AuthFieldError.vue';

/**
 * The school type-to-search combobox ("Gõ để tìm trường"): the kit `ComboBox` with `filter`. The combobox is labelled by the
 * label's id; `clearable` takes a choice back (`''`).
 */
withDefaults(
  defineProps<{ schools: OrganizationListItem[]; error?: string; optional?: boolean }>(),
  { error: undefined, optional: true },
);
const model = defineModel<string>({ required: true });
const labelId = useId();
const errorId = `${labelId}-error`;
</script>

<template>
  <div data-auth-select data-testid="school-picker" class="flex flex-col gap-1.5">
    <span :id="labelId" class="text-sm font-semibold text-content"
      >{{ $t('auth.signup.school') }}
      <span v-if="optional" class="font-normal text-muted">{{
        $t('auth.signup.optional')
      }}</span></span
    >
    <ComboBox
      :model-value="model || null"
      :options="schools"
      option-label="name"
      option-value="id"
      filter
      clearable
      :filter-label="$t('auth.signup.schoolFilter')"
      :filter-placeholder="$t('auth.signup.schoolSearch')"
      :empty-filter-message="$t('auth.signup.schoolNone')"
      :placeholder="$t('auth.signup.schoolSearch')"
      :aria-labelledby="labelId"
      :invalid="Boolean(error)"
      :described-by="error ? errorId : undefined"
      @update:model-value="(value) => (model = value === null ? '' : String(value))"
    />
    <AuthFieldError v-if="error" :id="errorId" :message="error" />
  </div>
</template>
