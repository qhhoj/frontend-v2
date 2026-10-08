/** A drag down of at least this far collapses the sheet; a shorter one is a slip of the thumb. */
const COLLAPSE_DRAG_PX = 80;

/**
 * Pointer handlers for the sheet's handle: dragging it down collapses the sheet. A pure enhancement; the collapse
 * button is the accessible way.
 */
export function useSheetDrag(onCollapse: () => void) {
  let startY: number | null = null;
  let lastY = 0;

  function onPointerdown(event: PointerEvent) {
    startY = lastY = event.clientY;
    // Keeps the moves coming when the finger leaves the handle.
    (event.currentTarget as Element | null)?.setPointerCapture?.(event.pointerId);
  }
  function onPointermove(event: PointerEvent) {
    lastY = event.clientY;
  }
  /** The browser took the gesture over (a scroll, a call): forget it. */
  function onPointercancel() {
    startY = null;
  }
  function onPointerup() {
    if (startY === null) return;
    const draggedDown = lastY - startY >= COLLAPSE_DRAG_PX;
    startY = null;
    if (draggedDown) onCollapse();
  }
  return { onPointerdown, onPointermove, onPointerup, onPointercancel };
}
