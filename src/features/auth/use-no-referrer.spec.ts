import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { useNoReferrer } from './use-no-referrer';

const TokenPage = defineComponent({
  setup() {
    useNoReferrer();
    return () => h('p', 'token page');
  },
});
const policy = () => document.head.querySelector<HTMLMetaElement>('meta[name="referrer"]')?.content;

describe('useNoReferrer', () => {
  it('sends no referrer while the page is mounted, and restores the default after', () => {
    const wrapper = mount(TokenPage);
    expect(policy()).toBe('no-referrer');
    wrapper.unmount();
    expect(policy()).toBeUndefined();
  });
});
