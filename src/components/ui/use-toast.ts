import { getCurrentInstance, h, render, watch } from 'vue';
import type { AppContext } from 'vue';
import { topDialog } from './modal-dialog';
import ToastHost from './ToastHost.vue';
import { clearToasts, dismissToast, showToast } from './toasts';

let host: HTMLElement | null = null;

/**
 * The host lives in `<body>`, or inside the open modal dialog while there is one: the rest of the page is inert and under the
 * top layer then, and a toast must stay readable and its undo clickable.
 */
const placeHost = () => host && (topDialog.value ?? document.body).append(host);
watch(topDialog, placeHost, { flush: 'sync' });

/** Renders the one toast host with the app's context (i18n), the first time a component asks for toasts. */
function ensureHost(appContext: AppContext | undefined) {
  if (host) {
    // The dialog that held it has just been removed, before `topDialog` moved it out.
    if (!host.isConnected) placeHost();
    return;
  }
  if (!appContext || typeof document === 'undefined') return;
  host = document.createElement('div');
  placeHost();
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
