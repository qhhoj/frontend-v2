<script setup lang="ts">
import { Trophy } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import type { ContestDetail } from '@/api/types/contests';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { formatClock } from '@/lib/format-date';
import type { ParticipationKind } from './bar/current-contest';

/**
 * The header's line while the viewer takes part: who they are here and since when, then leaving as a secondary button
 * (the plate says the phase; leaving is never the page's primary).
 * The note that used to stand under a red button is in the confirm dialog, worded per participation (live, virtual,
 * spectating). A virtual run also points at its board ("Gồm thi ảo").
 */
const props = defineProps<{
  contest: ContestDetail;
  kind: ParticipationKind;
  /** When the live participation started, shown as "từ HH:MM"; null hides it. */
  since: string | null;
  isPending: boolean;
  /** Where focus goes once leaving succeeds: the link that opened the dialog is gone by then. */
  returnFocusTo?: () => HTMLElement | null;
}>();
const emit = defineEmits<{ leave: [] }>();
const keys = computed(() => `contests.leave.${props.kind}`);
const isConfirmOpen = ref(false);
/** The dialog stays open, busy, while the request runs; it closes once the answer is in (an error shows below). */
watch(
  () => props.isPending,
  (isNow, was) => {
    if (was && !isNow) isConfirmOpen.value = false;
  },
);
</script>

<template>
  <div class="flex flex-col gap-3">
    <template v-if="kind === 'virtual'">
      <p class="text-sm text-muted">{{ $t('contests.virtualRun.note') }}</p>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <AppButton
          :to="{ name: 'contest-ranking', params: { key: contest.key }, query: { virtual: '1' } }"
        >
          <template #icon><Trophy class="size-4" aria-hidden="true" /></template>
          {{ $t('contests.tabs.ranking') }}
        </AppButton>
        <AppButton tone="secondary" @click="isConfirmOpen = true">
          {{ $t(`${keys}.link`) }}
        </AppButton>
      </div>
    </template>
    <p v-else class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <span class="text-muted">
        {{ $t(kind === 'spectate' ? 'contests.actions.spectating' : 'contests.actions.inContest') }}
        <template v-if="since && kind === 'live'">
          {{ $t('contests.actions.since', { time: formatClock(since) }) }}
        </template>
      </span>
      <AppButton tone="secondary" @click="isConfirmOpen = true">
        {{ $t(`${keys}.link`) }}
      </AppButton>
    </p>
    <ConfirmDialog
      v-model:visible="isConfirmOpen"
      :title="$t(`${keys}.title`)"
      :body="$t(`${keys}.body`)"
      :confirm-label="$t(`${keys}.link`)"
      :tone="kind === 'virtual' ? 'danger' : 'neutral'"
      :busy="isPending"
      :return-focus-to="returnFocusTo"
      @confirm="emit('leave')"
    />
  </div>
</template>
