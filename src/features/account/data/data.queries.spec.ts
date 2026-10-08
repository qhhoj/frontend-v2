import { defineComponent, h } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { dataExportStatus, sessionUser } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { useDataExportQuery } from './data.queries';

const EXPORT_PATH = '/profile/data';

function mountQuery() {
  let query!: ReturnType<typeof useDataExportQuery>;
  mountComponent(
    defineComponent({
      setup() {
        query = useDataExportQuery();
        return () => h('div');
      },
    }),
  );
  return () => query;
}

const exportCalls = (calls: ApiCall[]) => calls.filter((call) => call.path === EXPORT_PATH);

describe('useDataExportQuery', () => {
  it('reads the status of the signed-in account', async () => {
    const status = dataExportStatus({ canPrepare: false, preparedAt: new Date().toISOString() });
    const calls = mockApi({ 'GET /profile/data': ok(status) });
    const current = mountQuery();
    useSessionStore().$patch({ status: 'authenticated', user: sessionUser() });
    await flushPromises();
    expect(current().data.value).toEqual(status);
    expect(exportCalls(calls)).toHaveLength(1);
  });

  it('sends no request while viewing as another user', async () => {
    const calls = mockApi({ 'GET /profile/data': ok(dataExportStatus()) });
    const current = mountQuery();
    useSessionStore().$patch({
      status: 'authenticated',
      user: sessionUser(),
      impersonatorId: 'staff-1',
    });
    await flushPromises();
    expect(current().fetchStatus.value).toBe('idle');
    expect(exportCalls(calls)).toHaveLength(0);
  });
});
