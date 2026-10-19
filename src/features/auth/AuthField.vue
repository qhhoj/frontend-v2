<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next';
import { computed, ref, useId } from 'vue';
import FormField from '@/components/ui/FormField.vue';

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
    /** The input's id, when a page links to it (the profile's error summary); generated when left out. */
    id?: string;
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
    id: undefined,
  },
);
const model = defineModel<string>({ required: true });
const inputId = props.id ?? useId();
const hintId = `${inputId}-hint`;
const isPassword = computed(() => props.type === 'password');
const passwordShown = ref(false);
const shownType = computed(() => (isPassword.value && passwordShown.value ? 'text' : props.type));
const invalid = computed(() => Boolean(props.error) || props.tone === 'negative');
/** The hint stays under an error here (FormField would replace it), so it is one of the extra describing ids. */
const extraDescribedBy = computed(
  () => [props.hint && hintId, props.describedBy].filter(Boolean).join(' ') || undefined,
);
const BORDERS = { positive: 'border-positive', negative: 'border-negative' } as const;
const border = computed(() =>
  props.error ? BORDERS.negative : props.tone ? BORDERS[props.tone] : 'border-line-control',
);
</script>

<template>
  <FormField :label="label" :input-id="inputId" :error="error" :described-by="extraDescribedBy">
    <template #label-end><slot name="label-end" /></template>
    <template #default="control">
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
          :aria-describedby="control.describedBy"
          class="h-12 w-full min-w-0 rounded-row border bg-surface-solid px-3.5 text-base text-content placeholder:text-muted"
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
    </template>
    <template #after>
      <slot />
      <p v-if="hint" :id="hintId" class="text-meta text-muted">{{ hint }}</p>
    </template>
  </FormField>
</template>
