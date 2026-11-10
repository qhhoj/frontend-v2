import { readonly, shallowReactive } from 'vue';

/** The status tones a toast can take; `error` is the old name of `danger`, kept until its callers move. */
export type ToastTone = 'success' | 'danger' | 'info' | 'error';

export interface ToastInput {
  text: string;
  tone?: ToastTone;
  /** Shows "Hoàn tác"; runs once and closes the toast. Only for reversible actions. */
  undo?: () => void;
  /** The undo button's label when it is not "Hoàn tác" (e.g. "Gọi lại"). */
  undoLabel?: string;
}

export interface Toast {
  id: number;
  text: string;
  tone: Exclude<ToastTone, 'error'>;
  undo?: () => void;
  undoLabel?: string;
}

/** At most three toasts; a fourth pushes out the oldest that is not a failure (the oldest of all if every one is). */
export const MAX_TOASTS = 3;
/** Success and info close themselves after 4 s (paused while hovered or focused); failures stay until closed. */
export const TOAST_LIFETIME_MS = 4000;

const list = shallowReactive<Toast[]>([]);
const timers = new Map<number, ReturnType<typeof setTimeout>>();
let nextId = 1;

/** The live list, oldest first, for the host to render. */
export const toasts = readonly(list);

export function dismissToast(id: number) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  const index = list.findIndex((toast) => toast.id === id);
  if (index >= 0) list.splice(index, 1);
}

/** Starts (or restarts after a pause) the self-close timer of a toast that is not a failure. */
export function resumeToast(id: number) {
  const toast = list.find((entry) => entry.id === id);
  if (!toast || toast.tone === 'danger') return;
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
  const tone = input.tone ?? 'success';
  const toast: Toast = {
    id: nextId++,
    text: input.text,
    tone: tone === 'error' ? 'danger' : tone,
    undo: input.undo,
    undoLabel: input.undoLabel,
  };
  list.push(toast);
  while (list.length > MAX_TOASTS) {
    const older = list.slice(0, -1);
    dismissToast((older.find((entry) => entry.tone !== 'danger') ?? older[0]!).id);
  }
  resumeToast(toast.id);
  return toast.id;
}

/** Closes every toast and cancels every timer (a spec calls this through `resetToastHost`). */
export function clearToasts() {
  for (const toast of [...list]) dismissToast(toast.id);
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
}
