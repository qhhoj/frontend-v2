import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import AppButton from './AppButton.vue';
import IconButton from './IconButton.vue';
import { buttonClasses } from './button-classes';
import type { ButtonShape, ButtonSize, ButtonTone } from './button-classes';

beforeEach(() => mockApi({ ...anonymousViewer }));

const mountButton = (props: Record<string, unknown> = {}) =>
  mountComponent(AppButton, {
    props,
    slots: { default: 'Lưu', icon: '<i data-testid="icon"></i>' },
  });

describe('AppButton', () => {
  it('is a plain button that emits its click', async () => {
    const wrapper = mountButton();
    const button = wrapper.get('button');
    expect(button.attributes('type')).toBe('button');
    await button.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('stays focusable when disabled and swallows the click', async () => {
    const wrapper = mountButton({ disabled: true });
    const button = wrapper.get('button');
    expect(button.attributes('aria-disabled')).toBe('true');
    expect(button.attributes('disabled')).toBeUndefined();
    await button.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('shows a spinner in place of the icon while loading and keeps the label', async () => {
    const wrapper = mountButton({ loading: true });
    const button = wrapper.get('button');
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.attributes('aria-disabled')).toBe('true');
    expect(button.text()).toBe('Lưu');
    expect(button.find('[data-testid="icon"]').exists()).toBe(false);
    expect(button.find('svg.motion-safe\\:animate-spin').exists()).toBe(true);
    await button.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('keeps a submit button from submitting while it cannot act', () => {
    const wrapper = mountButton({ type: 'submit', disabled: true });
    const button = wrapper.get('button');
    expect(button.attributes('type')).toBe('submit');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.element.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  it('renders `to` as a router link that navigates', async () => {
    const wrapper = mountButton({ to: '/problems' });
    const push = vi.spyOn(wrapper.vm.$router, 'push').mockResolvedValue(undefined);
    const link = wrapper.get('a');
    expect(link.attributes('href')).toBe('/problems');
    await link.trigger('click');
    expect(push).toHaveBeenCalledWith('/problems');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not navigate from a disabled router link', () => {
    const wrapper = mountButton({ to: '/problems', disabled: true });
    const push = vi.spyOn(wrapper.vm.$router, 'push');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    wrapper.get('a').element.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(push).not.toHaveBeenCalled();
  });

  it('renders `href` as a plain link and keeps the caller’s attributes', () => {
    const wrapper = mountComponent(AppButton, {
      props: { href: 'https://example.com', target: '_blank', class: 'mt-2' },
      slots: { default: 'Mở' },
    });
    const link = wrapper.get('a');
    expect(link.attributes('href')).toBe('https://example.com');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.classes()).toContain('mt-2');
    expect(link.classes()).toContain('rounded-control');
  });
});

describe('IconButton', () => {
  it('names itself with its label, for assistive tech and as a tooltip', async () => {
    const wrapper = mountComponent(IconButton, {
      props: { label: 'Xóa' },
      slots: { default: '<i data-testid="icon"></i>' },
    });
    const button = wrapper.get('button');
    expect(button.attributes('aria-label')).toBe('Xóa');
    expect(button.attributes('title')).toBe('Xóa');
    expect(button.find('[data-testid="icon"]').exists()).toBe(true);
    await button.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});

describe('buttonClasses', () => {
  const tones: ButtonTone[] = ['primary', 'secondary', 'ghost', 'danger'];
  const sizes: ButtonSize[] = ['sm', 'md', 'lg'];
  const shapes: ButtonShape[] = ['token', 'admin', 'pill'];
  const every = shapes.flatMap((shape) =>
    tones.flatMap((tone) => sizes.map((size) => buttonClasses({ tone, size, shape }))),
  );

  it('never dims with opacity and always draws a disabled look', () => {
    for (const classes of every) {
      expect(classes).not.toMatch(/opacity/);
      expect(classes).toMatch(/aria-disabled:text-/);
    }
  });

  it('takes its corner from the control token, so the admin scope gets 12 px', () => {
    expect(buttonClasses().split(' ')).toContain('rounded-control');
    expect(buttonClasses({ shape: 'admin' }).split(' ')).toContain('rounded-cell');
  });

  it('gives an icon-only button no side padding, and a block button the full width', () => {
    const square = buttonClasses({ iconOnly: true }).split(' ');
    expect(square).toContain('px-0');
    expect(square.filter((name) => /^px-/.test(name))).toEqual(['px-0']);
    expect(buttonClasses({ block: true }).split(' ')).toContain('w-full');
  });
});
