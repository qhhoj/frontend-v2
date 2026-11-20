<script setup lang="ts">
import Notice from '@/components/ui/Notice.vue';

/**
 * The last save of a workbench, part by part: what was saved, what was not and why. Shown under the status plate while a
 * part is unsaved or the server had a complaint about a part it did save.
 */
defineProps<{
  title: string;
  /** True when a part was not saved: the report interrupts; otherwise it is a polite warning. */
  failed: boolean;
  lines: readonly { id: string; status: string; text: string }[];
}>();
</script>

<template>
  <Notice
    data-testid="save-report"
    :role="failed ? 'alert' : 'status'"
    :tone="failed ? 'danger' : 'warning'"
    :title="title"
  >
    <ul class="m-0 list-none p-0">
      <li v-for="line in lines" :key="line.id" :data-part="line.id" :data-status="line.status">
        {{ line.text }}
      </li>
    </ul>
  </Notice>
</template>
