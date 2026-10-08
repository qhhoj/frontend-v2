<script setup lang="ts">
import { ChevronDown, Search } from 'lucide-vue-next';
import Select from 'primevue/select';
import { computed, useId } from 'vue';
import type { OrganizationListItem } from '@/api/types/organizations';
import { translate } from '@/i18n';
import AuthFieldError from './AuthFieldError.vue';

/**
 * The school type-to-search combobox ("Gõ để tìm trường"): PrimeVue `Select` with `filter`, framed like `AuthField`.
 * The combobox is labelled by the label's id; `show-clear` takes a choice back (`''`).
 */
const props = withDefaults(
  defineProps<{ schools: OrganizationListItem[]; error?: string; optional?: boolean }>(),
  { error: undefined, optional: true },
);
const model = defineModel<string>({ required: true });
const labelId = useId();
const errorId = `${labelId}-error`;
/** The component's root replaces the preset's pill (PrimeVue merges sections by spreading, so this wins). */
const passThrough = computed(() => ({
  root: {
    class: [
      'relative flex h-12 w-full min-w-0 cursor-pointer items-center rounded-row border bg-surface-solid pl-10 text-[15px] text-content has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus',
      props.error ? 'border-negative' : 'border-line-strong',
    ],
  },
  label: {
    // The empty state is the placeholder: muted, so it does not read as a chosen school.
    class:
      'min-h-11 flex-1 truncate py-2 focus-visible:outline-none data-[p~=placeholder]:text-muted',
    'aria-describedby': props.error ? errorId : undefined,
  },
  pcFilter: {
    root: { 'aria-label': translate('auth.signup.schoolFilter') },
  },
}));
</script>

<template>
  <div data-auth-select data-testid="school-picker" class="flex flex-col gap-1.5">
    <span :id="labelId" class="text-sm font-semibold text-content"
      >{{ $t('auth.signup.school') }}
      <span v-if="optional" class="font-normal text-muted">{{
        $t('auth.signup.optional')
      }}</span></span
    >
    <div class="relative">
      <Search
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 left-3.5 z-10 size-[18px] -translate-y-1/2 text-muted"
      />
      <Select
        :model-value="model || null"
        :options="schools"
        option-label="name"
        option-value="id"
        filter
        show-clear
        :filter-placeholder="$t('auth.signup.schoolSearch')"
        :empty-filter-message="$t('auth.signup.schoolNone')"
        :placeholder="$t('auth.signup.schoolSearch')"
        :aria-labelledby="labelId"
        :invalid="Boolean(error)"
        :pt="passThrough"
        @update:model-value="(value: string | null) => (model = value ?? '')"
      >
        <!-- The overlay's filter already sits beside the search glyph above; PrimeVue's own magnifier would be a second one. -->
        <template #filtericon><span hidden /></template>
        <template #dropdownicon>
          <ChevronDown class="size-[18px]" aria-hidden="true" />
        </template>
      </Select>
    </div>
    <AuthFieldError v-if="error" :id="errorId" :message="error" />
  </div>
</template>
