<script setup lang="ts">
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { TICKET_COLUMNS } from './ticket-columns';

/** Mirrors `TicketTable.vue`: the same columns and classes (`ticket-columns.ts`), one block per cell's text. */
const ROW_COUNT = 8;
const COLUMN_KEYS = ['title', 'status', 'assignees', 'messages', 'updated'] as const;
</script>

<template>
  <div class="overflow-x-auto">
    <table aria-hidden="true" class="w-full border-collapse text-[15px]">
      <thead>
        <tr class="text-left text-[13px] text-muted">
          <th
            v-for="column in COLUMN_KEYS"
            :key="column"
            scope="col"
            :class="TICKET_COLUMNS[column].header"
          >
            <SkeletonBlock text class="w-20" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in ROW_COUNT" :key="row" class="border-t border-line">
          <td :class="TICKET_COLUMNS.title.cell">
            <SkeletonBlock text class="w-56" />
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <SkeletonBlock text class="w-24" />
              <SkeletonBlock text class="w-16 md:hidden" />
            </div>
          </td>
          <td :class="TICKET_COLUMNS.status.cell"><SkeletonBlock text class="w-20" /></td>
          <td :class="TICKET_COLUMNS.assignees.cell"><SkeletonBlock text class="w-16" /></td>
          <td :class="TICKET_COLUMNS.messages.cell"><SkeletonBlock text class="w-10" /></td>
          <td :class="TICKET_COLUMNS.updated.cell"><SkeletonBlock text class="w-16" /></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
