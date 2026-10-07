import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import stylesCss from '@/theme/styles.css?raw';
import { ApiError } from '@/api/client';
import { verdictOf } from '@/lib/verdicts';
import { mountComponent } from '@/test/mount';
import CountdownTimer from './CountdownTimer.vue';
import GlassCard from './GlassCard.vue';
import QueryState from './QueryState.vue';
import TokenCoin from './TokenCoin.vue';
import UserContent from './UserContent.vue';
import UserName from './UserName.vue';
import VerdictBadge from './VerdictBadge.vue';

describe('shared components', () => {
  afterEach(() => vi.useRealTimers());

  it('VerdictBadge shows the code and names the verdict for assistive tech', () => {
    const badge = mountComponent(VerdictBadge, {
      props: { verdict: verdictOf({ status: 'D', result: 'TLE' }) },
    });
    expect(badge.text()).toContain('TLE');
    expect(badge.find('.sr-only').text()).toBe('Quá thời gian');
    expect(badge.classes()).toContain('text-verdict-tle');
  });

  it('UserName links to the profile in the rating tier colour', () => {
    const rated = mountComponent(UserName, { props: { username: 'user_01', rating: 2104 } });
    expect(rated.attributes('href')).toBe('/users/user_01');
    expect(rated.classes()).toContain('text-tier-candidate-master');
    expect(
      mountComponent(UserName, { props: { username: 'x1', rating: null } }).classes(),
    ).toContain('text-tier-none');
    expect(mountComponent(UserName, { props: { username: 'x1' } }).classes()).toContain(
      'text-content',
    );
  });

  it('CountdownTimer ticks down and reports when it reaches zero, once', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    const countdown = mountComponent(CountdownTimer, { props: { until: '2026-10-08T10:00:02Z' } });
    expect(countdown.text()).toBe('00:00:02');
    await vi.advanceTimersByTimeAsync(1000);
    expect(countdown.text()).toBe('00:00:01');
    await vi.advanceTimersByTimeAsync(5000);
    expect(countdown.text()).toBe('00:00:00');
    expect(countdown.emitted('elapsed')).toHaveLength(1);
  });

  it('QueryState shows loading, then the error with a retry, then the content', async () => {
    const loading = mountComponent(QueryState, {
      props: { loading: true, error: null },
      slots: { default: '<p>content</p>' },
    });
    expect(loading.text()).toBe('Đang tải…');
    const failed = mountComponent(QueryState, {
      props: { loading: false, error: new ApiError('not_found', 404, 'x') },
      slots: { default: '<p>content</p>' },
    });
    expect(failed.text()).toContain('Không tìm thấy.');
    await failed.get('button').trigger('click');
    expect(failed.emitted('retry')).toHaveLength(1);
    const ready = mountComponent(QueryState, {
      props: { loading: false, error: null },
      slots: { default: '<p>content</p>' },
    });
    await flushPromises();
    expect(ready.text()).toBe('content');
  });

  it('GlassCard renders the requested element with its content', () => {
    const card = mountComponent(GlassCard, {
      props: { as: 'article' },
      slots: { default: 'hello' },
    });
    expect(card.element.tagName).toBe('ARTICLE');
    expect(card.text()).toBe('hello');
    expect(mountComponent(GlassCard).element.tagName).toBe('SECTION');
  });

  it('TokenCoin is decorative and picks a coin gradient from its seed', () => {
    const coin = mountComponent(TokenCoin, { props: { seed: 'aplusb', label: 'AB' } });
    expect(coin.attributes('aria-hidden')).toBe('true');
    expect(coin.text()).toBe('AB');
    expect(coin.classes().some((name) => /^coin-[1-6]$/.test(name))).toBe(true);
  });
});

describe('UserContent', () => {
  it('renders sanitized html inside the isolating container', () => {
    const content = mountComponent(UserContent, { props: { html: '<p>Xin <b>chào</b></p>' } });
    expect(content.find('p b').text()).toBe('chào');
    expect(content.classes()).toContain('user-content');
  });

  it('defines the containment rules the user-content class promises', () => {
    const css = stylesCss;
    const rule = css.slice(css.indexOf('@utility user-content'));
    for (const declaration of [
      'overflow: clip',
      'contain: paint inline-size',
      'isolation: isolate',
      'min-width: 0',
      '.katex-display',
      'overflow-x: auto',
    ]) {
      expect(rule).toContain(declaration);
    }
  });
});
