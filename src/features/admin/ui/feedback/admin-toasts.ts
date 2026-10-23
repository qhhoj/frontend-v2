import { readonly, shallowReactive } from 'vue';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastInput {
  text: string;
  tone?: ToastTone;
  /** Shows "Hoàn tác"; runs once and closes the toast. Only for reversible actions. */
  undo?: () => void;
  /** The undo button's label when it is not "Hoàn tác" (e.g. "Gọi lại"). */
  undoLabel?: string;
}

export interface Toast extends Required<Omit<ToastInput, 'undo' | 'undoLabel'>> {
  id: number;
  undo?: () => void;
  undoLabel?: string;
}

/** At most three toasts; a fourth pushes out the oldest. */
export const MAX_TOASTS = 3;
/** Success and info close themselves after 4 s (paused while hovered or focused); errors stay until closed. */
export const TOAST_LIFETIME_MS = 4000;

const toasts = shallowReactive<Toast[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();
let nextId = 1;

/** The live list, oldest first, for the host to render. */
export const adminToasts = readonly(toasts);

export function dismissToast(id: number) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index >= 0) toasts.splice(index, 1);
}

/** Starts (or restarts after a pause) the self-close timer of a non-error toast. */
export function resumeToast(id: number) {
  const toast = toasts.find((entry) => entry.id === id);
  if (!toast || toast.tone === 'error') return;
  clearTimeout(timers.get(id));
  timers.set(
    id,
    setTimeout(() => dismissToast(id), TOAST_LIFETIME_MS),
  );
}

export function pauseToast(id: number) {
  clearTimeout(timers.get(id));
  timers.delete(id);
}

export function showToast(input: ToastInput): number {
  const toast: Toast = {
    id: nextId++,
    text: input.text,
    tone: input.tone ?? 'success',
    undo: input.undo,
    undoLabel: input.undoLabel,
  };
  toasts.push(toast);
  while (toasts.length > MAX_TOASTS) dismissToast(toasts[0]!.id);
  resumeToast(toast.id);
  return toast.id;
}

/** Closes every toast and cancels every timer (a spec calls this through `resetToastHost`). */
export function clearToasts() {
  for (const toast of [...toasts]) dismissToast(toast.id);
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
}
