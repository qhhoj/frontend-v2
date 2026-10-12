import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import GlassCard from '../GlassCard.vue';
import Card from './Card.vue';

describe('Card', () => {
  it('renders only its body when it has no title, lead or actions', () => {
    const card = mount(Card, { slots: { default: 'Body' } });
    expect(card.element.tagName).toBe('SECTION');
    expect(card.find('header').exists()).toBe(false);
    expect(card.text()).toBe('Body');
  });

  it('heads the body with the title, lead and actions it is given', () => {
    const card = mount(Card, {
      props: { as: 'article', title: 'Thống kê', lead: 'Tháng này' },
      slots: { default: 'Body', actions: '<button>Xem</button>' },
    });
    expect(card.element.tagName).toBe('ARTICLE');
    expect(card.get('h2').text()).toBe('Thống kê');
    expect(card.get('header').text()).toContain('Tháng này');
    expect(card.get('header button').text()).toBe('Xem');
  });

  it('GlassCard renders the same markup as the default Card', () => {
    const options = { props: { as: 'div' }, attrs: { class: 'p-5' }, slots: { default: 'Body' } };
    expect(mount(GlassCard, options).html()).toBe(mount(Card, options).html());
  });
});
