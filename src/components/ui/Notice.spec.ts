import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import Notice from './Notice.vue';

describe('Notice', () => {
  it('interrupts on danger, announces success politely and leaves advice silent', () => {
    expect(mountComponent(Notice, { props: { tone: 'danger' } }).attributes('role')).toBe('alert');
    expect(mountComponent(Notice, { props: { tone: 'success' } }).attributes('role')).toBe(
      'status',
    );
    expect(mountComponent(Notice, { props: { tone: 'info' } }).attributes('role')).toBeUndefined();
    expect(
      mountComponent(Notice, { props: { tone: 'danger', role: null } }).attributes('role'),
    ).toBeUndefined();
  });

  it('keeps the details behind a disclosure until it is opened', async () => {
    const wrapper = mountComponent(Notice, {
      props: { title: 'Gói đề cũ' },
      slots: { details: '<p>Giải thích dài</p>' },
    });
    const toggle = wrapper.get('button[aria-expanded]');
    const details = wrapper.get(`#${toggle.attributes('aria-controls')}`);
    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(details.isVisible()).toBe(false);
    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(details.isVisible()).toBe(true);
  });
});
