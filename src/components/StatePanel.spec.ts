import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import type { StateKind } from '@/mascot/state-bits';
import StatePanel from './StatePanel.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));

/** Each state's Bit as the page must draw it: the variant and the spoken label, written out (not read from STATE_BITS). */
const EXPECTED_BIT: Record<StateKind, { variant: string; label: string }> = {
  empty: { variant: 'asleep', label: 'Bit ngủ trong mũ ngủ' },
  communityEmpty: { variant: 'community', label: 'Ba Bit trên bục' },
  error: { variant: 'sweat', label: 'Bit toát mồ hôi' },
  signIn: { variant: 'security', label: 'Bit cầm ổ khóa' },
  forbidden: { variant: 'security', label: 'Bit cầm ổ khóa' },
  notFound: { variant: 'crying', label: 'Bit đang khóc' },
  success: { variant: 'crown', label: 'Bit đội vương miện' },
  sent: { variant: 'envelope', label: 'Bit cầm phong thư' },
  staff: { variant: 'staff', label: 'Bit đội mũ bảo hộ' },
};

describe('StatePanel', () => {
  it('draws exactly one labelled Bit per state, the expected kind for each', () => {
    for (const [kind, expected] of Object.entries(EXPECTED_BIT) as [
      StateKind,
      { variant: string; label: string },
    ][]) {
      const panel = mountComponent(StatePanel, { props: { kind, title: 'T' } });
      const images = panel.findAll('[role="img"]');
      expect(
        images.map((image) => image.attributes('aria-label')),
        kind,
      ).toEqual([expected.label]);
      expect(panel.get('[data-bit-variant]').attributes('data-bit-variant'), kind).toBe(
        expected.variant,
      );
    }
  });
  it('shows the crying tears on a 404 and on no other state', () => {
    for (const kind of Object.keys(EXPECTED_BIT) as StateKind[]) {
      const panel = mountComponent(StatePanel, { props: { kind, title: 'T' } });
      expect(panel.findAll('.bit-tear').length > 0, kind).toBe(kind === 'notFound');
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
