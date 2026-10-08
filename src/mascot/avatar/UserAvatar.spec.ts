import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import { AVATAR_FIXED_TILE } from './avatar-sprites';
import type { AvatarSize } from './bit-avatar';
import UserAvatar from './UserAvatar.vue';

const SIZES: AvatarSize[] = [24, 28, 32, 96, 128];

const mountAvatar = (props: {
  username: string;
  size: AvatarSize;
  status?: 'banned' | 'deleted';
}) => mountComponent(UserAvatar, { props });

describe('UserAvatar', () => {
  it('renders at exactly the size it is given, at every size the product uses', () => {
    for (const size of SIZES) {
      const svg = mountAvatar({ username: 'minhthu', size }).get('svg');
      expect(svg.attributes('width')).toBe(String(size));
      expect(svg.attributes('height')).toBe(String(size));
      expect(svg.attributes('viewBox')).toBe(`0 0 ${size} ${size}`);
    }
  });

  it('is decorative: hidden from assistive technology', () => {
    expect(
      mountAvatar({ username: 'minhthu', size: 24 }).get('svg').attributes('aria-hidden'),
    ).toBe('true');
  });

  it('draws the same Bit for the same name, whatever its case', () => {
    const lower = mountAvatar({ username: 'tuan_k', size: 32 }).html();
    const upper = mountAvatar({ username: 'Tuan_K', size: 32 }).html();
    expect(upper).toBe(lower);
  });

  it('draws different Bits for hoangnam_10a and hoangnam_10q', () => {
    const tenA = mountAvatar({ username: 'hoangnam_10a', size: 96 }).html();
    const tenQ = mountAvatar({ username: 'hoangnam_10q', size: 96 }).html();
    expect(tenA).not.toBe(tenQ);
  });

  it('gives banned and deleted accounts the same fixed grey Bit on the grey tile', () => {
    const banned = mountAvatar({ username: 'minhthu', size: 96, status: 'banned' });
    const deleted = mountAvatar({ username: 'someone_else', size: 96, status: 'deleted' });
    expect(banned.html()).toBe(deleted.html());
    expect(banned.html()).not.toBe(mountAvatar({ username: 'minhthu', size: 96 }).html());
    // jsdom writes the tile #E8E2D8 as rgb().
    expect(banned.get('svg').attributes('style')).toContain('rgb(232, 226, 216)');
    expect(AVATAR_FIXED_TILE.colour).toBe('#E8E2D8');
  });

  it('rounds the tile corners to 22 % of the size', () => {
    expect(mountAvatar({ username: 'minhthu', size: 96 }).get('svg').attributes('style')).toContain(
      'border-radius: 21px',
    );
    expect(mountAvatar({ username: 'minhthu', size: 24 }).get('svg').attributes('style')).toContain(
      'border-radius: 5px',
    );
  });

  it('draws pixels as crisp rectangles, not anti-aliased', () => {
    const svg = mountAvatar({ username: 'minhthu', size: 128 }).get('svg');
    expect(svg.attributes('shape-rendering')).toBe('crispEdges');
    expect(svg.attributes('style')).toContain('image-rendering: pixelated');
    expect(svg.findAll('rect').length).toBeGreaterThan(20);
  });
});
