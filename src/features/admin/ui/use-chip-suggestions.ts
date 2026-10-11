import { onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';

export const SUGGEST_DELAY_MS = 250;

export type Suggest<Chip> = (typed: string) => Promise<Chip[]>;

/**
 * Suggestions for a chip box: asked `SUGGEST_DELAY_MS` after the last key, only the newest answer shows,
 * chips already picked are left out, and a failure just shows nothing (Enter still does the exact lookup).
 */
export function useChipSuggestions<Chip extends { id: string }>(
  typed: Ref<string>,
  suggest: () => Suggest<Chip> | undefined,
  picked: () => readonly Chip[],
) {
  const options = ref<Chip[]>([]) as Ref<Chip[]>;
  const activeIndex = ref(-1);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let latest = 0;

  function close() {
    clearTimeout(timer);
    latest += 1;
    options.value = [];
    activeIndex.value = -1;
  }

  async function ask(text: string, request: number, fetch: Suggest<Chip>) {
    try {
      const found = await fetch(text);
      if (request !== latest) return;
      const pickedIds = new Set(picked().map((chip) => chip.id));
      options.value = found.filter((chip) => !pickedIds.has(chip.id));
      activeIndex.value = -1;
    } catch {
      if (request === latest) options.value = [];
    }
  }

  watch(typed, (value) => {
    const fetch = suggest();
    const text = value.trim();
    close();
    if (!fetch || !text) return;
    const request = latest;
    timer = setTimeout(() => void ask(text, request, fetch), SUGGEST_DELAY_MS);
  });

  /** Moves the highlight by `step`, wrapping around; nothing happens while no list is open. */
  function move(step: 1 | -1) {
    const count = options.value.length;
    if (count === 0) return;
    // With nothing highlighted, Down starts at the first option and Up at the last.
    const from = activeIndex.value < 0 && step === -1 ? count : activeIndex.value;
    activeIndex.value = (from + step + count) % count;
  }

  const active = (): Chip | undefined => options.value[activeIndex.value];

  onBeforeUnmount(close);
  return { options, activeIndex, move, active, close };
}
