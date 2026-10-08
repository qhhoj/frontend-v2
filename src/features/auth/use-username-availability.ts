import { computed, onScopeDispose, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchUsernameAvailable } from '@/api/auth.api';
import { ApiError } from '@/api/client';
import { usernameProblem } from '@/lib/username';

export const AVAILABILITY_DELAY_MS = 400;
export type UsernameAvailability = 'idle' | 'checking' | 'available' | 'taken';

/**
 * B11: once the viewer pauses, a well-formed username is asked at `GET /auth/username-available` (30 per 10 minutes
 * per IP). `checking` from the keystroke until the answer, then the confirmed answer for the exact current text;
 * `idle` for a malformed or empty text, after an error, and for good after a 429. Registration stays the authority,
 * so nothing here may block a submit.
 */
export function useUsernameAvailability(username: MaybeRefOrGetter<string>) {
  const answer = ref<{ name: string; available: boolean } | null>(null);
  const asking = ref<string | null>(null);
  const known = new Map<string, boolean>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: AbortController | undefined;
  let rateLimited = false;

  const status = computed<UsernameAvailability>(() => {
    const current = toValue(username);
    if (answer.value?.name === current) return answer.value.available ? 'available' : 'taken';
    return asking.value === current ? 'checking' : 'idle';
  });

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
      if (toValue(username) === name) answer.value = { name, available };
    } catch (error) {
      if (error instanceof ApiError && error.code === 'rate_limited') rateLimited = true;
      // Aborted or failed: no answer, no message; the form works without it.
    } finally {
      if (asking.value === name) asking.value = null;
    }
  }

  function schedule(name: string) {
    const cached = known.get(name);
    if (cached !== undefined) return void (answer.value = { name, available: cached });
    asking.value = name;
    timer = setTimeout(() => void ask(name), AVAILABILITY_DELAY_MS);
  }

  watch(
    () => toValue(username),
    (name) => {
      cancel();
      const askable = !rateLimited && name !== '' && usernameProblem(name) === null;
      if (askable) schedule(name);
    },
    { immediate: true },
  );
  onScopeDispose(cancel);

  return { status };
}
