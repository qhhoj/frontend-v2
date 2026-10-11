import { describe, expect, it } from 'vitest';
import { summaryExcerpt, summaryFirstImage } from './post-summary';

const ORIGIN = 'https://qhhoj.example';

describe('summaryExcerpt', () => {
  it('keeps the prose of paragraphs and lists and drops headings, code and images', () => {
    const html =
      '<h2>Tiêu đề lớn</h2><p>Kỳ thi <strong>bắt đầu</strong> lúc 19:30.</p><pre>int main(){}</pre><ul><li>Một</li><li>Hai</li></ul><img src="/media/a.png">';
    expect(summaryExcerpt(html)).toBe('Kỳ thi bắt đầu lúc 19:30. Một Hai');
  });
  it('never turns hostile markup into anything but text', () => {
    const html =
      '<p>an toàn</p><script>window.pwned=1</script><style>p{display:none}</style><iframe src="https://evil.test"></iframe><p onclick="x()">&lt;b&gt;không phải thẻ&lt;/b&gt;</p>';
    const text = summaryExcerpt(html);
    expect(text).toBe('an toàn <b>không phải thẻ</b>');
    expect((window as unknown as { pwned?: number }).pwned).toBeUndefined();
  });
  it('cuts long text at a word and adds an ellipsis', () => {
    const text = summaryExcerpt(`<p>${'chữ '.repeat(200)}</p>`);
    expect(text.length).toBeLessThanOrEqual(221);
    expect(text.endsWith('chữ…')).toBe(true);
  });
});

describe('summaryFirstImage', () => {
  it('returns the first image under /media or /martor, same-origin absolute URLs reduced to their path', () => {
    expect(summaryFirstImage('<p>x</p><img src="/media/a.png"><img src="/martor/b.png">')).toBe(
      '/media/a.png',
    );
    expect(summaryFirstImage(`<img src="${ORIGIN}/martor/b.png?v=2">`, ORIGIN)).toBe(
      '/martor/b.png?v=2',
    );
  });
  it('skips foreign, protocol-relative, data, javascript and other-path sources and takes the next safe one', () => {
    const html =
      '<img src="https://evil.test/media/a.png"><img src="//evil.test/media/a.png"><img src="data:image/png;base64,AAAA"><img src="javascript:alert(1)"><img src="/static/x.png"><img src="/media/ok.png">';
    expect(summaryFirstImage(html, ORIGIN)).toBe('/media/ok.png');
  });
});
