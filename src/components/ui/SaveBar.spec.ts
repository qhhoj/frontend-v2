import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountComponent } from '@/test/mount';
import SaveBar from './SaveBar.vue';
import { SAVED_NOTE_MS } from './SaveBar.props';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const statusOf = (bar: ReturnType<typeof mountComponent>) => bar.get('[role="status"]').text();

describe('SaveBar', () => {
  it('counts unsaved changes and offers discard and save', () => {
    const bar = mountComponent(SaveBar, { props: { dirtyCount: 3 } });
    expect(statusOf(bar)).toBe('3 thay đổi chưa lưu');
    const [discard, save] = bar.findAll('button');
    expect(discard!.attributes('aria-disabled')).toBeUndefined();
    expect(save!.attributes('aria-disabled')).toBeUndefined();
  });

  it('discards one change at once and asks before discarding several', async () => {
    const one = mountComponent(SaveBar, { props: { dirtyCount: 1 } });
    await one.findAll('button')[0]!.trigger('click');
    expect(one.emitted('discard')).toHaveLength(1);

    const several = mountComponent(SaveBar, { props: { dirtyCount: 3 } });
    await several.findAll('button')[0]!.trigger('click');
    expect(several.emitted('discard')).toBeUndefined();
    expect(document.body.textContent).toContain('Hủy 3 thay đổi?');
  });

  it('shows the save time for three seconds, then its resting text', async () => {
    const bar = mountComponent(SaveBar, { props: { dirtyCount: 1 } });
    await bar.setProps({ dirtyCount: 0, savedAt: '2026-10-12T07:02:00Z' } as never);
    expect(statusOf(bar)).toBe('Đã lưu lúc 14:02');
    vi.advanceTimersByTime(SAVED_NOTE_MS);
    await bar.vm.$nextTick();
    expect(statusOf(bar)).toBe('Chưa có thay đổi nào để lưu.');
  });

  it('a new change replaces the save time at once', async () => {
    const bar = mountComponent(SaveBar, {
      props: { dirtyCount: 0, savedAt: '2026-10-12T07:02:00Z' },
    });
    await bar.setProps({ dirtyCount: 1 } as never);
    expect(statusOf(bar)).toBe('1 thay đổi chưa lưu');
  });

  it('while saving, neither discards nor submits again', async () => {
    const bar = mountComponent(SaveBar, { props: { dirtyCount: 2, pending: true } });
    const [discard, save] = bar.findAll('button');
    await discard!.trigger('click');
    expect(bar.emitted('discard')).toBeUndefined();
    expect(save!.text()).toBe('Đang lưu…');
    const click = new MouseEvent('click', { cancelable: true });
    save!.element.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  it('shows the reason saving is blocked instead of the count', () => {
    const bar = mountComponent(SaveBar, {
      props: { dirtyCount: 2, blockedReason: 'Sửa lỗi trước khi lưu.' },
    });
    expect(statusOf(bar)).toBe('Sửa lỗi trước khi lưu.');
    expect(bar.findAll('button')[1]!.attributes('aria-disabled')).toBe('true');
  });

  it('with hideIdleOnPhone, hides on phones only while it has nothing to say', async () => {
    const isHiddenOnPhone = (bar: ReturnType<typeof mountComponent>) =>
      bar.classes().includes('max-sm:hidden');
    const bar = mountComponent(SaveBar, { props: { dirtyCount: 0, hideIdleOnPhone: true } });
    expect(isHiddenOnPhone(bar)).toBe(true);
    await bar.setProps({ dirtyCount: 1 } as never);
    expect(isHiddenOnPhone(bar)).toBe(false);
    await bar.setProps({ dirtyCount: 0, savedAt: '2026-10-12T07:02:00Z' } as never);
    expect(isHiddenOnPhone(bar)).toBe(false);
    vi.advanceTimersByTime(SAVED_NOTE_MS);
    await bar.vm.$nextTick();
    expect(isHiddenOnPhone(bar)).toBe(true);
    const plain = mountComponent(SaveBar, { props: { dirtyCount: 0 } });
    expect(isHiddenOnPhone(plain)).toBe(false);
  });

  it('tells the save time in the given zone, and in the site zone for one the browser does not know', async () => {
    const bar = mountComponent(SaveBar, { props: { dirtyCount: 1, timeZone: 'UTC' } });
    await bar.setProps({ dirtyCount: 0, savedAt: '2026-10-12T07:02:00Z' } as never);
    expect(statusOf(bar)).toBe('Đã lưu lúc 07:02');
    const unknown = mountComponent(SaveBar, { props: { dirtyCount: 1, timeZone: 'Mars/Base' } });
    await unknown.setProps({ dirtyCount: 0, savedAt: '2026-10-12T07:02:00Z' } as never);
    expect(statusOf(unknown)).toBe('Đã lưu lúc 14:02');
  });
});
