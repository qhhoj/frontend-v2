<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next';
import { computed, ref, useId } from 'vue';
import AuthFieldError from './AuthFieldError.vue';

/** Extra attributes (`required`, `spellcheck`, `@input`) belong to the input, not the wrapper. */
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    label: string;
    name: string;
    type?: 'text' | 'email' | 'password';
    autocomplete?: string;
    inputmode?: 'text' | 'email' | 'numeric';
    placeholder?: string;
    error?: string;
    hint?: string;
    /** Ids of extra elements that describe the input (a strength meter, the username line). */
    describedBy?: string;
    /** A verdict that is not an error text: the username line's free (positive) or taken (negative). Colour only, so the caller's text must say which. */
    tone?: 'positive' | 'negative';
  }>(),
  {
    type: 'text',
    autocomplete: undefined,
    inputmode: undefined,
    placeholder: undefined,
    error: undefined,
    hint: undefined,
    describedBy: undefined,
    tone: undefined,
  },
);
const model = defineModel<string>({ required: true });
const inputId = useId();
const hintId = `${inputId}-hint`;
const errorId = `${inputId}-error`;
const isPassword = computed(() => props.type === 'password');
const passwordShown = ref(false);
const shownType = computed(() => (isPassword.value && passwordShown.value ? 'text' : props.type));
const invalid = computed(() => Boolean(props.error) || props.tone === 'negative');
const describedIds = computed(
  () =>
    [props.error && errorId, props.hint && hintId, props.describedBy].filter(Boolean).join(' ') ||
    undefined,
);
const BORDERS = { positive: 'border-positive', negative: 'border-negative' } as const;
const border = computed(() =>
  props.error ? BORDERS.negative : props.tone ? BORDERS[props.tone] : 'border-line-strong',
);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="inputId" class="text-sm font-semibold text-content">{{ label }}</label>
    <div class="relative">
      <input
        v-bind="$attrs"
        :id="inputId"
        v-model="model"
        :name="name"
        :type="shownType"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :aria-invalid="invalid ? 'true' : undefined"
        :aria-describedby="describedIds"
        class="h-12 w-full min-w-0 rounded-row border bg-surface-solid px-3.5 text-[15px] text-content placeholder:text-muted"
        :class="[border, (isPassword || $slots.trailing) && 'pr-12']"
      />
      <button
        v-if="isPassword"
        type="button"
        class="absolute top-0.5 right-0.5 flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-hover"
        :aria-pressed="passwordShown ? 'true' : 'false'"
        :aria-label="$t('auth.showPassword')"
        @click="passwordShown = !passwordShown"
      >
        <EyeOff v-if="passwordShown" aria-hidden="true" class="size-[18px]" />
        <Eye v-else aria-hidden="true" class="size-[18px]" />
      </button>
      <span
        v-else-if="$slots.trailing"
        class="pointer-events-none absolute top-1/2 right-3.5 flex -translate-y-1/2"
      >
        <slot name="trailing" />
      </span>
    </div>
    <slot />
    <p v-if="hint" :id="hintId" class="text-[13px] text-muted">{{ hint }}</p>
    <AuthFieldError v-if="error" :id="errorId" :message="error" />
  </div>
</template>
