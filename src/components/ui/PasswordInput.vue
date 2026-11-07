<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next';
import { ref } from 'vue';
import TextInput from './TextInput.vue';

/**
 * A `TextInput` for a password with the "show" eye at its right (a 44 px `aria-pressed` toggle). Extra attributes
 * (`autocomplete`, `name`, `required`) go to the input; inside a `FormField` it takes the field's id and description.
 */
defineOptions({ inheritAttrs: false });
const model = defineModel<string>({ required: true });
const isShown = ref(false);
</script>

<template>
  <TextInput v-bind="$attrs" v-model="model" :type="isShown ? 'text' : 'password'">
    <template #suffix>
      <button
        type="button"
        class="-mr-3 flex size-(--qh-control) items-center justify-center rounded-cell text-muted hover:text-content"
        :aria-pressed="isShown ? 'true' : 'false'"
        :aria-label="$t('auth.showPassword')"
        @click="isShown = !isShown"
      >
        <EyeOff v-if="isShown" aria-hidden="true" class="size-4" />
        <Eye v-else aria-hidden="true" class="size-4" />
      </button>
    </template>
  </TextInput>
</template>
