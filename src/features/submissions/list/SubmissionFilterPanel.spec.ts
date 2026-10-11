import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { problemMeta } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import SubmissionQuickFilters from '../SubmissionQuickFilters.vue';
import { parseSubmissionFilters } from '../use-submission-filters';
import SubmissionFilterPanel from './SubmissionFilterPanel.vue';

beforeEach(() => {
  mockApi({ ...anonymousViewer });
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => vi.useRealTimers());

const mountPanel = (showStatusGroups = false) =>
  mountComponent(SubmissionFilterPanel, {
    props: {
      filters: parseSubmissionFilters({}),
      problemSource: { kind: 'code' as const },
      showUser: true,
      showStatusGroups,
    },
  });

describe('the submission filter panel', () => {
  it('emits one update 300 ms after the last key of a burst, and no timer left after unmount', async () => {
    const wrapper = mountPanel();
    const field = wrapper.get('input[name="user"]');
    await field.setValue('u');
    await vi.advanceTimersByTimeAsync(200);
    await field.setValue('user_02');
    await vi.advanceTimersByTimeAsync(299);
    expect(wrapper.emitted('update')).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(wrapper.emitted('update')).toEqual([[{ user: 'user_02' }]]);
    await wrapper.get('input[name="problem"]').setValue('duongdi');
    expect(vi.getTimerCount()).toBe(1);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('emits the judging-state box ticked, and only where the scope shows those boxes', async () => {
    const wrapper = mountPanel(true);
    await wrapper.get('input[type="checkbox"][value="grading"]').setValue(true);
    expect(wrapper.emitted('update')).toEqual([[{ statusGroups: ['grading'] }]]);
    expect(mountPanel().find('input[value="grading"]').exists()).toBe(false);
  });
});

describe('the quick filters language box', () => {
  it('emits the chosen language as a one-element list and an empty list for "any"', async () => {
    const [first] = problemMeta().languages;
    const wrapper = mountComponent(SubmissionQuickFilters, {
      props: {
        filters: parseSubmissionFilters({}),
        languages: problemMeta().languages,
        username: null,
        gradingCount: undefined,
        advancedOpen: false,
        advancedCount: 0,
        panelId: 'panel',
      },
    });
    await wrapper.get('select').setValue(first!.id);
    await wrapper.get('select').setValue('');
    expect(wrapper.emitted('update')).toEqual([
      [{ languageIds: [first!.id] }],
      [{ languageIds: [] }],
    ]);
  });
});
