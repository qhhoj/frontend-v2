<script setup lang="ts">
import { useId } from 'vue';
import type { ContestTagColor } from '@/api/types/contest-tags';
import { TAG_COLOR_CLASSES, TAG_COLORS } from '@/features/contests/tag-colors';

/** One radio per colour token, each drawn as the chip it would make (the sample text in that colour). */
const color = defineModel<ContestTagColor>({ required: true });
defineProps<{ label: string; sample: string }>();
const name = useId();
</script>

<template>
  <fieldset class="flex flex-col gap-1.5">
    <legend class="mb-1.5 text-sm font-semibold">{{ label }}</legend>
    <div class="flex flex-wrap gap-2">
      <label
        v-for="key in TAG_COLORS"
        :key="key"
        :data-color="key"
        :class="[
          'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-3 text-sm font-semibold has-[:checked]:ring-2 has-[:checked]:ring-current has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
          TAG_COLOR_CLASSES[key],
        ]"
      >
        <input v-model="color" type="radio" :name="name" :value="key" class="sr-only" />
        <span>{{ sample || $t('admin.contestTags.sample') }}</span>
        <span class="font-mono text-[11px] font-normal">{{ key }}</span>
      </label>
    </div>
  </fieldset>
</template>
