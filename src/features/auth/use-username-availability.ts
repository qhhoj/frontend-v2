import { computed, onScopeDispose, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchUsernameAvailable } from '@/api/auth.api';
import { ApiError } from '@/api/client';
import { usernameProblem } from '@/lib/username';

export const AVAILABILITY_DELAY_MS = 400;
export type UsernameAvailability = 'idle' | 'checking' | 'available' | 'taken';
interface Answer {
  name: string;
  available: boolean;
}

/**
 * Asks the server about one name at a time, after a pause. Owns the debounce, the abort, the per-name cache and the
 * 429 stop; `current` tells it which text is on screen so an answer about older text is kept only in the cache.
 */
function createAvailabilityAsker(current: () => string) {
  const answer = ref<Answer | null>(null);
  const asking = ref<string | null>(null);
  const known = new Map<string, boolean>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: AbortController | undefined;
  let rateLimited = false;

  const cancel = () => {
    clearTimeout(timer);
    inFlight?.abort();
    asking.value = null;
  };

  async function ask(name: string) {
    inFlight = new AbortController();
    try {
      const { available } = await fetchUsernameAvailable(name, inFlight.signal);
      known.set(name, available);
      // The viewer may have typed on while this was in flight; an answer is only ever about its own text.
      if (current() === name) answer.value = { name, available };
    } catch (error) {
      if (error instanceof ApiError && error.code === 'rate_limited') rateLimited = true;
      // Aborted or failed: no answer, no message; the form works without it.
    } finally {
      if (asking.value === name) asking.value = null;
    }
  }

  /** Answers from the cache at once, or asks after the pause. Malformed, empty and rate-limited names are never asked. */
  function schedule(name: string) {
    if (rateLimited || name === '' || usernameProblem(name) !== null) return;
    const cached = known.get(name);
    if (cached !== undefined) return void (answer.value = { name, available: cached });
    asking.value = name;
    timer = setTimeout(() => void ask(name), AVAILABILITY_DELAY_MS);
  }

  return { answer, asking, schedule, cancel };
}

/** The state of one text: its own answer, still being asked, or nothing (idle). */
function statusOf(
  name: string,
  answer: Answer | null,
  asking: string | null,
): UsernameAvailability {
  if (answer?.name === name) return answer.available ? 'available' : 'taken';
  return asking === name ? 'checking' : 'idle';
}

/**
 * B11: once the viewer pauses, a well-formed username is asked at `GET /auth/username-available` (30 per 10 minutes
 * per IP). `checking` from the keystroke until the answer, then the confirmed answer for the exact current text;
 * `idle` for a malformed or empty text, after an error, and for good after a 429. Registration stays the authority,
 * so nothing here may block a submit.
 */
export function useUsernameAvailability(username: MaybeRefOrGetter<string>) {
  const asker = createAvailabilityAsker(() => toValue(username));
  const status = computed(() =>
    statusOf(toValue(username), asker.answer.value, asker.asking.value),
  );

  watch(
    () => toValue(username),
    (name) => {
      asker.cancel();
      asker.schedule(name);
    },
    { immediate: true },
  );
  onScopeDispose(asker.cancel);

  return { status };
}
