/**
 * The classes of the ticket table's columns, shared by `TicketTable.vue` and `TicketTableSkeleton.vue`, so a loading
 * table has the loaded table's visible columns and padding at every width.
 */
const HIDDEN_ON_PHONE = 'hidden md:table-cell';

export const TICKET_COLUMNS = {
  title: {
    header: 'px-4 py-4 font-medium md:px-6',
    cell: 'px-4 py-3.5 md:px-6',
  },
  status: {
    header: `${HIDDEN_ON_PHONE} px-2.5 py-4 font-medium`,
    cell: `${HIDDEN_ON_PHONE} px-2.5 py-3.5`,
  },
  assignees: {
    header: `${HIDDEN_ON_PHONE} px-2.5 py-4 font-medium`,
    cell: `${HIDDEN_ON_PHONE} px-2.5 py-3.5 text-muted`,
  },
  messages: {
    header: `${HIDDEN_ON_PHONE} px-2.5 py-4 text-right font-medium`,
    cell: `${HIDDEN_ON_PHONE} px-2.5 py-3.5 text-right font-mono tabular-nums`,
  },
  updated: {
    header: 'px-4 py-4 text-right font-medium md:px-6',
    cell: 'px-4 py-3.5 text-right text-muted md:px-6',
  },
} as const;
