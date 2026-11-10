import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import Tabs from './Tabs.vue';
import type { TabItem } from './Tabs.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));

const SECTIONS: TabItem[] = [
  { key: 'statement', label: 'Đề bài', panelId: 'p-statement' },
  { key: 'data', label: 'Dữ liệu', panelId: 'p-data', count: 3, countLabel: '3 tệp' },
  { key: 'history', label: 'Lịch sử', panelId: 'p-history' },
];

/** In the document, so focus moves can be read from `document.activeElement`. */
const mountTablist = (modelValue?: string) => {
  const wrapper = mountComponent(Tabs, {
    props: { items: SECTIONS, label: 'Mục', modelValue, overflow: 'scroll' },
  });
  document.body.append(wrapper.element);
  return wrapper;
};

const tabs = (wrapper: ReturnType<typeof mountTablist>) => wrapper.findAll('[role="tab"]');

describe('Tabs as an in-page tablist', () => {
  it('names the tablist, links each tab to its panel and selects the model key', () => {
    const wrapper = mountTablist('data');
    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toBe('Mục');
    const data = tabs(wrapper)[1]!;
    expect(data.attributes('aria-controls')).toBe('p-data');
    expect(data.attributes('id')).toBe('p-data-tab');
    expect(data.attributes('aria-selected')).toBe('true');
    expect(tabs(wrapper).map((tab) => tab.attributes('tabindex'))).toEqual(['-1', '0', '-1']);
  });

  it('keeps the first tab reachable when nothing is selected yet', () => {
    const wrapper = mountTablist();
    expect(tabs(wrapper).map((tab) => tab.attributes('tabindex'))).toEqual(['0', '-1', '-1']);
  });

  it('moves the selection and focus with the arrow keys, wrapping, and jumps with Home and End', async () => {
    const wrapper = mountTablist('statement');
    await tabs(wrapper)[0]!.trigger('keydown', { key: 'ArrowLeft' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['history']);
    expect(document.activeElement).toBe(tabs(wrapper)[2]!.element);
    await tabs(wrapper)[0]!.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['data']);
    await tabs(wrapper)[1]!.trigger('keydown', { key: 'End' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['history']);
    await tabs(wrapper)[2]!.trigger('keydown', { key: 'Home' });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['statement']);
    wrapper.unmount();
  });

  it('ignores other keys and selects on click', async () => {
    const wrapper = mountTablist('statement');
    await tabs(wrapper)[0]!.trigger('keydown', { key: 'a' });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    await tabs(wrapper)[2]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['history']);
  });

  it('speaks the count label instead of the bare number', () => {
    const wrapper = mountTablist('data');
    expect(tabs(wrapper)[1]!.get('.sr-only').text()).toBe('3 tệp');
    expect(tabs(wrapper)[1]!.get('[aria-hidden="true"]').text()).toBe('3');
  });
});

/** A 200 px strip of 80 px tabs: the third (160 to 240) does not fit. jsdom has no layout. */
function fakeStripLayout() {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(240);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80);
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    const item = this.closest('li');
    return item ? [...item.parentElement!.children].indexOf(item) * 80 : 0;
  });
}

describe('Tabs with the overflow menu', () => {
  it('hides a tab that does not fit whole, lists it behind ⋯, and scrolls to and focuses it when selected', async () => {
    fakeStripLayout();
    const wrapper = mountComponent(Tabs, {
      props: {
        items: SECTIONS,
        label: 'Mục',
        modelValue: 'statement',
        // Tabs' defineModel prop is not in the mounted type; the cast only satisfies setProps.
        'onUpdate:modelValue': (key?: string) => wrapper.setProps({ modelValue: key } as never),
      },
    });
    document.body.append(wrapper.element);
    await nextTick();
    const rows = () => wrapper.findAll('li');
    expect(rows()[2]!.classes()).toContain('invisible');
    expect(wrapper.find('[data-testid="tabs-more"]').attributes('aria-label')).toBe('Thêm');
    await tabs(wrapper)[0]!.trigger('keydown', { key: 'End' });
    await nextTick();
    expect(rows()[2]!.classes()).not.toContain('invisible');
    expect(rows()[0]!.classes()).toContain('invisible');
    expect(document.activeElement).toBe(tabs(wrapper)[2]!.element);
    wrapper.unmount();
  });
});

describe('Tabs overflow marks', () => {
  it('shows a hidden tab’s unsaved edits on the ⋯ button, in its name and as a mark', async () => {
    fakeStripLayout();
    const items = SECTIONS.map((item) => (item.key === 'history' ? { ...item, dirty: 2 } : item));
    const wrapper = mountComponent(Tabs, {
      props: { items, label: 'Mục', modelValue: 'statement' },
    });
    await nextTick();
    expect(wrapper.findAll('li')[2]!.classes()).toContain('invisible');
    expect(wrapper.get('[data-testid="tabs-more"]').attributes('aria-label')).toBe(
      'Thêm: có thay đổi chưa lưu ở mục ẩn',
    );
    expect(wrapper.find('[data-testid="tabs-more-mark"]').exists()).toBe(true);
  });

  it('shows a hidden tab’s waiting count (accent) on the ⋯ button and its words in the menu, a plain count nowhere', async () => {
    fakeStripLayout();
    const waiting = SECTIONS.map((item) =>
      item.key === 'history'
        ? { ...item, count: 3, countTone: 'accent' as const, countLabel: '3 yêu cầu chờ duyệt' }
        : item,
    );
    const wrapper = mountComponent(Tabs, {
      props: { items: waiting, label: 'Mục', modelValue: 'statement' },
    });
    await nextTick();
    expect(wrapper.get('[data-testid="tabs-more"]').attributes('aria-label')).toBe(
      'Thêm: 3 yêu cầu chờ duyệt',
    );
    expect(wrapper.find('[data-testid="tabs-more-mark"]').exists()).toBe(true);
    const plain = mountComponent(Tabs, {
      props: { items: SECTIONS, label: 'Mục', modelValue: 'statement' },
    });
    await nextTick();
    expect(plain.get('[data-testid="tabs-more"]').attributes('aria-label')).toBe('Thêm');
    expect(plain.find('[data-testid="tabs-more-mark"]').exists()).toBe(false);
  });
});

describe('Tabs as links', () => {
  const LINKS: TabItem[] = [
    { key: 'all', label: 'Tất cả', to: '/users' },
    { key: 'banned', label: 'Bị cấm', to: '/users?tab=banned', isCurrent: true },
  ];

  it('is a named nav whose current link follows isCurrent without a model', async () => {
    const wrapper = mountComponent(Tabs, { props: { items: LINKS, label: 'Danh sách' } });
    await wrapper.vm.$router.push('/problems');
    const nav = wrapper.get('nav');
    expect(nav.attributes('aria-label')).toBe('Danh sách');
    expect(nav.find('[role="tablist"]').exists()).toBe(false);
    expect(nav.get('[aria-current="page"]').text()).toBe('Bị cấm');
  });

  it('marks only the model key current when a model is given', async () => {
    const wrapper = mountComponent(Tabs, {
      props: { items: LINKS, label: 'Danh sách', modelValue: 'all' },
    });
    await wrapper.vm.$router.push('/problems');
    expect(wrapper.findAll('[aria-current="page"]').map((link) => link.text())).toEqual(['Tất cả']);
  });
});

describe('Tabs that scroll', () => {
  it('scrolls the current tab into view, on mount and when it changes', async () => {
    fakeStripLayout();
    const wrapper = mountComponent(Tabs, {
      props: { items: SECTIONS, label: 'Mục', modelValue: 'history', overflow: 'scroll' },
    });
    document.body.append(wrapper.element);
    await nextTick();
    const strip = wrapper.get('ul').element.parentElement!;
    expect(strip.scrollLeft).toBe(80);
    // Tabs' defineModel prop is not in the mounted type; the cast only satisfies setProps.
    await wrapper.setProps({ modelValue: 'statement' } as never);
    await nextTick();
    await nextTick();
    expect(strip.scrollLeft).toBe(0);
    wrapper.unmount();
  });
});
