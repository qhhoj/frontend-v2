<script setup lang="ts">
import type { OrganizationMember } from '@/api/types/organizations';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** The number columns a list can show, in the order given. */
export type MemberColumn = 'performancePoints' | 'points' | 'problemCount';

/** Columns after the first hide below `md`: a narrow screen keeps rank, user and the first number. */
defineProps<{ members: OrganizationMember[]; columns: MemberColumn[] }>();
const locale = useLocaleStore();
const narrowClass = (index: number) => (index > 0 ? 'hidden md:table-cell' : '');
const formattedValue = (member: OrganizationMember, column: MemberColumn) =>
  formatNumber(member[column], locale.locale);
</script>

<template>
  <table class="w-full text-sm">
    <thead>
      <tr class="text-left text-muted">
        <th scope="col" class="py-2 pr-3 font-semibold">{{ $t('orgs.columns.rank') }}</th>
        <th scope="col" class="py-2 font-semibold">{{ $t('orgs.columns.user') }}</th>
        <th
          v-for="(column, index) in columns"
          :key="column"
          scope="col"
          class="py-2 pl-3 text-right font-semibold"
          :class="narrowClass(index)"
        >
          {{ $t(`orgs.columns.${column}`) }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="member in members" :key="member.id" class="border-t border-line">
        <td class="py-2 pr-3 font-mono">{{ member.rank }}</td>
        <td class="py-2">
          <div class="flex min-w-0 items-center gap-2">
            <UserAvatar :username="member.username" :size="24" />
            <UserName :username="member.username" :rating="member.rating" />
          </div>
        </td>
        <td
          v-for="(column, index) in columns"
          :key="column"
          class="py-2 pl-3 text-right font-mono"
          :class="narrowClass(index)"
        >
          {{ formattedValue(member, column) }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
