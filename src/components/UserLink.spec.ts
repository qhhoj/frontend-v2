import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import UserLink from './UserLink.vue';

const mountLink = (props: InstanceType<typeof UserLink>['$props']) =>
  mount(UserLink, { props, global: { stubs: { RouterLink: RouterLinkStub } } });

describe('UserLink', () => {
  it('links the name to the profile and draws a decorative avatar beside it', () => {
    const wrapper = mountLink({ username: 'bit', rating: 1500 });
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({
      name: 'user',
      params: { username: 'bit' },
    });
    expect(wrapper.find('svg[aria-hidden="true"]').exists()).toBe(true);
  });

  it('omits the avatar when showAvatar is false and sizes it by name', () => {
    expect(mountLink({ username: 'bit', showAvatar: false }).find('svg').exists()).toBe(false);
    expect(mountLink({ username: 'bit', size: 'md' }).find('svg').attributes('width')).toBe('32');
  });
});
