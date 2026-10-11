import { describe, expect, it } from 'vitest';
import { cssString, printPageCss } from './print-page-css';

describe('print page rule', () => {
  it('keeps a contest name from closing its string or the rule', () => {
    expect(cssString('A "quoted" \\ name\nnext')).toBe('"A \\"quoted\\" \\\\ name next"');
    expect(cssString('a\rb\fc')).toBe('"a b c"');
    const css = printPageCss({
      title: 'x"; } body { display: none } /*',
      subtitle: 's',
      address: 'a',
      pageWord: 'Trang',
    });
    expect(css).toContain('content: "x\\"; } body { display: none } /*"');
    expect(css).toContain('"Trang " counter(page) " / " counter(pages)');
  });
});
