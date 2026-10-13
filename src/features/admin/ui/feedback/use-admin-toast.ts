import { getCurrentInstance, h, render } from 'vue';
import type { AppContext } from 'vue';
import AdminToastHost from './AdminToastHost.vue';
import { dismissToast, showToast } from './admin-toasts';

let host: HTMLElement | null = null;

/** Renders the one toast host into `<body>` with the app's context (i18n), the first time a component asks for toasts. */
function ensureHost(appContext: AppContext | undefined) {
  if (host?.isConnected || !appContext || typeof document === 'undefined') return;
  host = document.createElement('div');
  document.body.append(host);
  const vnode = h(AdminToastHost);
  vnode.appContext = appContext;
  render(vnode, host);
}

/**
 * Admin toasts: `show({ text, tone?, undo?, undoLabel? })` and `dismiss(id)`. Call it in `setup`; the host (bottom right, bottom
 * centre on phones; polite region, errors as alerts) is mounted once and outlives route changes: at this call, or with `lazy`
 * at the first `show` (for a page outside admin that rarely toasts, so its status region is not on every page).
 */
export function useAdminToast({ lazy = false } = {}) {
  const appContext = getCurrentInstance()?.appContext;
  if (!lazy) ensureHost(appContext);
  const show: typeof showToast = (input) => {
    ensureHost(appContext);
    return showToast(input);
  };
  return { show, dismiss: dismissToast };
}
