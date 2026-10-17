import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import {
  organizationItem,
  signedOut,
  languageItem,
  problemMeta,
  CPP17_ID,
  PY3_ID,
} from '@/test/fixtures';
import { fail, mockApi, page } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { registerRoutes } from '@/test/auth-routes';
import { mountComponent } from '@/test/mount';
import { openSelect, optionTexts, typeFilter } from '@/test/select';
import { chosenIds, defaultLanguageId } from './signup-choices';
import SignupChoices from './SignupChoices.vue';

const SCHOOL = '[data-testid="school-picker"]';

/** `mountComponent` installs the router, whose first navigation asks `/auth/me`. */
const mockRegisterApi = (overrides: Record<string, MockHandler> = {}) =>
  mockApi({ 'GET /auth/me': signedOut, ...registerRoutes, ...overrides });

/** Mounts the pickers and feeds their `update:` events back as props, the way a parent page does; waits for both lists. */
async function mountLoaded(props: Record<string, unknown> = {}) {
  // `mountComponent` types its props loosely; a variable of this type passes where an object literal would not.
  const setProps = (changed: Record<string, unknown>) => wrapper.setProps(changed);
  const wrapper = mountComponent(SignupChoices, {
    props: {
      organizationId: '',
      'onUpdate:organizationId': (value: string) => setProps({ organizationId: value }),
      'onUpdate:languageId': (value: string) => setProps({ languageId: value }),
      ...props,
    },
  });
  await flushPromises();
  return wrapper;
}

describe('SignupChoices', () => {
  it('offers the open schools in a searchable list, and no language picker (P-13)', async () => {
    mockRegisterApi({
      'GET /organizations': page([
        organizationItem({ id: 'org-a', name: 'THPT A' }),
        organizationItem({ id: 'org-b', name: 'THPT B' }),
        organizationItem({ id: 'org-closed', name: 'Đóng', isOpen: false }),
      ]),
    });
    const wrapper = await mountLoaded();
    await openSelect(wrapper, SCHOOL);
    expect(optionTexts()).toEqual(['THPT A', 'THPT B']);
    await typeFilter('B');
    expect(optionTexts()).toEqual(['THPT B']);
    expect(wrapper.find('select[name="languageId"]').exists()).toBe(false);
  });

  it('sets the language to C++17 once the list has loaded', async () => {
    mockRegisterApi();
    const wrapper = await mountLoaded();
    expect(wrapper.emitted('update:languageId')).toEqual([[CPP17_ID]]);
  });

  it('leaves a language the parent already holds', async () => {
    mockRegisterApi();
    const wrapper = await mountLoaded({ languageId: PY3_ID });
    expect(wrapper.emitted('update:languageId')).toBeUndefined();
  });

  it('offers a retry when the school list fails', async () => {
    let attempts = 0;
    mockRegisterApi({
      'GET /organizations': () => {
        attempts += 1;
        // A 4xx is final; a 5xx would be retried once after a second and the test would wait for it.
        return attempts === 1 ? fail(404, 'not_found') : page([organizationItem()]);
      },
    });
    const wrapper = await mountLoaded();
    expect(wrapper.find(SCHOOL).exists()).toBe(false);
    await wrapper.get('[role="alert"] button').trigger('click');
    await flushPromises();
    expect(wrapper.find(SCHOOL).exists()).toBe(true);
  });
});

describe('chosenIds', () => {
  it('leaves out what was not chosen, so the body carries only real values', () => {
    expect(chosenIds({ organizationId: '', languageId: '' })).toEqual({});
    expect(chosenIds({ organizationId: 'org-a', languageId: '' })).toEqual({
      organizationId: 'org-a',
    });
    expect(chosenIds({ organizationId: '', languageId: 'lang-1' })).toEqual({
      languageId: 'lang-1',
    });
    expect(chosenIds({ organizationId: 'org-a', languageId: 'lang-1' })).toEqual({
      organizationId: 'org-a',
      languageId: 'lang-1',
    });
  });
});

describe('defaultLanguageId', () => {
  it('starts at the language whose key is CPP17', () => {
    expect(defaultLanguageId(problemMeta().languages)).toBe(CPP17_ID);
  });

  it('starts at "not chosen" when no language has the key CPP17', () => {
    expect(defaultLanguageId([languageItem(PY3_ID, 'PY3', 'Python 3')])).toBe('');
  });
});
