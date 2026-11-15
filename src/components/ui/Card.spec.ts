import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
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

  it('draws a rule under the header, edge to edge when the card has padding', () => {
    const padded = mount(Card, { props: { title: 'Cài đặt', divided: true, padding: 'md' } });
    expect(padded.get('header').classes()).toEqual(expect.arrayContaining(['border-b', '-mx-5']));
    const plain = mount(Card, { props: { title: 'Cài đặt', divided: true } });
    expect(plain.get('header').classes()).toContain('border-b');
    expect(
      plain
        .get('header')
        .classes()
        .some((name) => name.startsWith('-mx')),
    ).toBe(false);
  });

  it('makes the whole card one link when it has `to` or `href`, titled by its title', () => {
    const card = mountComponent(Card, {
      props: { title: 'Kỳ thi A', to: '/contests/a', padding: 'md' },
      slots: { default: '<button>Đăng ký</button>' },
    });
    const link = card.get('h2 a');
    expect(link.attributes('href')).toBe('/contests/a');
    expect(link.classes()).toContain('stretched-link');
    expect(card.classes()).toContain('box-link');
    expect(card.findAll('a')).toHaveLength(1);
  });

  it('names the link of an untitled link card for screen readers, and a plain URL becomes a plain link', () => {
    const card = mountComponent(Card, {
      props: { href: 'https://example.com/x', linkLabel: 'Mở bài viết' },
    });
    const link = card.get('a.stretched-link');
    expect(link.attributes('href')).toBe('https://example.com/x');
    expect(link.text()).toBe('Mở bài viết');
  });

  it('is no link and no box-link without `to` or `href`', () => {
    const card = mount(Card, { props: { title: 'Thống kê' } });
    expect(card.find('a').exists()).toBe(false);
    expect(card.classes()).not.toContain('box-link');
  });
});
