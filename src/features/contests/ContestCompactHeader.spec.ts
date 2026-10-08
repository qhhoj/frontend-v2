import { describe, expect, it } from 'vitest';
import { contestItem } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ContestCompactHeader from './ContestCompactHeader.vue';

const headerFor = (overrides: Parameters<typeof contestItem>[0] = {}) =>
  mountComponent(ContestCompactHeader, { props: { contest: contestItem(overrides) } });

describe('contest compact header', () => {
  it('titles the page with the contest name', () => {
    expect(headerFor().get('h1').text()).toBe('QHH Round #42 (Div. 2)');
  });

  it('shows the phase of the contest beside the title', () => {
    const header = headerFor({ phase: 'upcoming' });
    expect(header.get('h1').element.parentElement!.textContent).toContain('Sắp diễn ra');
  });

  it('links the breadcrumb to the contest list and to the contest by its key', () => {
    const links = headerFor({ key: 'r42' }).findAll('nav a');
    expect(links.map((link) => [link.text(), link.attributes('href')])).toEqual([
      ['Kỳ thi', '/contests'],
      ['r42', '/contests/r42'],
    ]);
  });
});
