<script setup lang="ts">
export interface DiffLine {
  /** `+` added, `-` removed, ` ` unchanged context. */
  sign: '+' | '-' | ' ';
  text: string;
}

/**
 * Removed and added lines of text, one per row: a sign column, the text wrapped in mono. The sign is also said to screen readers,
 * so colour is never the only cue. `meta` is the dense size for history lists, `sm` the readable one.
 */
withDefaults(defineProps<{ lines: DiffLine[]; size?: 'sm' | 'meta' }>(), { size: 'sm' });
defineOptions({ name: 'UiDiffLines' });

const TONES = {
  '+': 'bg-verdict-ac-bg text-verdict-ac',
  '-': 'bg-verdict-wa-bg text-verdict-wa',
  ' ': 'text-muted',
} as const;
const SIZES = { sm: 'text-sm', meta: 'text-meta leading-relaxed' } as const;
const SIGNS = { '+': '+', '-': '−', ' ': '' } as const;
</script>

<template>
  <div class="flex min-w-0 flex-col gap-0.5 font-mono" :class="SIZES[size]">
    <div
      v-for="(line, index) in lines"
      :key="index"
      class="flex rounded-row px-1"
      :class="TONES[line.sign]"
    >
      <span aria-hidden="true" class="w-5 shrink-0 text-center select-none">{{
        SIGNS[line.sign]
      }}</span>
      <span v-if="line.sign !== ' '" class="sr-only">{{
        $t(line.sign === '+' ? 'common.diff.added' : 'common.diff.removed')
      }}</span>
      <span class="min-w-0 break-words whitespace-pre-wrap">{{ line.text }}</span>
    </div>
  </div>
</template>
