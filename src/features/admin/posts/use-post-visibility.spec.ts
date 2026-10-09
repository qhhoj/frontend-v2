import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { postItem } from '@/test/community-fixtures';
import { mountComponent } from '@/test/mount';
import { usePostVisibility } from './use-post-visibility';

const api = vi.hoisted(() => ({ hidePost: vi.fn(), showPost: vi.fn() }));
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
    api.showPost.mockReturnValue(new Promise<void>((resolve) => (release = resolve)));
    const visibility = mountHook();
    const post = postItem({ id: 'h-1', visible: false });
    const first = visibility.show(post);
    expect(visibility.pendingId.value).toBe('h-1');
    expect(await visibility.show(post)).toBeUndefined();
    expect(visibility.pendingId.value).toBe('h-1');
    expect(api.showPost).toHaveBeenCalledTimes(1);
    release();
    await first;
    expect(visibility.pendingId.value).toBeNull();
  });

  it('hides through hidePost and shows through showPost', async () => {
    api.hidePost.mockResolvedValue({});
    api.showPost.mockResolvedValue({});
    const visibility = mountHook();
    const post = postItem({ id: 'p-9' });
    await visibility.hide(post);
    await visibility.show(post);
    expect(api.hidePost).toHaveBeenCalledWith('p-9');
    expect(api.showPost).toHaveBeenLastCalledWith('p-9');
  });
});
