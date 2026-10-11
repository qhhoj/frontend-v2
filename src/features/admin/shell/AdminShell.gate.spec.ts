import { describe, expect, it, vi } from 'vitest';
import type * as AdminRoutes from '@/features/admin/admin-routes';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';

/** The similarity screen becomes a probe that asks for data on mount, so the gate is tested by what it would fetch. */
vi.mock('@/features/admin/admin-routes', async (importOriginal) => {
  const { defineComponent, h } = await import('vue');
  const { apiRequest } = await import('@/api/client');
  const original = await importOriginal<typeof AdminRoutes>();
  const ProbeScreen = defineComponent({
    setup() {
      void apiRequest('/probe');
      return () => h('p', { 'data-testid': 'probe' }, 'probe');
    },
  });
  return {
    ...original,
    adminRoutes: original.adminRoutes.map((route) =>
      route.name === 'admin-similarity' ? { ...route, component: ProbeScreen } : route,
    ),
  };
});

describe('AdminShell gate', () => {
  it('never mounts a screen, nor asks for its data, without the permission', async () => {
    const calls = mockApi({ ...staffViewer(['judge.add_problem']), 'GET /probe': ok({}) });
    const { wrapper } = await mountApp('/admin/similarity');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="admin-forbidden"]').exists()).toBe(true),
    );
    expect(wrapper.find('[data-testid="probe"]').exists()).toBe(false);
    expect(calls.map((call) => call.path)).not.toContain('/probe');
  });
});
