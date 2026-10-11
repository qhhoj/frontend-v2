<script setup lang="ts">
import { Building2, EyeOff, Hourglass, Lock, LockKeyhole, TrendingUp } from 'lucide-vue-next';
import type { Component } from 'vue';
import { computed } from 'vue';
import type { ContestListItem } from '@/api/types/contests';
import AdminChip from '../../ui/AdminChip.vue';
import type { ChipTone } from '../../ui/AdminChip.vue';

/** What hides, limits or rates a contest, and submissions waiting for a judge, as chips; hidden and waiting need attention (caution). */
const props = defineProps<{ contest: ContestListItem }>();
interface Flag {
  key: string;
  tone: ChipTone;
  icon: Component;
}
const flags = computed<Flag[]>(() => {
  const contest = props.contest;
  const lockedAfter = contest.editor?.lockedAfter;
  const shown: [boolean, Flag][] = [
    [contest.editor?.isVisible === false, { key: 'hidden', tone: 'caution', icon: EyeOff }],
    [contest.isPrivate, { key: 'private', tone: 'neutral', icon: Lock }],
    [contest.isOrganizationPrivate, { key: 'organization', tone: 'neutral', icon: Building2 }],
    [
      lockedAfter != null && Date.parse(lockedAfter) <= Date.now(),
      { key: 'locked', tone: 'neutral', icon: LockKeyhole },
    ],
    [contest.isRated, { key: 'rated', tone: 'info', icon: TrendingUp }],
    [(contest.editor?.pendingCount ?? 0) > 0, { key: 'pending', tone: 'caution', icon: Hourglass }],
  ];
  return shown.filter(([isOn]) => isOn).map(([, flag]) => flag);
});
</script>

<template>
  <span v-if="flags.length" class="inline-flex flex-wrap gap-1">
    <AdminChip v-for="flag in flags" :key="flag.key" :tone="flag.tone" :icon="flag.icon">
      {{
        $t(`admin.contests.list.badges.${flag.key}`, { count: contest.editor?.pendingCount ?? 0 })
      }}
    </AdminChip>
  </span>
  <span v-else class="text-muted">—</span>
</template>
