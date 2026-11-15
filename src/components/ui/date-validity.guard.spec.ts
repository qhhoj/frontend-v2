import { describe, expect, it } from 'vitest';

const SOURCES = import.meta.glob<string>('/src/**/*.{vue,ts}', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const sourceOf = (suffix: string) => {
  const hit = Object.entries(SOURCES).find(([path]) => path.endsWith(suffix));
  if (!hit) throw new Error(`no source ends with ${suffix}`);
  return hit[1];
};

/**
 * Every form that holds a `DateTimeField` must refuse to save while the field holds text that is not a date, or the text
 * is dropped silently (a link with a typo'd expiry becomes permanent). `self` is a host that provides the validity itself;
 * a path names the ancestor that does; `filter` hosts save nothing (the list keeps its last filter and the box says why).
 */
const PROVIDER: Record<string, string> = {
  'admin/short-links/ShortLinkCreateForm.vue': 'self',
  'admin/problems/editorial/ProblemEditorialTab.vue': 'self',
  'admin/integrations/IntegrationClientForm.vue': 'self',
  'admin/contests/participants/AddParticipationDialog.vue': 'self',
  'admin/contests/participants/ParticipationDialogs.vue': 'self',
  'admin/contests/lifecycle/ContestCloneDialog.vue': 'self',
  'admin/contests/ranking/RankingLinkCard.vue': 'self',
  'admin/problems/general/ProblemBasicsSection.vue': 'admin/problems/general/use-problem-form.ts',
  'admin/contests/general/ContestTimeSection.vue': 'admin/contests/general/use-contest-form.ts',
  'admin/contests/general/ContestBasicTime.vue': 'admin/contests/general/use-contest-form.ts',
  'admin/rejudge/RejudgeFilterForm.vue': 'admin/rejudge/BulkRejudgePage.vue',
  'admin/settings/ScalarSettingField.vue': 'admin/settings/SiteSettingsPage.vue',
  'blog/editor/PostSettingsCard.vue': 'blog/editor/PostEditorPage.vue',
  'admin/audit/AuditFilters.vue': 'filter',
  'admin/contests/list/ContestListFilters.vue': 'filter',
};

describe('forms with a date field', () => {
  const hosts = Object.entries(SOURCES).filter(
    ([path, text]) =>
      path.endsWith('.vue') &&
      /<(Admin)?DateTimeField\b/.test(text) &&
      !/\/(components\/ui\/DateTimeField|admin\/ui\/form\/AdminDateTimeField)\.vue$/.test(path),
  );

  it('lists every host, so a new one must say how it blocks', () => {
    const found = hosts.map(([path]) => path.replace('/src/features/', '')).sort();
    expect(found).toEqual(Object.keys(PROVIDER).sort());
  });

  it.each(Object.entries(PROVIDER).filter(([, how]) => how !== 'filter'))(
    '%s blocks its save while a date is unreadable (provider: %s)',
    (host, how) => {
      const provider = sourceOf(how === 'self' ? host : how);
      expect(provider).toContain('provideDateValidity');
      expect(provider).toContain('hasUnreadableDate');
    },
  );
});
