import { describe, expect, it } from 'vitest';
import { ticketItem } from '@/test/community-fixtures';
import { mountComponent } from '@/test/mount';
import TicketTable from './TicketTable.vue';
import TicketTableSkeleton from './TicketTableSkeleton.vue';

const sortedClasses = (element: { classes: () => string[] }) => [...element.classes()].sort();
const headerCells = (wrapper: ReturnType<typeof mountComponent>) => wrapper.findAll('thead th');
const firstRowCells = (wrapper: ReturnType<typeof mountComponent>) =>
  wrapper.findAll('tbody tr:first-child td');

describe('ticket table skeleton parity', () => {
  it('has the same header cells, with the same classes, as the loaded table', () => {
    const table = mountComponent(TicketTable, { props: { tickets: [ticketItem()] } });
    const skeleton = mountComponent(TicketTableSkeleton);
    expect(headerCells(skeleton).map(sortedClasses)).toEqual(headerCells(table).map(sortedClasses));
  });
  it('has the same body cells, with the same classes, as the loaded table', () => {
    const table = mountComponent(TicketTable, { props: { tickets: [ticketItem()] } });
    const skeleton = mountComponent(TicketTableSkeleton);
    expect(firstRowCells(skeleton).map(sortedClasses)).toEqual(
      firstRowCells(table).map(sortedClasses),
    );
  });
  it('reserves the same title line and meta row in the title cell: 24 px title, 54 px meta on a phone, 22 px from md', () => {
    const TITLE_LINE = 'block leading-6';
    const META_ROW = 'mt-1.5 flex min-h-[54px] flex-wrap items-center gap-2 md:min-h-[22px]';
    const table = mountComponent(TicketTable, { props: { tickets: [ticketItem()] } });
    const skeleton = mountComponent(TicketTableSkeleton);
    const loadedTitle = firstRowCells(table)[0]!;
    expect(loadedTitle.get('a').classes()).toContain('block');
    expect(loadedTitle.get('a').classes()).toContain('leading-6');
    expect(loadedTitle.get('div').attributes('class')).toBe(META_ROW);
    const skeletonTitle = firstRowCells(skeleton)[0]!;
    expect(skeletonTitle.findAll('div')[0]!.attributes('class')).toBe(TITLE_LINE);
    expect(skeletonTitle.findAll('div')[1]!.attributes('class')).toBe(META_ROW);
  });
  it('hides the status, assignee and message columns below md, and keeps the title and update padding', () => {
    const skeleton = mountComponent(TicketTableSkeleton);
    expect(headerCells(skeleton).map(sortedClasses)).toEqual([
      ['font-medium', 'md:px-6', 'px-4', 'py-4'],
      ['font-medium', 'hidden', 'md:table-cell', 'px-2.5', 'py-4'],
      ['font-medium', 'hidden', 'md:table-cell', 'px-2.5', 'py-4'],
      ['font-medium', 'hidden', 'md:table-cell', 'px-2.5', 'py-4', 'text-right'],
      ['font-medium', 'md:px-6', 'px-4', 'py-4', 'text-right'],
    ]);
  });
  it('gives the body cells the literal classes the loaded rows use', () => {
    const skeleton = mountComponent(TicketTableSkeleton);
    expect(firstRowCells(skeleton).map(sortedClasses)).toEqual([
      ['md:px-6', 'px-4', 'py-3.5'],
      ['hidden', 'md:table-cell', 'px-2.5', 'py-3.5'],
      ['hidden', 'md:table-cell', 'px-2.5', 'py-3.5', 'text-muted'],
      ['font-mono', 'hidden', 'md:table-cell', 'px-2.5', 'py-3.5', 'tabular-nums', 'text-right'],
      ['md:px-6', 'px-4', 'py-3.5', 'text-muted', 'text-right'],
    ]);
  });
});
