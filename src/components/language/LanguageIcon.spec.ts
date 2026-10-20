import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LanguageIcon from './LanguageIcon.vue';
import LanguageLabel from './LanguageLabel.vue';

describe('LanguageIcon', () => {
  it('is hidden from screen readers when the name is shown beside it', () => {
    const label = mount(LanguageLabel, { props: { language: { key: 'PY3', name: 'Python 3' } } });
    const icon = label.get('[data-testid="language-icon"]');
    expect(icon.attributes('aria-hidden')).toBe('true');
    expect(icon.attributes('role')).toBeUndefined();
    expect(label.text()).toBe('Python 3');
  });

  it('names itself when it stands alone', () => {
    const icon = mount(LanguageIcon, { props: { languageKey: 'RUST', label: 'Rust' } });
    expect(icon.attributes('role')).toBe('img');
    expect(icon.attributes('aria-label')).toBe('Rust');
    expect(icon.attributes('title')).toBe('Rust');
    expect(icon.attributes('aria-hidden')).toBeUndefined();
  });

  it('masks the logo file so it takes the text colour', () => {
    const icon = mount(LanguageIcon, { props: { languageKey: 'CPP20' } });
    expect(icon.get('.language-mask').attributes('style')).toContain('cpp.svg');
    expect(icon.get('.language-mask').classes()).toContain('bg-current');
  });

  it('draws the glyph in the tile for a language without a logo', () => {
    const icon = mount(LanguageIcon, { props: { languageKey: 'PAS', size: 'md' } });
    expect(icon.find('.language-mask').exists()).toBe(false);
    expect(icon.text()).toBe('Pas');
  });
});
