<script setup lang="ts">
import { ref, useId } from 'vue';

/**
 * An import option saved with the form: a checkbox, its label and an optional one-line description; a longer `help`
 * stays behind a "?" button (`helpLabel` names it for screen readers). The `danger` tone is for a choice that loses work:
 * its box and description take the negative colour.
 */
const model = defineModel<boolean>({ required: true });
defineProps<{
  label: string;
  description?: string;
  help?: string;
  helpLabel?: string;
  tone?: 'default' | 'danger';
}>();
const id = useId();
const isHelpOpen = ref(false);
</script>

<template>
  <div class="flex items-start gap-3">
    <input
      :id="id"
      v-model="model"
      type="checkbox"
      class="mt-0.5 size-5 shrink-0"
      :class="tone === 'danger' ? 'accent-negative' : 'accent-[var(--qh-accent)]'"
      :aria-describedby="description ? `${id}-description` : undefined"
    />
    <div class="flex min-w-0 flex-col">
      <label :for="id" class="cursor-pointer text-sm font-semibold">{{ label }}</label>
      <p
        v-if="description"
        :id="`${id}-description`"
        class="text-sm"
        :class="tone === 'danger' ? 'text-negative' : 'text-muted'"
      >
        {{ description }}
        <button
          v-if="help"
          type="button"
          class="relative ml-1 inline-flex size-5 items-center justify-center rounded-pill border border-line-control align-middle font-mono text-caption text-content after:absolute after:-inset-3 after:content-[''] hover:bg-surface-hover"
          :aria-label="helpLabel"
          :aria-expanded="isHelpOpen"
          :aria-controls="`${id}-help`"
          @click="isHelpOpen = !isHelpOpen"
        >
          ?
        </button>
      </p>
      <p v-if="help" v-show="isHelpOpen" :id="`${id}-help`" class="mt-1 text-sm">{{ help }}</p>
    </div>
  </div>
</template>
