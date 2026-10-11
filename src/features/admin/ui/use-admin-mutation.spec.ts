import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useQueryClient } from '@tanstack/vue-query';
import { defineComponent, h } from 'vue';
import { ApiError } from '@/api/client';
import { mountComponent } from '@/test/mount';
import { useAdminMutation } from './use-admin-mutation';
import type { AdminQueryKey } from './use-admin-mutation';

const host = (
  mutate: (vars: { name: string }) => Promise<string>,
  invalidates: (vars: { name: string }) => AdminQueryKey[] = (vars) => [
    ['admin', 'thing', vars.name],
  ],
) => {
  let api!: ReturnType<typeof useAdminMutation<{ name: string }, string>>;
  let invalidate!: ReturnType<typeof vi.spyOn>;
  mountComponent(
    defineComponent({
      setup() {
        invalidate = vi.spyOn(useQueryClient(), 'invalidateQueries');
        api = useAdminMutation({ mutate, invalidates });
        return () => h('div');
      },
    }),
  );
  return { api: () => api, invalidate: () => invalidate };
};

describe('useAdminMutation', () => {
  it('reports success before a slow cache refresh finishes', async () => {
    const order: string[] = [];
    let finishRefresh!: () => void;
    let api!: ReturnType<typeof useAdminMutation<string, string>>;
    mountComponent(
      defineComponent({
        setup() {
          vi.spyOn(useQueryClient(), 'invalidateQueries').mockImplementation(
            () => new Promise<void>((resolve) => (finishRefresh = resolve)),
          );
          api = useAdminMutation({
            mutate: (name: string) => Promise.resolve(name),
            invalidates: () => [['admin', 'thing']],
            onSuccess: () => order.push('success'),
            onDone: () => order.push('done'),
          });
          return () => h('div');
        },
      }),
    );
    const running = api.run('a');
    await flushPromises();
    expect(order).toEqual(['success']);
    finishRefresh();
    await running;
    expect(order).toEqual(['success', 'done']);
  });

  it('turns a validation failure into field texts and resolves undefined', async () => {
    const { api } = host(() =>
      Promise.reject(
        new ApiError('validation_failed', 400, 'bad', {
          issues: [{ field: 'name', code: 'max_length', message: 'm' }],
        }),
      ),
    );
    await expect(api().run({ name: 'a' })).resolves.toBeUndefined();
    expect(api().fieldErrors.value).toEqual({ name: 'Quá dài.' });
    expect(api().failure.value?.code).toBe('validation_failed');
    expect(api().isDone.value).toBe(false);
  });

  it('clears the previous errors when run again', async () => {
    let attempt = 0;
    const { api } = host(() => {
      attempt += 1;
      if (attempt === 1) return Promise.reject(new ApiError('conflict', 409, 'locked'));
      return Promise.resolve('ok');
    });
    await api().run({ name: 'a' });
    expect(api().failure.value?.code).toBe('conflict');
    await api().run({ name: 'a' });
    expect(api().failure.value).toBeNull();
  });

  it('sends nothing for a second run while the first is pending, and settles once', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const mutate = vi.fn((vars: { name: string }) => gate.then(() => vars.name));
    const { api } = host(mutate);
    const first = api().run({ name: 'a' });
    await expect(api().run({ name: 'a' })).resolves.toBeUndefined();
    expect(mutate).toHaveBeenCalledTimes(1);
    release();
    await expect(first).resolves.toBe('a');
    expect(api().isPending.value).toBe(false);
    expect(api().isDone.value).toBe(true);
  });

  it('lets a programming error through instead of turning it into a page line', async () => {
    const { api } = host(() => Promise.reject(new TypeError('bug in the page')));
    await expect(api().run({ name: 'a' })).rejects.toThrow('bug in the page');
    expect(api().isPending.value).toBe(false);
  });
});
