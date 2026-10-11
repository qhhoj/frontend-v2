<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { ref } from 'vue';
import { CARD } from '@/features/admin/ui/controls';

/**
 * A folded section of the Quản lý page (settings, history): a one-line card until opened. The content mounts on the first
 * open, so a closed fold sends no request.
 */
defineProps<{ title: string; lead?: string }>();
const hasOpened = ref(false);
function onToggle(event: Event) {
  if ((event.target as HTMLDetailsElement).open) hasOpened.value = true;
}
</script>

<template>
  <details :class="[CARD, 'group min-w-0']" @toggle="onToggle">
    <summary
      class="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-row px-4 py-3 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden"
    >
      <span class="min-w-0 flex-1">
        <span class="block font-display text-base font-semibold">{{ title }}</span>
        <span v-if="lead" class="block text-sm text-muted">{{ lead }}</span>
      </span>
      <ChevronDown
        class="size-5 shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
        aria-hidden="true"
      />
    </summary>
    <div v-if="hasOpened" class="border-t border-line p-4">
      <slot />
    </div>
  </details>
</template>
