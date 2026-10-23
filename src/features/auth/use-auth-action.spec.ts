import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import type { FieldIssue } from '@/api/client';
import { mountComponent } from '@/test/mount';
import { useAuthAction } from './use-auth-action';

/** A form with two inputs, aria-invalid wired like AuthField does. */
function mountForm(visibleFields: readonly string[]) {
  let action!: ReturnType<typeof useAuthAction>;
  const Host = defineComponent({
    setup() {
      const form = ref<HTMLFormElement | null>(null);
      action = useAuthAction(form, visibleFields);
      return () =>
        h('form', { ref: form }, [
          h('input', {
            id: 'first',
            'aria-invalid': action.fieldErrors.value.first ? 'true' : undefined,
          }),
          h('input', {
            id: 'second',
            'aria-invalid': action.fieldErrors.value.second ? 'true' : undefined,
          }),
        ]);
    },
  });
  mountComponent(Host);
  return action;
}

const rejected = (error: Error) => () => Promise.reject(error);
const validation = (...issues: FieldIssue[]) =>
  new ApiError('validation_failed', 400, 'x', { issues });
const taken = (field: string) => ({ field, code: 'username_taken', message: 'Username is taken.' });

describe('useAuthAction', () => {
  it('is pending while the request runs and ignores a second submit', async () => {
    const action = mountForm([]);
    let calls = 0;
    let release!: () => void;
    const slow = () => {
      calls += 1;
      return new Promise<void>((resolve) => (release = resolve));
    };
    const first = action.run(slow);
    expect(action.pending.value).toBe(true);
    expect(await action.run(slow)).toBe(false);
    expect(calls).toBe(1);
    release();
    await first;
    expect(action.pending.value).toBe(false);
  });

  it('puts field messages at their inputs and focuses the first invalid one', async () => {
    const action = mountForm(['first', 'second']);
    await action.run(rejected(validation(taken('second'))));
    await flushPromises();
    expect(action.fieldErrors.value).toEqual({ second: 'Tên đăng nhập đã được dùng.' });
    expect(action.summary.value).toBeNull();
    expect(document.activeElement?.id).toBe('second');
  });

  it('falls back to the generic summary for an unknown issue on a field the form does not show', async () => {
    const action = mountForm(['first']);
    await action.run(
      rejected(
        validation({ field: 'token', code: 'brand_new_code', message: 'token is too long' }),
      ),
    );
    expect(action.summary.value).toBe('Dữ liệu chưa hợp lệ.');
  });

  it('explains a known issue on a field the form does not show, in the summary', async () => {
    const action = mountForm(['first']);
    await action.run(
      rejected(
        validation({
          field: 'email',
          code: 'email_taken',
          message: 'Email is already registered.',
        }),
      ),
    );
    expect(action.summary.value).toBe(
      'Email này đã được đăng ký. Hãy đăng nhập hoặc đặt lại mật khẩu.',
    );
  });

  it('drops a field message once the viewer edits that field, without raising the summary', async () => {
    const action = mountForm(['first']);
    await action.run(rejected(validation(taken('first'))));
    action.dismiss('first');
    await nextTick();
    expect(action.fieldErrors.value).toEqual({});
    expect(action.summary.value).toBeNull();
  });

  it('forgets dismissed fields on the next attempt', async () => {
    const action = mountForm(['first']);
    await action.run(rejected(validation(taken('first'))));
    action.dismiss('first');
    await action.run(rejected(validation(taken('first'))));
    expect(action.fieldErrors.value).toEqual({ first: 'Tên đăng nhập đã được dùng.' });
  });
});
