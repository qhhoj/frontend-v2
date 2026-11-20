<script setup lang="ts">
import { computed } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { audienceOf } from './participants-mode';
import { useAccessChangeLines } from './use-access-change-lines';
import type { ContestWorkbenchState } from './use-contest-workbench';

/**
 * The confirm before a save that removes a restriction on who may take part (`workbench.widening`). It names what the
 * save removes and, in the server's terms, who will then see the contest and who may join it. "Hủy" holds the focus.
 */
const props = defineProps<{ contest: EditableContest; workbench: ContestWorkbenchState }>();
const KEY = 'admin.contests.workbench.participants.widen';
const { widening } = props.workbench;
const isOpen = computed({
  get: () => widening.value !== null,
  set: (open) => {
    if (!open) widening.value = null;
  },
});
const lines = useAccessChangeLines(props.workbench);
const removedLines = computed(() => lines.value.filter((line) => line.kind === 'removed'));
const remaining = computed(() => widening.value?.remaining ?? []);
const audience = computed(() => audienceOf(remaining.value));
const codeKey = computed(() => (remaining.value.includes('code') ? 'withCode' : 'withoutCode'));
const shownKey = computed(() => (props.contest.settings?.isVisible ? 'shown' : 'hidden'));
</script>

<template>
  <ConfirmDialog
    v-model:visible="isOpen"
    tone="danger"
    :title="$t(`${KEY}.title`, { key: contest.key })"
    :confirm-label="$t(`${KEY}.confirm`)"
    @confirm="workbench.confirmWidening()"
  >
    <div class="flex flex-col gap-3" data-testid="contest-widen-dialog">
      <div>
        <p class="m-0">{{ $t(`${KEY}.intro`) }}</p>
        <ul class="m-0 list-disc pl-5">
          <li v-for="line in removedLines" :key="line.id">{{ line.text }}</li>
        </ul>
      </div>
      <p class="m-0">{{ $t(`${KEY}.see.${audience}`) }}</p>
      <p class="m-0">{{ $t(`${KEY}.join.${audience}`) }} {{ $t(`${KEY}.${codeKey}`) }}</p>
      <p class="m-0 text-muted">{{ $t(`${KEY}.${shownKey}`) }}</p>
    </div>
  </ConfirmDialog>
</template>
