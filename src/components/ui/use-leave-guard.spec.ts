import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { RouterView, createMemoryHistory, createRouter } from 'vue-router';
import { useLeaveGuard } from './use-leave-guard';

const isDirty = ref(false);
let guard: ReturnType<typeof useLeaveGuard>;
const FormPage = defineComponent({
  setup() {
    guard = useLeaveGuard(isDirty);
    return () => h('form');
  },
});

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/form', component: FormPage },
      { path: '/other', component: { render: () => h('p') } },
    ],
  });
  await router.push(path);
  mount(RouterView, { global: { plugins: [router] } });
  await flushPromises();
  return router;
}

describe('useLeaveGuard', () => {
  it('lets a clean form leave at once', async () => {
    isDirty.value = false;
    const router = await mountAt('/form');
    await router.push('/other');
    expect(router.currentRoute.value.path).toBe('/other');
  });

  it('holds a dirty form, asks, and stays on Stay', async () => {
    isDirty.value = true;
    const router = await mountAt('/form');
    await router.push('/other');
    expect(router.currentRoute.value.path).toBe('/form');
    expect(guard.isLeaveOpen.value).toBe(true);
    guard.stay();
    expect(guard.isLeaveOpen.value).toBe(false);
    expect(router.currentRoute.value.path).toBe('/form');
  });

  it('repeats the held navigation once on Leave', async () => {
    isDirty.value = true;
    const router = await mountAt('/form');
    await router.push('/other?x=1');
    guard.leaveAnyway();
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/other?x=1');
  });

  it('asks the browser before a reload only while dirty', async () => {
    isDirty.value = true;
    await mountAt('/form');
    const dirtyEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
    isDirty.value = false;
    const cleanEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);
  });
});

describe('useLeaveGuard with two dirty forms on one route', () => {
  const dirty = [ref(true), ref(true)];
  const guards: ReturnType<typeof useLeaveGuard>[] = [];
  const Form = (index: number) =>
    defineComponent({
      setup() {
        guards[index] = useLeaveGuard(dirty[index]!);
        return () => h('form');
      },
    });
  const TwoForms = defineComponent({ render: () => [h(Form(0)), h(Form(1))] });

  async function mountTwoForms() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/form', component: TwoForms },
        { path: '/other', component: { render: () => h('p') } },
      ],
    });
    await router.push('/form');
    mount(RouterView, { global: { plugins: [router] } });
    await flushPromises();
    return router;
  }

  it('leaves after one answer, whichever form asked', async () => {
    dirty.forEach((flag) => (flag.value = true));
    const router = await mountTwoForms();
    await router.push('/other');
    guards[0]!.leaveAnyway();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/other');
  });

  it('asks again on the next attempt after the approved move was cancelled', async () => {
    dirty.forEach((flag) => (flag.value = true));
    const router = await mountTwoForms();
    let blockOnce = true;
    router.beforeEach(() => !blockOnce || ((blockOnce = false), false));
    await router.push('/other');
    guards[0]!.leaveAnyway();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/form');
    await router.push('/other');
    expect(router.currentRoute.value.path).toBe('/form');
    expect(guards[0]!.isLeaveOpen.value).toBe(true);
  });
});
