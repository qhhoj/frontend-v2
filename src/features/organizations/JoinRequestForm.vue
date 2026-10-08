<script setup lang="ts">
import { computed, useId } from 'vue';
import { JOIN_REASON_MAX_LENGTH } from '@/api/types/organizations';

/** The reason for a join request: `v-model` holds the text, `submit` fires only with a non-blank reason. */
const props = defineProps<{ modelValue: string; busy: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string]; submit: [] }>();
const inputId = useId();
const canSend = computed(() => props.modelValue.trim() !== '' && !props.busy);
const send = () => {
  if (canSend.value) emit('submit');
};
const onInput = (event: Event) =>
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="send">
    <label :for="inputId" class="text-sm font-semibold">{{ $t('orgMembership.reason') }}</label>
    <textarea
      :id="inputId"
      :value="modelValue"
      :maxlength="JOIN_REASON_MAX_LENGTH"
      rows="4"
      class="min-h-24 rounded-tile border border-line bg-surface p-3 text-content"
      @input="onInput"
    />
    <div class="flex flex-wrap items-center justify-between gap-3">
      <span class="text-sm text-muted">{{ modelValue.length }} / {{ JOIN_REASON_MAX_LENGTH }}</span>
      <button
        type="submit"
        :aria-disabled="!canSend"
        :aria-busy="busy"
        class="inline-flex min-h-11 items-center rounded-pill bg-accent px-5 font-semibold text-on-accent aria-disabled:bg-surface-hover aria-disabled:text-muted aria-disabled:cursor-not-allowed"
      >
        {{ $t('orgMembership.send') }}
      </button>
    </div>
  </form>
</template>
