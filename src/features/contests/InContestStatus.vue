<script setup lang="ts">
import { LogOut } from 'lucide-vue-next';
import { computed } from 'vue';
import type { ContestDetail, CurrentParticipation } from '@/api/types/contests';
import CountdownTimer from '@/components/CountdownTimer.vue';
import { formatClock } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

const props = defineProps<{
  contest: ContestDetail;
  current: CurrentParticipation | null | undefined;
  isPending: boolean;
}>();
const emit = defineEmits<{ leave: [] }>();
const locale = useLocaleStore();
/** `virtual` is -1 for a spectator, 0 for the real run and n for the nth virtual run. */
const SPECTATE = -1;
/** The current participation is this contest's (the page is only shown with `inContest`); until it loads, the detail's live row stands in. */
const participation = computed(() => {
  const current = props.current;
  if (current && current.contest.key !== props.contest.key) {
    return props.contest.viewer.liveParticipation;
  }
  return current?.participation ?? props.contest.viewer.liveParticipation;
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="flex flex-wrap items-center gap-2 font-semibold">
      <span aria-hidden="true" class="size-2 rounded-full bg-verdict-ac" />
      <template v-if="participation?.virtual === SPECTATE">
        {{ $t('contests.actions.spectating') }}
      </template>
      <template v-else-if="participation && participation.virtual > 0">
        {{ $t('contests.actions.virtualRunning', { run: participation.virtual }) }}
        <CountdownTimer :until="participation.endTime" class="font-mono" />
      </template>
      <template v-else>
        {{ $t('contests.actions.inContest') }}
        <span v-if="participation" class="font-normal text-muted">
          {{
            $t('contests.actions.since', {
              time: formatClock(participation.realStart, locale.locale),
            })
          }}
        </span>
      </template>
    </p>
    <button
      type="button"
      :aria-disabled="isPending || undefined"
      :aria-busy="isPending || undefined"
      class="inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-line px-5 font-semibold text-negative hover:bg-surface-hover aria-disabled:cursor-progress aria-disabled:bg-accent-soft aria-disabled:text-accent-soft-text"
      @click="!isPending && emit('leave')"
    >
      <LogOut class="size-4" aria-hidden="true" />{{ $t('contests.actions.leave') }}
    </button>
    <p class="text-sm text-muted">{{ $t('contests.actions.leaveNote') }}</p>
  </div>
</template>
