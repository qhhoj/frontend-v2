import { beforeEach, describe, expect, it } from 'vitest';
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
