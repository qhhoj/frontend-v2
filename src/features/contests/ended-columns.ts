/**
 * Layout of the ended-contests table, shared with its skeleton so loading and loaded tables have the same columns.
 * Below `lg` the format column goes (the least useful one) so the name, date, count and action fit a tablet.
 */
export const ENDED_TABLE_CLASS =
  'w-full min-w-[680px] table-fixed border-collapse text-sm lg:min-w-[980px]';
export const ENDED_HEAD_ROW_CLASS =
  'text-left text-[12px] tracking-wider whitespace-nowrap text-muted uppercase';
export const ENDED_ROW_CLASS = 'border-t border-line';
export const ENDED_CELL = {
  name: 'px-5 py-3',
  when: 'w-48 px-3 py-3',
  format: 'hidden w-52 px-3 py-3 lg:table-cell',
  participants: 'w-28 px-3 py-3 text-right',
  action: 'w-36 px-5 py-3 text-right',
} as const;
