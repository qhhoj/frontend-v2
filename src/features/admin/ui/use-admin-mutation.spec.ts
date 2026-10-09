import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { useQueryClient } from '@tanstack/vue-query';
import { defineComponent, h } from 'vue';
import { ApiError } from '@/api/client';
import { mountComponent } from '@/test/mount';
import { useAdminMutation } from './use-admin-mutation';

const host = (mutate: (vars: { name: string }) => Promise<string>) => {
  let api!: ReturnType<typeof useAdminMutation<{ name: string }, string>>;
  let invalidate!: ReturnType<typeof vi.spyOn>;
  mountComponent(
    defineComponent({
      setup() {
        invalidate = vi.spyOn(useQueryClient(), 'invalidateQueries');
        api = useAdminMutation({ mutate, invalidates: (vars) => [['admin', 'thing', vars.name]] });
        return () => h('div');
      },
    }),
  );
  return { api: () => api, invalidate: () => invalidate };
};

describe('useAdminMutation', () => {
  it('marks done and invalidates exactly the keys it names', async () => {
    const { api, invalidate } = host((vars) => Promise.resolve(vars.name));
    await expect(api().run({ name: 'a' })).resolves.toBe('a');
    await flushPromises();
    expect(api().isDone.value).toBe(true);
    expect(invalidate()).toHaveBeenCalledWith({ queryKey: ['admin', 'thing', 'a'] });
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

describe('useAdminMutation with a public key', () => {
  it('invalidates a public cache prefix', async () => {
    let api!: ReturnType<typeof useAdminMutation<undefined, string>>;
    let invalidate!: ReturnType<typeof vi.spyOn>;
    mountComponent(
      defineComponent({
        setup() {
          invalidate = vi.spyOn(useQueryClient(), 'invalidateQueries');
          api = useAdminMutation({
            mutate: () => Promise.resolve('ok'),
            invalidates: () => [['problems'], ['contests', 'ranking']],
          });
          return () => h('div');
        },
      }),
    );
    await api.run(undefined);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['problems'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['contests', 'ranking'] });
  });
});
