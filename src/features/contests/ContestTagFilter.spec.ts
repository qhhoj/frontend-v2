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
});
