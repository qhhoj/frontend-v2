import { flushPromises } from '@vue/test-utils';
import { vi } from 'vitest';
import { mountApp } from '@/test/mount';

type Mounted = Awaited<ReturnType<typeof mountApp>>;

/**
 * AdminShell and each editor tab load lazily, after `mountApp` has returned: wait until `text` is on the page, then let the
 * page's own queries settle.
 */
export async function mountAndWaitFor(path: string, text: string): Promise<Mounted> {
  const mounted = await mountApp(path);
  await vi.waitFor(() => {
    if (!mounted.wrapper.text().includes(text)) throw new Error(`"${text}" is not on the page yet`);
  });
  await flushPromises();
  return mounted;
}
