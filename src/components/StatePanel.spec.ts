import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import { STATE_BITS } from '@/mascot/state-bits';
import type { StateKind } from '@/mascot/state-bits';
import StatePanel from './StatePanel.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));

describe('StatePanel', () => {
  it('shows a labelled Bit on every kind of state, the crying Bit on a 404 and the trio on a community empty', () => {
    for (const kind of Object.keys(STATE_BITS) as StateKind[]) {
      const panel = mountComponent(StatePanel, { props: { kind, title: 'T' } });
      expect(panel.find('[role="img"]').exists(), kind).toBe(true);
      expect(panel.findAll('.bit-tear').length > 0, kind).toBe(kind === 'notFound');
      expect(panel.get('[data-bit-variant]').attributes('data-bit-variant'), kind).toBe(
        STATE_BITS[kind].variant,
      );
    }
  });
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
  it('renders the actions slot under the body', () => {
    const panel = mountComponent(StatePanel, {
      props: { kind: 'signIn', title: 'T', body: 'B' },
      slots: { default: '<a href="/login">Đăng nhập</a>' },
    });
    expect(panel.text()).toContain('B');
    expect(panel.get('a').text()).toBe('Đăng nhập');
  });
});
