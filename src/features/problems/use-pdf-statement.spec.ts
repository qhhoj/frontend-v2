import { effectScope, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { probePdf } from '@/api/pdf';
import type { PdfProbe } from '@/api/pdf';
import { ApiError } from '@/api/client';
import type { StatementLanguage } from '@/api/types/problems';
import { PDF_GIVE_UP_MS, usePdfStatement } from './use-pdf-statement';

vi.mock('@/api/pdf', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  probePdf: vi.fn(),
}));
const probe = vi.mocked(probePdf);
const rendering = (retryAfterMs = 3000): PdfProbe => ({ state: 'rendering', retryAfterMs });
const neverAnswers = () => new Promise<PdfProbe>(() => {});
/** The signal the composable passed to the probe at call `index`. */
const signalOf = (index: number) => probe.mock.calls[index]![2]!;

function setup() {
  const scope = effectScope();
  const code = ref('duongdi');
  const lang = ref<StatementLanguage>('vi');
  const pdf = scope.run(() => usePdfStatement(code, lang))!;
  return { ...pdf, code, lang, scope };
}
beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] }));
afterEach(() => {
  vi.useRealTimers();
  probe.mockReset();
});

describe('usePdfStatement', () => {
  it('polls at the server pace until the PDF is ready, then stops asking', async () => {
    probe
      .mockResolvedValueOnce(rendering(3000))
      .mockResolvedValueOnce(rendering(3000))
      .mockResolvedValue({ state: 'ready' });
    const { phase, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(phase.value).toBe('preparing');
    expect(probe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2999);
    expect(probe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(probe).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(phase.value).toBe('ready');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(probe).toHaveBeenCalledTimes(3);
  });
  it('is ready at once when the first answer is 200', async () => {
    probe.mockResolvedValue({ state: 'ready' });
    const { phase, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(phase.value).toBe('ready');
  });
  it('fails on an error answer and can be started again once the 3 s floor has passed', async () => {
    probe
      .mockRejectedValueOnce(new ApiError('generic', 500, 'x'))
      .mockResolvedValue({ state: 'ready' });
    const { phase, failure, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(phase.value).toBe('failed');
    expect(failure.value).toBe('failed');
    await vi.advanceTimersByTimeAsync(3000);
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(phase.value).toBe('ready');
  });
  it('stops at once on 503 or 429 and refuses a retry until Retry-After has passed', async () => {
    probe
      .mockResolvedValueOnce({
        state: 'unavailable',
        reason: 'pdf_unavailable',
        retryAfterMs: 30_000,
      })
      .mockResolvedValue({ state: 'ready' });
    const { phase, retryAt, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(phase.value).toBe('failed');
    expect(retryAt.value).toBe(Date.now() + 30_000);
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(probe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(30_000);
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(phase.value).toBe('ready');
  });
  it('reports a 429 as rate_limited and a 404 as missing, anything else as failed', async () => {
    probe.mockResolvedValueOnce({
      state: 'unavailable',
      reason: 'rate_limited',
      retryAfterMs: 60_000,
    });
    const limited = setup();
    limited.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(limited.failure.value).toBe('rate_limited');
    limited.scope.stop();

    probe.mockRejectedValueOnce(new ApiError('not_found', 404, 'x'));
    const missing = setup();
    missing.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(missing.failure.value).toBe('missing');
    missing.scope.stop();
  });
  it('keeps the 3 s floor across failures: a retry never probes sooner than 3 s after the last probe', async () => {
    // Each probe takes 1 s to fail, so the floor is measured from when the probe ran, not when it failed.
    probe.mockImplementation(
      () =>
        new Promise<PdfProbe>((resolve, reject) =>
          setTimeout(() => reject(new ApiError('generic', 500, 'x')), 1000),
        ),
    );
    const { phase, retryAt, start } = setup();
    const probedAt = Date.now();
    start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(phase.value).toBe('failed');
    expect(retryAt.value).toBe(probedAt + 3000);
    start();
    expect(probe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(probe).toHaveBeenCalledTimes(2);
  });
  it('gives up after PDF_GIVE_UP_MS of 202 answers and stops asking', async () => {
    probe.mockResolvedValue(rendering(5000));
    const { phase, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(PDF_GIVE_UP_MS + 10_000);
    expect(phase.value).toBe('failed');
    const asked = probe.mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(probe.mock.calls.length).toBe(asked);
  });
  it('gives up on a probe that never answers, aborting it at PDF_GIVE_UP_MS', async () => {
    probe.mockImplementation(neverAnswers);
    const { phase, failure, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(PDF_GIVE_UP_MS - 1);
    expect(phase.value).toBe('preparing');
    await vi.advanceTimersByTimeAsync(1);
    expect(phase.value).toBe('failed');
    expect(failure.value).toBe('failed');
    expect(signalOf(0).aborted).toBe(true);
    expect(probe).toHaveBeenCalledTimes(1);
  });
  it('drops the answer of an old language after the language changed', async () => {
    let resolve!: (answer: PdfProbe) => void;
    probe.mockReturnValueOnce(new Promise<PdfProbe>((done) => (resolve = done)));
    const { phase, lang, start } = setup();
    start();
    lang.value = 'en';
    await nextTick();
    resolve({ state: 'ready' });
    await vi.advanceTimersByTimeAsync(0);
    expect(phase.value).toBe('idle');
  });
  it('aborts the probe in flight when the code or the language changes', async () => {
    probe.mockImplementation(neverAnswers);
    const { code, lang, start } = setup();
    start();
    lang.value = 'en';
    await nextTick();
    expect(signalOf(0).aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(3000); // the 3 s floor applies to the next probe
    start();
    code.value = 'lis';
    await nextTick();
    expect(signalOf(1).aborted).toBe(true);
  });
  it('keeps the server wait when the language changes during it, and stops any timer', async () => {
    probe.mockResolvedValueOnce(rendering(3000)).mockResolvedValue({ state: 'ready' });
    const { phase, lang, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(0);
    lang.value = 'en';
    await nextTick();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(probe).toHaveBeenCalledTimes(1);
    expect(phase.value).toBe('idle');
  });
  it('still refuses to start during a 503 wait after the language changed', async () => {
    probe.mockResolvedValueOnce({
      state: 'unavailable',
      reason: 'pdf_unavailable',
      retryAfterMs: 30_000,
    });
    const { lang, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(0);
    lang.value = 'en';
    await nextTick();
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(probe).toHaveBeenCalledTimes(1);
  });
  it('does not probe again within 3 s of the last probe after the language changed while preparing', async () => {
    probe.mockImplementation(neverAnswers);
    const { lang, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(0);
    lang.value = 'en';
    await nextTick();
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(probe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000);
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(probe).toHaveBeenCalledTimes(2);
  });
  it('stops polling when its scope is disposed', async () => {
    probe.mockResolvedValue(rendering(3000));
    const { scope, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(0);
    scope.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(probe).toHaveBeenCalledTimes(1);
  });
  it('aborts a probe that is in flight when its scope is disposed', () => {
    probe.mockImplementation(neverAnswers);
    const { scope, start } = setup();
    start();
    scope.stop();
    expect(signalOf(0).aborted).toBe(true);
  });
});
