<script setup lang="ts">
import { computed, useId } from 'vue';
import FormField from '@/components/ui/FormField.vue';
import PasswordInput from '@/components/ui/PasswordInput.vue';
import TextInput from '@/components/ui/TextInput.vue';

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
const invalid = computed(() => Boolean(props.error) || props.tone === 'negative');
/** The hint stays under an error here (FormField would replace it), so it is one of the extra describing ids. */
const extraDescribedBy = computed(
  () => [props.hint && hintId, props.describedBy].filter(Boolean).join(' ') || undefined,
);
/** A free or taken username line colours the frame (`!` beats the kit's own border colour); a plain error is the kit's. */
const TONE_BORDERS = { positive: 'border-positive!', negative: 'border-negative!' } as const;
const toneClass = computed(() => (props.tone ? TONE_BORDERS[props.tone] : undefined));
</script>

<template>
  <FormField :label="label" :input-id="inputId" :error="error" :described-by="extraDescribedBy">
    <template #label-end><slot name="label-end" /></template>
    <template #default>
      <PasswordInput
        v-if="isPassword"
        v-bind="$attrs"
        v-model="model"
        :name="name"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :aria-invalid="invalid ? 'true' : undefined"
        :class="toneClass"
      />
      <TextInput
        v-else
        v-bind="$attrs"
        v-model="model"
        :name="name"
        :type="type"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :placeholder="placeholder"
        :aria-invalid="invalid ? 'true' : undefined"
        :class="toneClass"
      >
        <template v-if="$slots.trailing" #suffix><slot name="trailing" /></template>
      </TextInput>
    </template>
    <template #after>
      <slot />
      <p v-if="hint" :id="hintId" class="text-meta text-muted">{{ hint }}</p>
    </template>
  </FormField>
</template>
