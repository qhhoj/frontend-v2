<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { useId } from 'vue';
import type { TagColor } from '@/api/types/tag-color';
import { TAG_COLOR_CLASSES, TAG_COLORS } from '@/features/contests/tag-colors';

/** One radio per colour token, each drawn as the chip it would make (the sample text in that colour); the picked one wears a ring and a check. */
const color = defineModel<TagColor>({ required: true });
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
          'inline-flex min-h-[var(--qa-control,2.25rem)] cursor-pointer items-center gap-1.5 rounded-pill border px-3 text-sm font-semibold has-[:checked]:ring-2 has-[:checked]:ring-current has-[:checked]:ring-offset-2 has-[:checked]:ring-offset-surface-solid has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
          TAG_COLOR_CLASSES[key],
        ]"
      >
        <input v-model="color" type="radio" :name="name" :value="key" class="sr-only" />
        <Check
          v-if="color === key"
          aria-hidden="true"
          class="-ml-0.5 size-3.5 shrink-0"
          :stroke-width="2"
        />
        <span>{{ sample || $t('admin.contestTags.sample') }}</span>
        <span class="font-mono text-[11px] font-normal">{{ key }}</span>
      </label>
    </div>
  </fieldset>
</template>
