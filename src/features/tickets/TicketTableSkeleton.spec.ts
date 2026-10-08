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
