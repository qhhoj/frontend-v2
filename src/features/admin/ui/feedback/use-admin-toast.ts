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
 * Admin toasts: `show({ text, tone?, undo? })` and `dismiss(id)`. Call it in `setup`; the host (bottom right, bottom centre
 * on phones; polite region, errors as alerts) is mounted once, on first use, and outlives route changes.
 */
export function useAdminToast() {
  ensureHost(getCurrentInstance()?.appContext);
  return { show: showToast, dismiss: dismissToast };
}
