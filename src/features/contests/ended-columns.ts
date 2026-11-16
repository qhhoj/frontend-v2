/**
 * Layout of the ended-contests table, shared with its skeleton so loading and loaded tables have the same columns.
 * Auto layout without a minimum width: the name column takes what the short columns leave and wraps, so the table never
 * scrolls sideways; a phone gets stacked rows instead (`EndedContestTable.vue`).
 */
export const ENDED_TABLE_CLASS = 'w-full border-collapse text-sm';
export const ENDED_HEAD_ROW_CLASS = 'text-left text-meta whitespace-nowrap text-muted';
export const ENDED_ROW_CLASS = 'border-t border-line';
export const ENDED_CELL = {
  name: 'px-5 py-3',
  when: 'px-3 py-3 whitespace-nowrap',
  length: 'px-3 py-3 whitespace-nowrap',
  format: 'px-3 py-3 whitespace-nowrap',
  participants: 'px-3 py-3 text-right whitespace-nowrap',
  action: 'px-5 py-3 text-right whitespace-nowrap',
} as const;
