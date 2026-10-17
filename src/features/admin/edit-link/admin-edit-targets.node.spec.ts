import { describe, expect, it } from 'vitest';
import {
  contestEditTarget,
  organizationEditTarget,
  problemEditTarget,
  userEditTarget,
} from './admin-edit-targets';

const viewer = (permissions: string[], username = 'staff') => ({
  isSuperuser: false,
  permissions,
  username,
});

describe('admin edit targets', () => {
  it('needs the object flag and the screen permission for a problem', () => {
    const editor = viewer(['judge.edit_own_problem']);
    expect(problemEditTarget(editor, { code: 'a', canEdit: true })).toMatchObject({
      params: { code: 'a' },
    });
    expect(problemEditTarget(editor, { code: 'a', canEdit: false })).toBeNull();
    expect(problemEditTarget(viewer([]), { code: 'a', canEdit: true })).toBeNull();
    expect(problemEditTarget(null, { code: 'a', canEdit: true })).toBeNull();
  });

  it('hides the contest link from a viewer who cannot edit it', () => {
    const editor = viewer(['judge.edit_own_contest']);
    expect(contestEditTarget(editor, { key: 'k', viewer: { canEdit: true } })).not.toBeNull();
    expect(contestEditTarget(editor, { key: 'k', viewer: { canEdit: false } })).toBeNull();
  });

  it('opens the editor tab matching the public contest page', () => {
    const editor = viewer(['judge.edit_own_contest']);
    const contest = { key: 'k', viewer: { canEdit: true } };
    expect(contestEditTarget(editor, contest, 'contest-announcements')).toMatchObject({
      name: 'admin-contestAnnouncements',
      params: { key: 'k' },
    });
    expect(contestEditTarget(editor, contest, 'contest-ranking')).toMatchObject({
      name: 'admin-contestRanking',
    });
    expect(contestEditTarget(editor, contest, 'contest-stats')).toMatchObject({
      name: 'admin-contestGeneral',
    });
    expect(contestEditTarget(editor, contest)).toMatchObject({ name: 'admin-contestGeneral' });
  });

  it('links an organization only for site staff, not for its own admins', () => {
    const org = { slug: 's', viewer: { canAdminister: true } };
    expect(organizationEditTarget(viewer(['judge.edit_all_organization']), org)).toMatchObject({
      query: { org: 's' },
    });
    expect(organizationEditTarget(viewer([]), org)).toBeNull();
    expect(
      organizationEditTarget(viewer(['judge.edit_all_organization']), { slug: 's', viewer: null }),
    ).toBeNull();
  });

  it('links a user panel for moderators, never on their own profile', () => {
    const moderator = viewer(['judge.ban_user'], 'mod');
    expect(userEditTarget(moderator, 'someone')).toMatchObject({ query: { user: 'someone' } });
    expect(userEditTarget(moderator, 'mod')).toBeNull();
    expect(userEditTarget(viewer([]), 'someone')).toBeNull();
  });
});
