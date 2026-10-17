import { Copy, ExternalLink, Trash2 } from 'lucide-vue-next';
import type { RouteLocationRaw } from 'vue-router';
import { translate } from '@/i18n';
import type { RowMenuItem } from './AdminRowMenu.vue';

/**
 * The admin row contract: the row's title opens its editor; "⋯" lists Xem · Nhân bản… · Xoá…, always in that order and
 * with the same words, then any list-specific `extra` items before the destructive one. An action the account may not
 * take is left out; a delete that is refused for this row (`remove.blockedBy`) stays listed, disabled, with the reason.
 */
export interface StandardRowActions {
  /** The public page. */
  view?: RouteLocationRaw;
  /** Opens the list's clone dialog. */
  clone?: () => void;
  /** Opens the list's delete confirm. */
  remove?: { run: () => void; blockedBy?: string };
  extra?: RowMenuItem[];
}

export function standardRowMenu(actions: StandardRowActions): RowMenuItem[] {
  const items: RowMenuItem[] = [];
  if (actions.view)
    items.push({ label: translate('admin.ui.row.view'), icon: ExternalLink, to: actions.view });
  if (actions.clone)
    items.push({ label: translate('admin.ui.row.clone'), icon: Copy, run: actions.clone });
  items.push(...(actions.extra ?? []));
  if (actions.remove)
    items.push({
      label: translate('admin.ui.row.remove'),
      icon: Trash2,
      danger: true,
      run: actions.remove.run,
      disabled: Boolean(actions.remove.blockedBy),
      hint: actions.remove.blockedBy,
    });
  return items;
}
