import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import AuthBadge from './AuthBadge.vue';

const ICON = '<svg data-testid="badge-icon"></svg>';

describe('AuthBadge', () => {
  it('paints each tone differently, from theme tokens and never a raw colour', () => {
    const tones = ['accent', 'positive', 'warning', 'negative'] as const;
    const painted = tones.map((tone) =>
      mountComponent(AuthBadge, { props: { tone }, slots: { default: ICON } })
        .classes()
        .join(' '),
    );
    expect(new Set(painted).size).toBe(tones.length);
    for (const classes of painted)
      expect(classes).not.toMatch(/#[0-9a-f]{3,8}|rgb|\b(red|green|blue)-/i);
  });

  it('hides the decoration from assistive technology and still renders its icon', () => {
    const badge = mountComponent(AuthBadge, {
      props: { tone: 'accent' },
      slots: { default: ICON },
    });
    expect(badge.attributes('aria-hidden')).toBe('true');
    expect(badge.find('[data-testid="badge-icon"]').exists()).toBe(true);
  });
});
