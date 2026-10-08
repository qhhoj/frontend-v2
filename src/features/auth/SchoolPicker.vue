<script setup lang="ts">
import { ChevronDown, CircleAlert, Search } from 'lucide-vue-next';
import Select from 'primevue/select';
import { computed, useId } from 'vue';
import type { OrganizationListItem } from '@/api/types/organizations';

/**
 * The school type-to-search combobox ("Gõ để tìm trường"): PrimeVue `Select` with `filter`, framed like `AuthField`.
 * The combobox is labelled by the label's id; `show-clear` takes a choice back (`''`).
 */
const props = withDefaults(defineProps<{ schools: OrganizationListItem[]; error?: string }>(), {
  error: undefined,
});
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
    class: 'flex-1 truncate py-2 focus-visible:outline-none',
    'aria-describedby': props.error ? errorId : undefined,
  },
}));
</script>

<template>
  <div data-auth-select data-testid="school-picker" class="flex flex-col gap-1.5">
    <span :id="labelId" class="text-sm font-semibold text-content"
      >{{ $t('auth.signup.school') }}
      <span class="font-normal text-muted">{{ $t('auth.signup.optional') }}</span></span
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
        <template #dropdownicon>
          <ChevronDown class="size-[18px]" aria-hidden="true" />
        </template>
      </Select>
    </div>
    <p v-if="error" :id="errorId" class="flex items-center gap-1.5 text-[13px] text-negative">
      <CircleAlert aria-hidden="true" class="size-3.5 shrink-0" />
      {{ error }}
    </p>
  </div>
</template>
