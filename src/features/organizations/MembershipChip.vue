<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import type { MembershipState } from './membership-state';

/** The viewer's standing beside the organization's name: member, administrator or a pending request; nothing otherwise. */
defineProps<{ state: MembershipState }>();
const CHIPS: Partial<
  Record<MembershipState, { tone: 'success' | 'accent' | 'warning'; key: string }>
> = {
  member: { tone: 'success', key: 'orgMembership.member' },
  administrator: { tone: 'accent', key: 'orgMembership.administrator' },
  pending: { tone: 'warning', key: 'orgMembership.pending' },
};
</script>

<template>
  <Chip
    v-if="CHIPS[state]"
    data-testid="membership-chip"
    :tone="CHIPS[state]!.tone"
    size="sm"
    class="shrink-0"
    >{{ $t(CHIPS[state]!.key) }}</Chip
  >
</template>
