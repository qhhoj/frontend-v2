import { flushPromises } from '@vue/test-utils';
import { vi } from 'vitest';
import { mountApp } from '@/test/mount';

type Mounted = Awaited<ReturnType<typeof mountApp>>;
/** The first lazy chunk of a file loads cold (transform and mount), which takes longer than vitest's default one second. */
const LAZY_TAB_TIMEOUT_MS = 5000;

/**
 * AdminShell and each editor tab load lazily, after `mountApp` has returned: wait until `text` is on the page, then let the
 * page's own queries settle.
 */
export async function mountAndWaitFor(path: string, text: string): Promise<Mounted> {
  const mounted = await mountApp(path);
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.text().includes(text))
        throw new Error(`"${text}" is not on the page yet`);
    },
    { timeout: LAZY_TAB_TIMEOUT_MS },
  );
  await flushPromises();
  return mounted;
}
