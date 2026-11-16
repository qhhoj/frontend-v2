import { TABLE_HEAD_CELL, TABLE_ROW_HEIGHT } from '@/components/ui/table-classes';

/**
 * Layout of the ended-contests table, shared with its skeleton so loading and loaded tables have the same columns.
 * Auto layout without a minimum width: the name column takes what the short columns leave and wraps, so the table never
 * scrolls sideways; a phone gets stacked rows instead (`EndedContestTable.vue`).
 */
export const ENDED_TABLE_CLASS = 'w-full border-collapse text-body';
export const ENDED_HEAD_ROW_CLASS = `text-left ${TABLE_HEAD_CELL}`;
export const ENDED_ROW_CLASS = 'border-t border-line';
export const ENDED_CELL = {
  name: `px-5 ${TABLE_ROW_HEIGHT}`,
  when: `px-3 whitespace-nowrap ${TABLE_ROW_HEIGHT}`,
  length: `px-3 whitespace-nowrap ${TABLE_ROW_HEIGHT}`,
  format: `px-3 whitespace-nowrap ${TABLE_ROW_HEIGHT}`,
  participants: `px-3 text-right whitespace-nowrap ${TABLE_ROW_HEIGHT}`,
  action: `px-5 text-right whitespace-nowrap ${TABLE_ROW_HEIGHT}`,
} as const;
