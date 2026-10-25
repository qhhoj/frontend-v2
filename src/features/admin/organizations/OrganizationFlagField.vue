<script setup lang="ts">
/**
 * One yes/no setting of the organization form, saved with the form (so a checkbox, not a switch): the label, then a line on
 * what it does, or the permission it needs when it is locked.
 */
defineProps<{ label: string; hint: string; inputId: string; disabled?: boolean }>();
const checked = defineModel<boolean>({ required: true });
</script>

<template>
  <div class="flex items-start gap-3">
    <input
      :id="inputId"
      v-model="checked"
      type="checkbox"
      :disabled="disabled"
      :aria-describedby="`${inputId}-hint`"
      class="mt-0.5 size-4 shrink-0 accent-accent disabled:cursor-not-allowed"
    />
    <span class="flex min-w-0 flex-col">
      <label :for="inputId" class="text-sm font-semibold" :class="disabled && 'text-muted'">{{
        label
      }}</label>
      <span :id="`${inputId}-hint`" class="text-sm text-muted">{{ hint }}</span>
    </span>
  </div>
</template>
