import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import PdfStatement from './PdfStatement.vue';

const mountWith = (url: string) => mountComponent(PdfStatement, { props: { url } });

describe('PdfStatement', () => {
  it.each(['https://example.org/a.pdf', '//example.org/a.pdf', '/\\example.org/a.pdf'])(
    'only links a PDF hosted elsewhere (%s)',
    (url) => {
      const wrapper = mountWith(url);
      expect(wrapper.find('iframe').exists()).toBe(false);
      expect(wrapper.get('a').attributes('href')).toBe(url);
    },
  );
});
