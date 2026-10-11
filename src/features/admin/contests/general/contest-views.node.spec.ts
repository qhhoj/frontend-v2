import { describe, expect, it } from 'vitest';
import { emptyContestForm } from '../contest-form';
import { chooseFormat } from '../format-config';
import { contestAdvancedCount } from './contest-views';

describe('contest Advanced badge', () => {
  it('is 0 for a new contest, whatever is typed in the Basic view', () => {
    const form = { ...emptyContestForm(), key: 'w42', name: 'W42', isVisible: true };
    expect(contestAdvancedCount(form, emptyContestForm())).toBe(0);
  });

  it("takes a chosen format's own config as its default", () => {
    const form = emptyContestForm();
    chooseFormat(form, 'icpc');
    expect(contestAdvancedCount(form, form)).toBe(0);
    form.formatConfig.penalty = 10;
    expect(contestAdvancedCount(form, form)).toBe(1);
  });

  it('counts saved off-default settings and ignores what the server sets', () => {
    const saved = {
      ...emptyContestForm(),
      frozenLastMinutes: 30,
      rules: 'Không dùng tài liệu.',
      authors: [{ id: 'u1', username: 'co_lan' }],
      isOrganizationPrivate: true,
    };
    expect(contestAdvancedCount(saved, saved)).toBe(2);
  });
});
