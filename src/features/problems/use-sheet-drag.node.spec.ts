import { describe, expect, it, vi } from 'vitest';
import { useSheetDrag } from './use-sheet-drag';

const at = (clientY: number) => ({ clientY }) as PointerEvent;

describe('useSheetDrag', () => {
  it('collapses once after a drag down of at least 80 px', () => {
    const onCollapse = vi.fn();
    const drag = useSheetDrag(onCollapse);
    drag.onPointerdown(at(100));
    drag.onPointermove(at(220));
    drag.onPointerup();
    drag.onPointerup();
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
  it('forgets a cancelled gesture, so a later release does not collapse', () => {
    const onCollapse = vi.fn();
    const drag = useSheetDrag(onCollapse);
    drag.onPointerdown(at(100));
    drag.onPointermove(at(300));
    drag.onPointercancel();
    drag.onPointerup();
    expect(onCollapse).not.toHaveBeenCalled();
  });
  it('does nothing for a shorter drag, an upward drag or a release without a press', () => {
    const onCollapse = vi.fn();
    const drag = useSheetDrag(onCollapse);
    drag.onPointerdown(at(100));
    drag.onPointermove(at(130));
    drag.onPointerup();
    drag.onPointerdown(at(300));
    drag.onPointermove(at(100));
    drag.onPointerup();
    drag.onPointerup();
    expect(onCollapse).not.toHaveBeenCalled();
  });
});
