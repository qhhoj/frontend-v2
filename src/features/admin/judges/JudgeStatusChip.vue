<script setup lang="ts">
import { Ban, CircleCheck, CircleOff, PowerOff } from 'lucide-vue-next';
import type { Component } from 'vue';
import type { Judge } from '@/api/types/judges-admin';
import Chip from '@/components/ui/Chip.vue';
import type { ChipTone } from '@/components/ui/Chip.vue';
import { judgeStatus } from './judge-stats';
import type { JudgeStatus } from './judge-stats';

/** A judge's status as a chip: icon and word, the tone only repeating them. */
defineProps<{ judge: Judge }>();
const CHIPS: Record<JudgeStatus, { tone: ChipTone; icon: Component }> = {
  online: { tone: 'success', icon: CircleCheck },
  offline: { tone: 'neutral', icon: CircleOff },
  disabled: { tone: 'warning', icon: PowerOff },
  blocked: { tone: 'danger', icon: Ban },
};
</script>

<template>
  <Chip :tone="CHIPS[judgeStatus(judge)].tone" :icon="CHIPS[judgeStatus(judge)].icon">
    {{ $t(`admin.judges.status.${judgeStatus(judge)}`) }}
  </Chip>
</template>
