<script setup lang="ts">
import { CUE_DOT } from './cue-tones';
import type { CueTone } from './cue-tones';

/**
 * A small dot in a cue's colour, before a word that says the same thing ("Đang diễn ra"). Colour only repeats the word, so the
 * dot is decorative unless `label` is given (then it is read out and shown on hover). One size: 8 px.
 */
defineOptions({ name: 'UiStatusDot' });
defineProps<{ tone: CueTone; label?: string }>();
</script>

<template>
  <span
    :title="label"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    class="inline-block size-2 shrink-0 rounded-full align-middle"
    :class="CUE_DOT[tone]"
  />
</template>
