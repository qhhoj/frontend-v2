import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import { AVATAR_FIXED_TILE } from './avatar-sprites';
import type { AvatarSize } from './bit-avatar';
import UserAvatar from './UserAvatar.vue';

const mountAvatar = (props: {
  username: string;
  size: AvatarSize;
  status?: 'banned' | 'deleted';
}) => mountComponent(UserAvatar, { props });

describe('UserAvatar', () => {
  it('is decorative: hidden from assistive technology', () => {
    expect(
      mountAvatar({ username: 'bitcoder', size: 24 }).get('svg').attributes('aria-hidden'),
    ).toBe('true');
  });

  it('gives banned and deleted accounts the same fixed grey Bit on the grey tile', () => {
    const banned = mountAvatar({ username: 'bitcoder', size: 96, status: 'banned' });
    const deleted = mountAvatar({ username: 'someone_else', size: 96, status: 'deleted' });
    expect(banned.html()).toBe(deleted.html());
    expect(banned.html()).not.toBe(mountAvatar({ username: 'bitcoder', size: 96 }).html());
    // jsdom writes the tile #E8E2D8 as rgb().
    expect(banned.get('svg').attributes('style')).toContain('rgb(232, 226, 216)');
    expect(AVATAR_FIXED_TILE.colour).toBe('#E8E2D8');
  });
});
