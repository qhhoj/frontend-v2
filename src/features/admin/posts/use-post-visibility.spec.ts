import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { postItem } from '@/test/community-fixtures';
import { mountComponent } from '@/test/mount';
import { usePostVisibility } from './use-post-visibility';

const api = vi.hoisted(() => ({ patchPostFlag: vi.fn() }));
vi.mock('@/api/blog-admin.api', () => api);

function mountHook() {
  let visibility!: ReturnType<typeof usePostVisibility>;
  mountComponent(
    defineComponent({
      setup() {
        visibility = usePostVisibility();
        return () => h('div');
      },
    }),
  );
  return visibility;
}

describe('usePostVisibility', () => {
  it('holds the post id while the write runs, ignores a second call, and lets go afterwards', async () => {
    let release!: () => void;
    api.patchPostFlag.mockReturnValue(new Promise<void>((resolve) => (release = resolve)));
    const visibility = mountHook();
    const post = postItem({ id: 'h-1', visible: false });
    const first = visibility.show(post);
    expect(visibility.pendingId.value).toBe('h-1');
    expect(await visibility.show(post)).toBeUndefined();
    expect(visibility.pendingId.value).toBe('h-1');
    expect(api.patchPostFlag).toHaveBeenCalledTimes(1);
    release();
    await first;
    expect(visibility.pendingId.value).toBeNull();
  });
});
