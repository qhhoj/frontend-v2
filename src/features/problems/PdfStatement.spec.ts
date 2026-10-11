import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import PdfStatement from './PdfStatement.vue';

const mountWith = (url: string) => mountComponent(PdfStatement, { props: { url } });

describe('PdfStatement', () => {
  it('shows a site-hosted PDF inline and links it for a new tab', () => {
    const wrapper = mountWith('/pdf/abc.pdf');
    expect(wrapper.get('iframe').attributes('src')).toBe('/pdf/abc.pdf');
    const link = wrapper.get('a');
    expect(link.attributes('href')).toBe('/pdf/abc.pdf');
    expect(link.attributes('target')).toBe('_blank');
  });

  it.each(['https://example.org/a.pdf', '//example.org/a.pdf', '/\\example.org/a.pdf'])(
    'only links a PDF hosted elsewhere (%s)',
    (url) => {
      const wrapper = mountWith(url);
      expect(wrapper.find('iframe').exists()).toBe(false);
      expect(wrapper.get('a').attributes('href')).toBe(url);
    },
  );
});
