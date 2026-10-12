<script setup lang="ts">
import { CONTROL_FRAME, useFieldControl } from './FormField.control';

/** A text input, 44 px tall (36 in admin, 44 on touch). Inside a `FormField` it takes the field's id and description. */
const model = defineModel<string | number>();
const field = useFieldControl();
</script>

<template>
  <input
    :id="field?.id"
    v-model="model"
    :aria-describedby="field?.describedBy"
    :aria-invalid="field?.invalid"
    :class="`${CONTROL_FRAME} h-(--qh-control)`"
  />
</template>
