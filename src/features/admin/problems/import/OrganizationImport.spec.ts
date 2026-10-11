import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { organizationItem, profile, sessionUser, signedIn } from '@/test/fixtures';
import { polygonProblem } from '@/test/admin-fixtures/polygon';
import { problemEditingMeta } from '@/test/admin-fixtures/problems';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const LINK = 'https://polygon.codeforces.com/p3n21nw/LamTerQH/xau-doi-xung';
/** An organization admin with the organization problem right and the site-wide create right, but no import permission. */
const teacher = () =>
  sessionUser({
    isStaff: true,
    permissions: [
      'judge.create_organization_problem',
      'judge.edit_own_problem',
      'judge.add_problem',
    ],
    adminCapabilities: {
      organizations: true,
      problemCreation: { site: true, organizations: true },
      contestCreation: { site: false, organizations: false },
    },
  });
const teacherRoutes = () => ({
  'GET /auth/me': signedIn({ user: teacher() }),
  'GET /profile': ok(profile()),
  'GET /organizations': page([organizationItem()]),
  'GET /problems/meta': ok(problemEditingMeta()),
});
const buttonLabelled = (wrapper: Wrapper, label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;

describe('imports by an organization problem creator without the import permission', () => {
  it('opens the zip import with the organization as the only owner and update disabled', async () => {
    mockApi(teacherRoutes());
    const { wrapper } = await mountApp('/admin/problems/import');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="problem-code-prefix"]').exists()).toBe(true),
    );
    expect(wrapper.find('[data-testid="admin-forbidden"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="creation-owner"]').text()).toContain('THPT A');
    expect(wrapper.text()).not.toContain('Không thuộc tổ chức');
    const radios = wrapper.findAll('input[name="import-mode"]');
    expect(radios.map((radio) => (radio.element as HTMLInputElement).disabled)).toEqual([
      false,
      true,
    ]);
    expect(wrapper.text()).toContain('Cần quyền “Nhập gói Polygon”');
  });

  it('imports from Polygon into the organization without the auto-sync switch', async () => {
    const calls = mockApi({
      ...teacherRoutes(),
      'GET /polygon/status': ok({ connected: true, accountName: 'qhhoj' }),
      'POST /polygon/resolve': ok(polygonProblem()),
      'POST /polygon/import': { status: 202, body: { data: { jobId: 'job-1' } } },
      'GET /problems/imports/job-1': ok({
        id: 'job-1',
        state: 'active',
        step: 'downloading',
        progress: null,
        result: null,
        error: null,
        failedStep: null,
      }),
    });
    const { wrapper } = await mountApp('/admin/problems/polygon');
    await vi.waitFor(() => expect(wrapper.find('#polygon-link').exists()).toBe(true), {
      timeout: 5000,
    });
    await wrapper.get('#polygon-link').setValue(LINK);
    await vi.waitFor(
      () => expect(wrapper.find('[data-testid="polygon-link-preview"]').exists()).toBe(true),
      { timeout: 5000 },
    );
    await buttonLabelled(wrapper, 'Tiếp tục').trigger('click');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="problem-code-prefix"]').exists()).toBe(true),
    );
    expect(wrapper.text()).not.toContain('Tự đồng bộ khi có gói mới');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    const post = calls.find((call) => call.path === '/polygon/import');
    expect(post?.body).toMatchObject({
      organization: 'thpt-a',
      code: 'thpta_xau_doi_xung',
      mode: 'create',
      autoSync: false,
    });
  });

  it('keeps the imports closed to a site creator with neither the import permission nor an organization', async () => {
    mockApi(staffViewer(['judge.add_problem']));
    const { wrapper } = await mountApp('/admin/problems/import');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="admin-forbidden"]').exists()).toBe(true),
    );
  });
});
