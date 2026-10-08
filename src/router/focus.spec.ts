import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { signedOut } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { createAppRouter } from './index';

describe('focus on navigation', () => {
  let main: HTMLElement;
  let control: HTMLButtonElement;
  beforeEach(() => {
    setActivePinia(createPinia());
    mockApi({ 'GET /auth/me': signedOut, 'GET /problems/meta': ok({}) });
    main = document.body.appendChild(document.createElement('main'));
    main.id = 'main';
    main.tabIndex = -1;
    control = main.appendChild(document.createElement('button'));
  });
  afterEach(() => main.remove());

  it('moves to the page area on another path, but not on the first load', async () => {
    const router = createAppRouter(createMemoryHistory());
    control.focus();
    await router.push('/problems');
    expect(document.activeElement).toBe(control);
    await router.push('/');
    expect(document.activeElement).toBe(main);
  });

  it('leaves focus alone when only the query changes', async () => {
    const router = createAppRouter(createMemoryHistory());
    await router.push('/problems');
    control.focus();
    await router.push('/problems?tab=editorial');
    expect(document.activeElement).toBe(control);
  });
});
