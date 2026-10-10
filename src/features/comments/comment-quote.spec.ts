import { describe, expect, it } from 'vitest';
import { comment } from '@/test/community-fixtures';
import { flattenInTimeOrder } from './comment-order';
import { QUOTE_LENGTH, quoteOf } from './comment-quote';

const pageOf = (...comments: ReturnType<typeof comment>[]) =>
  new Map(flattenInTimeOrder(comments).map((entry) => [entry.comment.id, entry]));

describe('quoteOf', () => {
  it('quotes the parent by its number, author and plain prose, linking to its anchor', () => {
    const parent = comment({
      id: 'p1',
      author: { id: 'u1', username: 'lananh.cp', rating: 1900 },
      bodyHtml: '<p>Đề bài C ghi <strong>n ≤ 10^5</strong></p><pre><code>int main(){}</code></pre>',
    });
    expect(quoteOf('p1', pageOf(parent))).toEqual({
      parentId: 'p1',
      number: 1,
      author: 'lananh.cp',
      excerpt: 'Đề bài C ghi n ≤ 10^5',
      href: '#comment-p1',
    });
  });

  it('cuts a long parent at a word with an ellipsis and drops the MathML twin of a formula', () => {
    const long = comment({
      id: 'p1',
      bodyHtml: `<p><span class="katex"><span class="katex-mathml">x</span><span class="katex-html">x²</span></span> ${'chữ '.repeat(60)}</p>`,
    });
    const { excerpt } = quoteOf('p1', pageOf(long));
    expect(excerpt.startsWith('x² chữ')).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(QUOTE_LENGTH + 1);
    expect(excerpt.endsWith('…')).toBe(true);
  });

  it('has no author when the account is gone and nothing but the link when the parent is not on the page', () => {
    expect(quoteOf('p1', pageOf(comment({ id: 'p1', author: null }))).author).toBeNull();
    expect(quoteOf('missing', pageOf(comment({ id: 'p1' })))).toEqual({
      parentId: 'missing',
      number: null,
      author: null,
      excerpt: '',
      href: '#comment-missing',
    });
  });
});
