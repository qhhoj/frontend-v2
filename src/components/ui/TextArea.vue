<script setup lang="ts">
import { CONTROL_FRAME, useFieldControl } from './FormField.control';

/** A multi-line text box, at least one control tall. Inside a `FormField` it takes the field's id and description. */
const model = defineModel<string>();
const field = useFieldControl();
</script>

<template>
  <textarea
    :id="field?.id"
    v-model="model"
    :aria-describedby="field?.describedBy"
    :aria-invalid="field?.invalid"
    :class="`${CONTROL_FRAME} min-h-(--qh-control) py-2`"
  />
</template>
