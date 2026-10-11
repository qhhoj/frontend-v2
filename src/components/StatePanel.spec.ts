import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import StatePanel from './StatePanel.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));

describe('StatePanel', () => {
  it('alerts on errors only and puts the title at the requested heading level', () => {
    const error = mountComponent(StatePanel, {
      props: { kind: 'forbidden', title: 'Không có quyền', isPageHeading: true },
    });
    expect(error.get('[data-testid="state-panel"]').attributes('role')).toBe('alert');
    expect(error.get('h1').text()).toBe('Không có quyền');
    const empty = mountComponent(StatePanel, { props: { kind: 'empty', title: 'Chưa có gì' } });
    expect(empty.get('[data-testid="state-panel"]').attributes('role')).toBeUndefined();
    expect(empty.get('h2').text()).toBe('Chưa có gì');
  });
});
