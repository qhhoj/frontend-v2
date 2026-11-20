<script setup lang="ts">
import { GitCompareArrows } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import LiveToggle from '../LiveToggle.vue';

/**
 * The list's two tools, at the end of its toolbar: "So sánh" shows the rows' pick boxes (signed-in viewers; `comparing`
 * null hides it) and "Trực tiếp" follows new submissions.
 */
defineProps<{ comparing: boolean | null; live: boolean }>();
defineEmits<{ toggleCompare: []; 'update:live': [live: boolean] }>();
</script>

<template>
  <AppButton
    v-if="comparing !== null"
    tone="ghost"
    size="sm"
    data-testid="compare-mode"
    class="shrink-0 whitespace-nowrap"
    :pressed="comparing"
    @click="$emit('toggleCompare')"
  >
    <template #icon><GitCompareArrows aria-hidden="true" /></template>
    {{ $t('submissions.quick.compare') }}
  </AppButton>
  <LiveToggle :live="live" @update:live="$emit('update:live', $event)" />
</template>
