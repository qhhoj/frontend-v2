import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import AuthBadge from './AuthBadge.vue';

const ICON = '<svg data-testid="badge-icon"></svg>';

describe('AuthBadge', () => {
  it.each([
    ['accent', 'bg-accent-soft', 'text-accent-text'],
    ['positive', 'bg-verdict-ac-bg', 'text-verdict-ac'],
    ['warning', 'bg-verdict-tle-bg', 'text-verdict-tle'],
    ['negative', 'bg-verdict-wa-bg', 'text-verdict-wa'],
  ] as const)('paints the %s tone with its background and text pair', (tone, background, text) => {
    const badge = mountComponent(AuthBadge, { props: { tone }, slots: { default: ICON } });
    expect(badge.classes()).toEqual(expect.arrayContaining([background, text]));
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
