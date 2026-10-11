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
  it('asks a general issue for a valid link and ignores the problem code', () => {
    const general = { ...draft, kind: 'general' as const, problemCode: '' };
    expect(draftIssues({ ...general, issueUrl: 'ftp://example.com' })).toEqual([
      { field: 'issueUrl', key: 'tickets.new.urlInvalid' },
    ]);
    expect(draftIssues({ ...general, issueUrl: 'https://example.com/x' })).toEqual([]);
  });
});

describe('isHttpUrl (backend IsUrl: http or https, a TLD or an IP, no credentials)', () => {
  it.each([
    ['https://example.com/x', true],
    ['https://qhhoj.vn/contests/r42', true],
    ['  https://example.com  ', true],
    ['HTTPS://EXAMPLE.COM', true],
    ['https://sub.example.co.vn?q=1#top', true],
    ['http://127.0.0.1:8000/x', true],
    ['https://[2001:db8::1]:443/', true],
    ['http://foo', false],
    ['http://localhost', false],
    ['https://example.c', false],
    ['https://example.com.', false],
    ['http://exa_mple.com', false],
    ['http://-bad.com', false],
    ['http://.com', false],
    ['https://a b.c', false],
    ['https://example.com/<x>', false],
    ['https:/x', false],
    ['https://', false],
    ['ftp://example.com', false],
    ['example.com', false],
    ['javascript:alert(1)', false],
    ['https://user:pw@example.com', false],
    ['https://example.com:99999', false],
    ['https://example.com:443x', false],
    [`https://${'a'.repeat(200)}.com`, false],
  ])('%s is %s', (url, accepted) => {
    expect(isHttpUrl(url)).toBe(accepted);
  });
});
