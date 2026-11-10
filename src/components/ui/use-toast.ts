import { getCurrentInstance, h, render } from 'vue';
import type { AppContext } from 'vue';
import ToastHost from './ToastHost.vue';
import { clearToasts, dismissToast, showToast } from './toasts';

let host: HTMLElement | null = null;

/** Renders the one toast host into `<body>` with the app's context (i18n), the first time a component asks for toasts. */
function ensureHost(appContext: AppContext | undefined) {
  if (host?.isConnected || !appContext || typeof document === 'undefined') return;
  host = document.createElement('div');
  document.body.append(host);
  const vnode = h(ToastHost);
  vnode.appContext = appContext;
  render(vnode, host);
}

/**
 * Toasts for row, bulk and background actions: `show({ text, tone?, undo?, undoLabel? })` and `dismiss(id)`. A form save says
 * "Đã lưu" in its SaveBar instead, and a failure also gets an inline `Notice` next to its cause. Call it in `setup`; the host
 * (bottom right, bottom centre on phones; polite region, failures as alerts) is mounted once and outlives route changes: at
 * this call, or with `lazy` at the first `show` (for a page that rarely toasts, so its status region is not on every page).
 */
export function useToast({ lazy = false } = {}) {
  const appContext = getCurrentInstance()?.appContext;
  if (!lazy) ensureHost(appContext);
  const show: typeof showToast = (input) => {
    ensureHost(appContext);
    return showToast(input);
  };
  return { show, dismiss: dismissToast };
}

/**
 * For specs, after each test: the host is rendered outside any app, so a wrapper's unmount never reaches it, and its
 * 4 s self-close timers would fire into the next test or, after the last one, into a torn-down jsdom.
 */
export function resetToastHost() {
  if (host) render(null, host);
  host?.remove();
  host = null;
  clearToasts();
}
