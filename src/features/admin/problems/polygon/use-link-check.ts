import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { ApiError } from '@/api/client';
import { resolvePolygonLink } from '@/api/polygon.api';
import type { PolygonProblem } from '@/api/types/polygon';
import {
  linkRefusalOf,
  parsePolygonLink,
  polygonLinkUrl,
  textRefusalOf,
} from './polygon-problem-link';
import type { LinkRefusal } from './polygon-problem-link';

const CHECK_DELAY_MS = 400;
/** A `polygon_link_checking` answer is checked again by itself this many times; each check spends one of 20 per 10 minutes. */
const MAX_AUTO_RECHECKS = 3;
const DEFAULT_RECHECK_SECONDS = 60;

interface Checked {
  link: string;
  problem: PolygonProblem | null;
  refusal: LinkRefusal | null;
}

/** Seconds since `isRunning` turned on, ticking once a second while it stays on. */
function useElapsedSeconds(isRunning: Ref<boolean>) {
  const seconds = ref(0);
  let ticker: ReturnType<typeof setInterval> | undefined;
  watch(isRunning, (running) => {
    clearInterval(ticker);
    seconds.value = 0;
    if (running) ticker = setInterval(() => (seconds.value += 1), 1000);
  });
  onBeforeUnmount(() => clearInterval(ticker));
  return seconds;
}

/** The server check of `address`, newest answer only: a newer check makes an older answer stale. */
function useResolver() {
  const checked = ref<Checked>({ link: '', problem: null, refusal: null });
  const isChecking = ref(false);
  let sequence = 0;

  async function check(link: string) {
    const mine = (sequence += 1);
    isChecking.value = true;
    checked.value = { link, problem: null, refusal: null };
    try {
      const problem = await resolvePolygonLink(link);
      if (mine === sequence) checked.value = { link, problem, refusal: null };
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      if (mine === sequence) checked.value = { link, problem: null, refusal: linkRefusalOf(error) };
    } finally {
      if (mine === sequence) isChecking.value = false;
    }
  }
  return { checked, isChecking, check };
}

/**
 * Sends the answered link again when the server said another request is running its first check
 * (`polygon_link_checking`), after `Retry-After`, at most a few times per link.
 */
function useAutoRecheck(current: Ref<Checked | null>, check: (link: string) => Promise<void>) {
  const state = ref({ link: '', count: 0, inSeconds: null as number | null });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const reset = (link: string) => {
    clearTimeout(timer);
    state.value = { link, count: 0, inSeconds: null };
  };
  watch(current, (answer) => {
    const refusal = answer?.refusal;
    if (refusal?.kind !== 'checking' || state.value.count >= MAX_AUTO_RECHECKS) {
      state.value = { ...state.value, inSeconds: null };
      return;
    }
    const inSeconds = refusal.retryAfterSeconds ?? DEFAULT_RECHECK_SECONDS;
    state.value = { ...state.value, count: state.value.count + 1, inSeconds };
    timer = setTimeout(() => void check(state.value.link), inSeconds * 1000);
  });
  onBeforeUnmount(() => clearTimeout(timer));
  return {
    inSeconds: computed(() => state.value.inSeconds),
    reset,
    cancel: () => clearTimeout(timer),
  };
}

/**
 * Step 1's check of a pasted link. Only a well-formed link that changed is sent, after a pause: each check counts
 * against a per-user limit.
 */
export function useLinkCheck(initialLink: string) {
  const text = ref(initialLink);
  const parts = computed(() => parsePolygonLink(text.value));
  /** What is sent and compared: the normalised address, so `http://` or a scheme-less paste checks once. */
  const address = computed(() => (parts.value ? polygonLinkUrl(parts.value) : ''));
  const { checked, isChecking, check } = useResolver();
  const current = computed(() =>
    checked.value.link === address.value && !isChecking.value ? checked.value : null,
  );
  const autoRecheck = useAutoRecheck(current, check);
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(
    address,
    (link) => {
      clearTimeout(timer);
      autoRecheck.reset(link);
      if (!link || link === checked.value.link) return;
      timer = setTimeout(() => void check(link), CHECK_DELAY_MS);
    },
    { immediate: true },
  );
  onBeforeUnmount(() => clearTimeout(timer));

  return {
    text,
    parts,
    address,
    preview: computed(() => current.value?.problem ?? null),
    refusal: computed(() => textRefusalOf(text.value) ?? current.value?.refusal ?? null),
    isChecking,
    elapsedSeconds: useElapsedSeconds(isChecking),
    autoRecheckIn: autoRecheck.inSeconds,
    checkAgain: () => {
      autoRecheck.cancel();
      void check(address.value);
    },
  };
}
