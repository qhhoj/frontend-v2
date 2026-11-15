import { inject, onBeforeUnmount, provide, ref, watchEffect } from 'vue';
import type { InjectionKey, Ref } from 'vue';

/** Whether the ranking says its board is frozen: `undefined` on a page that has no board. */
type BoardFrozen = Ref<boolean | undefined>;
const BOARD_FROZEN: InjectionKey<BoardFrozen> = Symbol('contest-board-frozen');

/** The contest layout calls this: it owns the header, which shows the freeze chip from the ranking's own answer. */
export function provideBoardFrozen(): BoardFrozen {
  const frozen: BoardFrozen = ref(undefined);
  provide(BOARD_FROZEN, frozen);
  return frozen;
}

/** The ranking page calls this to tell the layout's header whether its board is frozen. */
export function reportBoardFrozen(isFrozen: () => boolean | undefined) {
  const frozen = inject(BOARD_FROZEN, null);
  if (!frozen) return;
  watchEffect(() => {
    frozen.value = isFrozen();
  });
  onBeforeUnmount(() => {
    frozen.value = undefined;
  });
}
