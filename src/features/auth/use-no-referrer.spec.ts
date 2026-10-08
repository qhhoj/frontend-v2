import { defineComponent, h } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { useNoReferrer } from './use-no-referrer';

const TokenPage = defineComponent({
  setup() {
    useNoReferrer();
    return () => h('p', 'token page');
  },
});
/** The policy a browser applies: the last referrer meta wins; none means the default. */
const effectivePolicy = () => {
  const metas = [...document.head.querySelectorAll<HTMLMetaElement>('meta[name="referrer"]')];
  return metas.at(-1)?.content ?? 'strict-origin-when-cross-origin';
};

afterEach(() =>
  document.head.querySelectorAll('meta[name="referrer"]').forEach((meta) => meta.remove()),
);

describe('useNoReferrer', () => {
  it('sends no referrer while mounted and returns to the default policy after', () => {
    const wrapper = mount(TokenPage);
    expect(effectivePolicy()).toBe('no-referrer');
    wrapper.unmount();
    expect(effectivePolicy()).toBe('strict-origin-when-cross-origin');
  });

  it('puts back the policy the page already had, and keeps its tag', () => {
    const existing = document.createElement('meta');
    existing.name = 'referrer';
    existing.content = 'same-origin';
    document.head.append(existing);
    const wrapper = mount(TokenPage);
    expect(effectivePolicy()).toBe('no-referrer');
    wrapper.unmount();
    expect(effectivePolicy()).toBe('same-origin');
    expect(document.head.contains(existing)).toBe(true);
  });
});
