<script setup lang="ts">
import { CircleHelp, Star } from 'lucide-vue-next';
import { ref, useId } from 'vue';
import IconButton from '@/components/ui/IconButton.vue';
import { TOGGLE } from '../ui/controls';

/**
 * "Đánh dấu đóng góp tốt": a pressed toggle, with a "?" that explains what it does (contribution points for the sender),
 * since the label alone does not say.
 */
defineProps<{ isContributive: boolean; busy: boolean }>();
defineEmits<{ toggle: [] }>();
const hintId = useId();
const isHintShown = ref(false);
</script>

<template>
  <span class="inline-flex flex-wrap items-center gap-1">
    <button
      type="button"
      data-testid="mark-good"
      :class="TOGGLE"
      :aria-pressed="isContributive ? 'true' : 'false'"
      :aria-busy="busy || undefined"
      :aria-describedby="isHintShown ? hintId : undefined"
      :title="$t('admin.tickets.detail.markGoodHint')"
      @click="$emit('toggle')"
    >
      <Star aria-hidden="true" class="size-4" :stroke-width="1.75" />
      {{ $t('ticket.markGood') }}
    </button>
    <IconButton
      :label="$t('admin.tickets.detail.markGoodHelp')"
      :aria-expanded="isHintShown"
      :aria-controls="hintId"
      @click="isHintShown = !isHintShown"
    >
      <CircleHelp class="size-4" :stroke-width="1.75" />
    </IconButton>
    <span v-show="isHintShown" :id="hintId" class="basis-full text-meta text-muted">
      {{ $t('admin.tickets.detail.markGoodHint') }}
    </span>
  </span>
</template>
