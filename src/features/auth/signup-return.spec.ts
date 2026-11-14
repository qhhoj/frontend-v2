import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import {
  SIGNUP_RETURN_TTL_MS,
  rememberSignupReturn,
  signupReturnQuery,
  useReturnQuery,
} from './signup-return';

const route = reactive<{ query: Record<string, unknown> }>({ query: {} });
vi.mock('vue-router', () => ({ useRoute: () => route }));

beforeEach(() => {
  localStorage.clear();
  route.query = {};
});

describe('return path through sign-up', () => {
  it('carries a same-origin redirect on the links between the sign-in pages', () => {
    route.query = { redirect: '/problems/aplusb?tab=editorial' };
    expect(useReturnQuery().value).toEqual({ redirect: '/problems/aplusb?tab=editorial' });
  });

  it.each(['//evil.example', 'https://evil.example', '/\\evil', '/', undefined, ['/a']])(
    'drops %j instead of carrying it on',
    (value) => {
      route.query = { redirect: value };
      expect(useReturnQuery().value).toEqual({});
      rememberSignupReturn(value, 1000);
      expect(signupReturnQuery(2000)).toEqual({});
    },
  );

  it('keeps the registering path for the sign-in after activation, until it goes stale', () => {
    rememberSignupReturn('/contests/x', 1000);
    expect(signupReturnQuery(2000)).toEqual({ redirect: '/contests/x' });
    expect(signupReturnQuery(1000 + SIGNUP_RETURN_TTL_MS + 1)).toEqual({});
  });

  it('refuses a foreign URL planted in storage', () => {
    localStorage.setItem(
      'qhhoj.signup-return',
      JSON.stringify({ path: '//evil.example', at: 1000 }),
    );
    expect(signupReturnQuery(2000)).toEqual({});
  });
});
