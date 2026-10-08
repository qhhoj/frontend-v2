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
        new ApiError('validation_failed', 400, 'bad', {}, [
          { field: 'name', code: 'max_length', message: 'm' },
        ]),
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
});
