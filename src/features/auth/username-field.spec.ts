import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { AVAILABILITY_DELAY_MS } from './use-username-availability';
import UsernameField from './UsernameField.vue';

const mountField = (modelValue: string, props: Record<string, unknown> = {}) =>
  mountComponent(UsernameField, { props: { modelValue, ...props } });
/** Lets the pause elapse and the answer arrive; only `setTimeout` is faked, reading a response needs the real event loop. */
const settle = async () => {
  await vi.advanceTimersByTimeAsync(AVAILABILITY_DELAY_MS);
  await flushPromises();
};
const lineOf = (wrapper: ReturnType<typeof mountField>) => {
  const ids = wrapper.get('input').attributes('aria-describedby')!.split(' ');
  return ids.map((id) => wrapper.get(`[id="${id}"]`)).find((node) => node.attributes('aria-live'))!;
};

describe('UsernameField', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    // `mountComponent` installs the router, whose first navigation asks `/auth/me`.
    mockApi({
      'GET /auth/me': signedOut,
      'GET /auth/username-available': (call) =>
        ok({ available: call.query.get('username') !== 'busy_name' }),
    });
  });
  afterEach(() => void vi.useRealTimers());

  it('flags characters the backend rejects, as they are typed', () => {
    const wrapper = mountField('bad name');
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Chỉ dùng chữ cái, chữ số và dấu gạch dưới.');
  });

  it('flags a name that is too long', () => {
    expect(mountField('x'.repeat(31)).text()).toContain('Tối đa 30 ký tự.');
  });

  it('shows the hint and a server error, and nothing invalid for an empty field', () => {
    const taken = mountField('user_01', { error: 'Tên đăng nhập đã được dùng.' });
    expect(taken.text()).toContain('Tên đăng nhập đã được dùng.');
    expect(taken.text()).toContain('tối đa 30 ký tự');
    expect(mountField('').find('[aria-invalid="true"]').exists()).toBe(false);
  });

  it('asks the browser for the username autocomplete', () => {
    const input = mountField('').get('input');
    expect(input.attributes('autocomplete')).toBe('username');
    expect(input.attributes('name')).toBe('username');
  });

  it('says it is checking, then that the name is free, in a polite line tied to the input', async () => {
    const wrapper = mountField('free_name');
    expect(lineOf(wrapper).attributes('aria-live')).toBe('polite');
    expect(lineOf(wrapper).text()).toBe('Đang kiểm tra tên…');
    await settle();
    expect(lineOf(wrapper).text()).toBe('Tên khả dụng');
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined();
  });

  it('shows a taken name as invalid, as the board draws it', async () => {
    const wrapper = mountField('busy_name');
    await settle();
    expect(lineOf(wrapper).text()).toBe('Tên đã có người dùng');
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
  });

  it('does not check a name the format check already rejects', async () => {
    const wrapper = mountField('bad name');
    await settle();
    expect(lineOf(wrapper).text()).toBe('');
  });
});
