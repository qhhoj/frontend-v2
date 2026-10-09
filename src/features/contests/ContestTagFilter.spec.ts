import { describe, expect, it } from 'vitest';
import { TAG_CATALOGUE } from '@/test/contest-extras-fixtures';
import { mountComponent } from '@/test/mount';
import ContestTagFilter from './ContestTagFilter.vue';

const mountFilter = (props: Record<string, unknown>) =>
  mountComponent(ContestTagFilter, {
    props: {
      tags: TAG_CATALOGUE,
      selected: null,
      state: 'none',
      isLoading: false,
      hasFailed: false,
      ...props,
    },
  });
const pressedTexts = (wrapper: ReturnType<typeof mountFilter>) =>
  wrapper
    .findAll('button')
    .filter((button) => button.attributes('aria-pressed') === 'true')
    .map((button) => button.text());

describe('contest tag filter row', () => {
  it('offers "Tất cả" then every catalogue tag, with the selected one pressed', () => {
    const wrapper = mountFilter({ selected: 'quoc-gia', state: 'applied' });
    const buttons = wrapper.findAll('button');
    expect(buttons.map((button) => button.text())).toEqual([
      'Tất cả',
      ...TAG_CATALOGUE.map((tag) => tag.name),
    ]);
    expect(pressedTexts(wrapper)).toEqual(['Quốc gia']);
    expect(buttons[5]!.classes()).toContain('text-tag-5');
  });

  it('emits the slug of a chip and null for "Tất cả"', async () => {
    const wrapper = mountFilter({ selected: 'icpc', state: 'applied' });
    await wrapper.findAll('button')[1]!.trigger('click');
    await wrapper.findAll('button')[0]!.trigger('click');
    expect(wrapper.emitted('select')).toEqual([['olympic'], [null]]);
  });

  it('names an unknown tag and reads "Tất cả" as pressed, since every contest is listed', () => {
    const wrapper = mountFilter({ selected: 'abc-xyz', state: 'unknown' });
    expect(wrapper.get('[data-testid="tag-unknown"]').text()).toContain('abc-xyz');
    expect(pressedTexts(wrapper)).toEqual(['Tất cả']);
  });

  it('keeps a blank, inert row of the loading height when the catalogue is empty', () => {
    const wrapper = mountFilter({ tags: [] });
    const filter = wrapper.get('[data-testid="tag-filter"]');
    expect(filter.findAll('button')).toHaveLength(0);
    expect(filter.find('nav').exists()).toBe(false);
    expect(filter.get('div[aria-hidden="true"]').classes()).toContain('h-13');
  });

  it('replaces the row with a notice when the catalogue cannot be read', () => {
    const wrapper = mountFilter({ tags: [], hasFailed: true });
    expect(wrapper.findAll('button')).toHaveLength(0);
    expect(wrapper.get('[data-testid="tag-failed"]').text()).toContain(
      'Không tải được danh sách thẻ',
    );
  });

  it('draws inert pill blocks while the catalogue loads, and nothing for an empty catalogue', () => {
    const loading = mountFilter({ tags: [], isLoading: true });
    expect(loading.findAll('[data-skeleton-region="tag-chip"]')).toHaveLength(5);
    expect(loading.findAll('button')).toHaveLength(0);
    expect(mountFilter({ tags: [] }).find('nav').exists()).toBe(false);
  });
});
