<script setup lang="ts" generic="Code extends string">
import { ADMIN_CHECK_CHIP_CLASS } from './classes';

/** Verdict or status codes as checkbox pills: the code shows, its name is the tooltip and what a screen reader reads. */
defineProps<{ codes: readonly Code[]; name: string }>();
const picked = defineModel<Code[]>({ required: true });
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <label
      v-for="code in codes"
      :key="code"
      :class="ADMIN_CHECK_CHIP_CLASS"
      :title="$t(`verdicts.${code}`)"
    >
      <input v-model="picked" type="checkbox" :name="name" :value="code" />
      <span class="font-mono">{{ code }}</span>
      <span class="sr-only">{{ $t(`verdicts.${code}`) }}</span>
    </label>
  </div>
</template>
