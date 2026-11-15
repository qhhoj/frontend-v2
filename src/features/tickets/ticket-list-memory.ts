import { ref } from 'vue';
import type { TicketListQuery } from '@/api/types/tickets';

/** The filters the list page last showed. The ticket page's list pane reuses them, so the pane keeps the viewer's place. */
export const lastTicketFilters = ref<TicketListQuery | null>(null);
