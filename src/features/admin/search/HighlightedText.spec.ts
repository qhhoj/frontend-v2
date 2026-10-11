import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import HighlightedText from './HighlightedText.vue';

const marked = (text: string, query: string) =>
  mountComponent(HighlightedText, { props: { text, query } })
    .findAll('mark')
    .map((mark) => mark.text());

describe('HighlightedText', () => {
  it('matches decomposed (NFD) text against a composed (NFC) term, and the other way round', () => {
    const decomposed = 'Tin học Việt'.normalize('NFD');
    expect(marked(decomposed, 'việt')).toEqual(['Việt']);
    expect(marked('Tin học Việt', 'Việt'.normalize('NFD'))).toEqual(['Việt']);
  });

  it('shows markup in the text as text, never as elements', () => {
    const wrapper = mountComponent(HighlightedText, {
      props: { text: '<b>Tin</b> & việt', query: 'việt' },
    });
    expect(wrapper.find('b').exists()).toBe(false);
    expect(wrapper.text()).toContain('<b>Tin</b> & ');
    expect(wrapper.html()).toContain('&lt;b&gt;Tin&lt;/b&gt; &amp; ');
  });

  it('marks a query that is itself markup or an ampersand, as plain characters', () => {
    expect(marked('Tom & Jerry', '&')).toEqual(['&']);
    expect(marked('<b>x</b>', '<b>')).toEqual(['<b>']);
  });
});
