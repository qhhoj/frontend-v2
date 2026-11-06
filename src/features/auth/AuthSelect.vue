<script setup lang="ts">
import { computed, useId } from 'vue';
import FormField from '@/components/ui/FormField.vue';
import SelectField from '@/components/ui/SelectField.vue';

/** A `FormField` with the kit `SelectField` (native) (the language picker on the signup and social completion pages, and the profile defaults). `optional` adds "(tùy chọn)" to the label. `placeholder` is the empty option; leave it out when the field always has a value. Extra attributes go to the select. */
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    label: string;
    name: string;
    placeholder?: string;
    hint?: string;
    error?: string;
    optional?: boolean;
    /** The select's id, when a page links to it; generated when left out. */
    id?: string;
  }>(),
  { placeholder: undefined, hint: undefined, error: undefined, optional: true, id: undefined },
);
const model = defineModel<string>({ required: true });
const selectId = props.id ?? useId();
const hintId = `${selectId}-hint`;
/** The hint stays under an error here (FormField would replace it), so it is an extra describing id. */
const extraDescribedBy = computed(() => (props.hint ? hintId : undefined));
</script>

<template>
  <FormField
    data-auth-select
    :label="label"
    :input-id="selectId"
    :error="error"
    :optional="optional"
    :described-by="extraDescribedBy"
  >
    <template #default>
      <SelectField v-bind="$attrs" v-model="model" :name="name" :placeholder="placeholder">
        <slot />
      </SelectField>
    </template>
    <template #after>
      <p v-if="hint" :id="hintId" class="text-meta leading-normal text-muted">{{ hint }}</p>
    </template>
  </FormField>
</template>
