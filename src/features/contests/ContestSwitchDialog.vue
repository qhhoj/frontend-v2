<script setup lang="ts">
import { computed } from 'vue';
import type { CurrentParticipation } from '@/api/types/contests';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { useCountdownText } from '@/lib/use-countdown-text';
import { useNow } from '@/lib/use-now';

/** Joining a contest while a virtual run of another one goes on ends that run; the viewer chooses first. */
const props = defineProps<{
  contestName: string;
  replaced: CurrentParticipation;
  confirmLabel: string;
}>();
const visible = defineModel<boolean>('visible', { required: true });
const emit = defineEmits<{ confirm: [] }>();
const countdownText = useCountdownText();
const now = useNow();
const timeLeft = computed(() =>
  countdownText((Date.parse(props.replaced.participation.endTime) - now.value) / 1000),
);
</script>

<template>
  <ConfirmDialog
    v-model:visible="visible"
    :title="$t('contests.switchRun.title', { name: contestName })"
    :confirm-label="confirmLabel"
    :cancel-label="$t('contests.switchRun.stay')"
    tone="danger"
    @confirm="emit('confirm')"
  >
    <i18n-t keypath="contests.switchRun.body" tag="p">
      <template #other
        ><strong>{{ replaced.contest.name }}</strong></template
      >
      <template #left>{{ timeLeft }}</template>
      <template #ends
        ><strong>{{ $t('contests.switchRun.ends') }}</strong></template
      >
    </i18n-t>
  </ConfirmDialog>
</template>
