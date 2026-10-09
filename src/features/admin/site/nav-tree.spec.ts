import { describe, expect, it } from 'vitest';
import { navItem, siteData } from '@/test/admin-fixtures/site';
import { descendantsOf, isSafePath, navRows, parentChoices, regexProblem } from './nav-tree';

const items = siteData().navigation;

describe('nav tree', () => {
  it('puts parents first by order, children indented right under them', () => {
    expect(navRows(items).map((row) => `${'-'.repeat(row.depth)}${row.item.key}`)).toEqual([
      'home',
      'problems',
      'contests',
      '-c-virt',
      'ranking',
      'blog',
      '-b-org',
      '-b-old',
      'help',
    ]);
  });

  it('shows an orphan and a cycle at the top level instead of losing them', () => {
    const odd = [
      navItem({ id: 'a', key: 'a', parentId: 'b', order: 1 }),
      navItem({ id: 'b', key: 'b', parentId: 'a', order: 2 }),
      navItem({ id: 'c', key: 'c', parentId: 'gone', order: 3 }),
    ];
    expect(navRows(odd).map((row) => [row.item.key, row.depth])).toEqual([
      ['a', 0],
      ['b', 0],
      ['c', 0],
    ]);
  });

  it('never offers an item or its descendants as its own parent', () => {
    const blogId = items.find((item) => item.key === 'blog')!.id;
    const choices = parentChoices(items, blogId).map((item) => item.key);
    expect(choices).not.toContain('blog');
    expect(choices).not.toContain('b-org');
    expect(choices).toContain('home');
    expect(descendantsOf(items, blogId).size).toBe(2);
  });

  it('reports a regex that does not compile and accepts an empty one', () => {
    expect(regexProblem('(unclosed')).toMatch(/Unterminated group|unterminated/i);
    expect(regexProblem('')).toBeNull();
    expect(regexProblem('^/blog')).toBeNull();
  });

  it('accepts site paths and http(s) URLs only', () => {
    expect(['/problems', 'https://help.qhhoj.vn'].every(isSafePath)).toBe(true);
    expect(['javascript:alert(1)', '//evil.example', 'problems'].some(isSafePath)).toBe(false);
    expect(['/\\evil', '/a b'].some(isSafePath)).toBe(false);
  });
});
