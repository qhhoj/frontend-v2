import { effectScope } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { probePackage, requestPackage } from '@/api/problem-package.api';
import type { PackageProbe } from '@/api/problem-package.api';
import { packageStatus } from '@/test/f4-fixtures';
import { PACKAGE_GIVE_UP_MS, useProblemPackage } from './use-problem-package';

vi.mock('@/api/problem-package.api', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  requestPackage: vi.fn(),
  probePackage: vi.fn(),
}));
const request = vi.mocked(requestPackage);
const probe = vi.mocked(probePackage);
const building = (retryAfterMs = 3000): PackageProbe => ({ state: 'building', retryAfterMs });

function setup() {
  const scope = effectScope();
  const result = scope.run(() => useProblemPackage(() => 'cuvui'))!;
  return { ...result, scope };
}
beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] }));
afterEach(() => {
  vi.useRealTimers();
  request.mockReset();
  probe.mockReset();
});

describe('useProblemPackage', () => {
  it('polls GET at the server pace after one POST until the zip is ready', async () => {
    request.mockResolvedValue(packageStatus('building'));
    probe.mockResolvedValueOnce(building(5000)).mockResolvedValue({ state: 'ready' });
    const { phase, start } = setup();
    await start();
    expect(phase.value).toBe('building');
    await vi.advanceTimersByTimeAsync(2999);
    expect(probe).toHaveBeenCalledTimes(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(probe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(phase.value).toBe('ready');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('sends one POST for a double click', () => {
    request.mockReturnValue(new Promise(() => {}));
    const { start } = setup();
    void start();
    void start();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('names a too-large package and stops polling', async () => {
    request.mockResolvedValue(packageStatus('building'));
    probe.mockResolvedValue({ state: 'failed', reason: 'package_too_large', retryAfterMs: 3000 });
    const { phase, failureText, start } = setup();
    await start();
    await vi.advanceTimersByTimeAsync(3000);
    expect(phase.value).toBe('failed');
    expect(failureText.value).toContain('512 MiB');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it('gives up after five minutes of building', async () => {
    request.mockResolvedValue(packageStatus('building'));
    probe.mockResolvedValue(building(10_000));
    const { phase, failureText, start } = setup();
    await start();
    await vi.advanceTimersByTimeAsync(PACKAGE_GIVE_UP_MS + 10_000);
    expect(phase.value).toBe('failed');
    expect(failureText.value).toContain('5 phút');
  });

  it('stops asking once its scope is disposed (the tab was left)', async () => {
    request.mockResolvedValue(packageStatus('building'));
    probe.mockResolvedValue(building(3000));
    const { start, scope } = setup();
    await start();
    scope.stop();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(probe).not.toHaveBeenCalled();
  });
});
