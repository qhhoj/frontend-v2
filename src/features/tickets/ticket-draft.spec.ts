import { describe, expect, it } from 'vitest';
import { draftIssues, isHttpUrl } from './ticket-draft';

const draft = {
  kind: 'problem' as const,
  problemCode: 'hcmus41b',
  title: 'Test 17 sai',
  body: 'Chi tiết',
  issueUrl: '',
};

describe('ticket draft', () => {
  it('accepts a complete problem ticket', () => {
    expect(draftIssues(draft)).toEqual([]);
  });
  it('asks for a problem code, a title of at most 100 and a body of at most 8192 characters', () => {
    const issues = draftIssues({ ...draft, problemCode: ' ', title: 'x'.repeat(101), body: '   ' });
    expect(issues.map((issue) => issue.field)).toEqual(['problemCode', 'title', 'body']);
  });
  it('counts a title in code points, not UTF-16 units', () => {
    expect(draftIssues({ ...draft, title: '𝒳'.repeat(100) })).toEqual([]);
    expect(draftIssues({ ...draft, title: '𝒳'.repeat(101) })).toEqual([
      { field: 'title', key: 'tickets.new.titleTooLong' },
    ]);
  });
  it('needs an http(s) link without credentials for a general issue and ignores the problem code', () => {
    expect(
      draftIssues({ ...draft, kind: 'general', problemCode: '', issueUrl: 'ftp://x' }),
    ).toEqual([{ field: 'issueUrl', key: 'tickets.new.urlInvalid' }]);
    expect(isHttpUrl('https://qhhoj.vn/contests/r42')).toBe(true);
    expect(isHttpUrl('https://user:pw@qhhoj.vn')).toBe(false);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
  });
  it('refuses a general link longer than the backend allows', () => {
    expect(isHttpUrl(`https://qhhoj.vn/${'a'.repeat(200)}`)).toBe(false);
  });
});
