import { effectScope, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { probePdf } from '@/api/pdf';
import type { PdfProbe } from '@/api/pdf';
import { ApiError } from '@/api/client';
import type { StatementLanguage } from '@/api/types/problems';
import { PDF_GIVE_UP_MS, usePdfStatement } from './use-pdf-statement';

vi.mock('@/api/pdf', () => ({ probePdf: vi.fn() }));
const probe = vi.mocked(probePdf);
const rendering = (retryAfterMs = 3000): PdfProbe => ({ state: 'rendering', retryAfterMs });

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
  it('fails on an error answer and can be started again', async () => {
    probe
      .mockRejectedValueOnce(new ApiError('generic', 500, 'x'))
      .mockResolvedValue({ state: 'ready' });
    const { phase, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(phase.value).toBe('failed');
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(phase.value).toBe('ready');
  });
  it('stops at once on 503 or 429 and refuses a retry until Retry-After has passed', async () => {
    probe
      .mockResolvedValueOnce({ state: 'unavailable', retryAfterMs: 30_000 })
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
  it('stops polling when its scope is disposed', async () => {
    probe.mockResolvedValue(rendering(3000));
    const { scope, start } = setup();
    start();
    await vi.advanceTimersByTimeAsync(0);
    scope.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(probe).toHaveBeenCalledTimes(1);
  });
});
