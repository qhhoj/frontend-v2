<script setup lang="ts">
import { useId } from 'vue';

/** Legacy `is_open` as the mock-up's segmented choice: open (join at once) or approval (join requests). */
const isOpen = defineModel<boolean>({ required: true });
const labelId = useId();
const hintId = useId();
const MODES = [
  { isOpen: true, labelKey: 'orgAdmin.joinMode.open' },
  { isOpen: false, labelKey: 'orgAdmin.joinMode.approval' },
] as const;
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span :id="labelId" class="text-sm font-semibold">{{ $t('orgAdmin.joinMode.label') }}</span>
    <div
      role="radiogroup"
      :aria-labelledby="labelId"
      :aria-describedby="hintId"
      class="flex w-fit gap-1 rounded-pill bg-surface-hover p-1"
    >
      <button
        v-for="mode in MODES"
        :key="mode.labelKey"
        type="button"
        role="radio"
        :aria-checked="isOpen === mode.isOpen"
        class="min-h-9 rounded-pill px-4 text-sm"
        :class="
          isOpen === mode.isOpen
            ? 'bg-surface-solid font-bold text-content shadow-glow'
            : 'text-muted hover:text-content'
        "
        @click="isOpen = mode.isOpen"
      >
        {{ $t(mode.labelKey) }}
      </button>
    </div>
    <p :id="hintId" class="text-xs text-muted">{{ $t('orgAdmin.joinMode.hint') }}</p>
  </div>
</template>
