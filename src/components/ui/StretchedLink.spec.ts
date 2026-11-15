import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import StretchedLink from './StretchedLink.vue';

describe('StretchedLink', () => {
  it('is a route link with the cover class for `to`', () => {
    const link = mountComponent(StretchedLink, {
      props: { to: '/problem/a' },
      slots: { default: 'Bài A' },
    });
    expect(link.element.tagName).toBe('A');
    expect(link.attributes('href')).toBe('/problem/a');
    expect(link.classes()).toContain('stretched-link');
  });

  it('is a plain link for `href`', () => {
    const link = mountComponent(StretchedLink, {
      props: { href: 'https://example.com' },
      slots: { default: 'Ngoài' },
    });
    expect(link.attributes('href')).toBe('https://example.com');
  });
});
