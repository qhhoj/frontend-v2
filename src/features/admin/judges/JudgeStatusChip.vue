<script setup lang="ts">
import { Ban, CircleCheck, CircleOff, PowerOff } from 'lucide-vue-next';
import type { Component } from 'vue';
import type { Judge } from '@/api/types/judges-admin';
import AdminChip from '../ui/AdminChip.vue';
import type { ChipTone } from '../ui/AdminChip.vue';
import { judgeStatus } from './judge-stats';
import type { JudgeStatus } from './judge-stats';

/** A judge's status as a chip: icon and word, the tone only repeating them. */
defineProps<{ judge: Judge }>();
const CHIPS: Record<JudgeStatus, { tone: ChipTone; icon: Component }> = {
  online: { tone: 'positive', icon: CircleCheck },
  offline: { tone: 'neutral', icon: CircleOff },
  disabled: { tone: 'caution', icon: PowerOff },
  blocked: { tone: 'negative', icon: Ban },
};
</script>

<template>
  <AdminChip :tone="CHIPS[judgeStatus(judge)].tone" :icon="CHIPS[judgeStatus(judge)].icon">
    {{ $t(`admin.judges.status.${judgeStatus(judge)}`) }}
  </AdminChip>
</template>
