<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { useId } from 'vue';
import AuthFieldError from './AuthFieldError.vue';

/** A native select in the `AuthField` frame (the language picker on the signup and social completion pages). `optional` adds "(tuỳ chọn)" to the label. Extra attributes go to the select. */
defineOptions({ inheritAttrs: false });
withDefaults(
  defineProps<{
    label: string;
    name: string;
    placeholder: string;
    error?: string;
    optional?: boolean;
  }>(),
  { error: undefined, optional: true },
);
const model = defineModel<string>({ required: true });
const selectId = useId();
const errorId = `${selectId}-error`;
</script>

<template>
  <div data-auth-select class="flex flex-col gap-1.5">
    <label :for="selectId" class="text-sm font-semibold text-content"
      >{{ label }}
      <span v-if="optional" class="font-normal text-muted">{{
        $t('auth.signup.optional')
      }}</span></label
    >
    <span class="relative block">
      <select
        v-bind="$attrs"
        :id="selectId"
        v-model="model"
        :name="name"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : undefined"
        class="h-12 w-full min-w-0 appearance-none rounded-row border bg-surface-solid pr-10 pl-3.5 text-[15px] text-content"
        :class="error ? 'border-negative' : 'border-line-strong'"
      >
        <option value="">{{ placeholder }}</option>
        <slot />
      </select>
      <ChevronDown
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 right-3.5 size-[18px] -translate-y-1/2 text-muted"
      />
    </span>
    <AuthFieldError v-if="error" :id="errorId" :message="error" />
  </div>
</template>
