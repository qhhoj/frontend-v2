<script setup lang="ts">
import { MAX_DIFF_PICKS } from './diff-picks';
import { submissionShortId } from './submission-short-id';

/** The "pick for diff" box of a row. `order` is its place among the picked rows (0 = not picked); a third box is refused (`aria-disabled`) and the click cancelled so it does not tick. */
const props = defineProps<{ id: string; order: number; pickedCount: number }>();
const emit = defineEmits<{ toggle: [id: string] }>();
const isBlocked = () => props.pickedCount >= MAX_DIFF_PICKS && props.order === 0;
function onClick(event: MouseEvent) {
  if (isBlocked()) event.preventDefault();
  else emit('toggle', props.id);
}
</script>

<template>
  <label class="relative inline-flex size-11 items-center justify-center">
    <input
      type="checkbox"
      class="size-5"
      :checked="order > 0"
      :aria-disabled="isBlocked() || undefined"
      :aria-label="$t('sourceDiff.select.label', { id: submissionShortId(id) })"
      @click="onClick"
    />
    <span
      v-if="order > 0"
      data-testid="pick-order"
      aria-hidden="true"
      class="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-pill bg-gradient-accent text-tiny font-bold text-on-accent"
      >{{ order }}</span
    >
  </label>
</template>
