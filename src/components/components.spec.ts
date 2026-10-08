import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import stylesCss from '@/theme/styles.css?raw';
import { ApiError } from '@/api/client';
import { verdictOf } from '@/lib/verdicts';
import { mountComponent } from '@/test/mount';
import CountdownTimer from './CountdownTimer.vue';
import GlassCard from './GlassCard.vue';
import QueryState from './QueryState.vue';
import SkeletonBlock from './SkeletonBlock.vue';
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
    expect(loading.text()).toBe('');
    expect(loading.find('[data-skeleton]').exists()).toBe(true); // the default skeleton
    expect(loading.get('[data-testid="query-skeleton"]').attributes('aria-hidden')).toBe('true');
    expect(loading.find('[role="status"]').exists()).toBe(false); // the shell announces, not each card
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

  it('QueryState renders the caller skeleton while loading and the content once ready, with no blocks left', async () => {
    const slots = {
      skeleton: '<span data-testid="mine">shaped like the card</span>',
      default: '<p>content</p>',
    };
    const loading = mountComponent(QueryState, { props: { loading: true, error: null }, slots });
    expect(loading.find('[data-testid="mine"]').exists()).toBe(true);
    expect(loading.find('p').exists()).toBe(false);
    const ready = mountComponent(QueryState, { props: { loading: false, error: null }, slots });
    await flushPromises();
    expect(ready.find('[data-testid="mine"]').exists()).toBe(false);
    expect(ready.find('[data-skeleton]').exists()).toBe(false);
    expect(ready.text()).toBe('content');
  });

  it('QueryState shows the error and its retry instead of the skeleton', () => {
    const failed = mountComponent(QueryState, {
      props: { loading: false, error: new ApiError('not_found', 404, 'x') },
      slots: { skeleton: '<span data-testid="mine" />' },
    });
    expect(failed.find('[data-testid="mine"]').exists()).toBe(false);
    expect(failed.get('[role="alert"]').text()).toContain('Không tìm thấy.');
  });

  it('SkeletonBlock is hidden from assistive tech and a text block is as tall as its font', () => {
    const block = mountComponent(SkeletonBlock, { props: { text: true } });
    expect(block.attributes('aria-hidden')).toBe('true');
    expect(block.classes()).toContain('h-[1em]');
    expect(block.classes()).toContain('skeleton-pulse');
    expect(block.classes()).toContain('bg-skeleton');
    expect(mountComponent(SkeletonBlock, { props: { round: true } }).classes()).toContain(
      'rounded-full',
    );
    const pill = mountComponent(SkeletonBlock, { props: { pill: true } }).classes();
    expect(pill).toContain('rounded-pill');
    expect(pill).not.toContain('rounded-skeleton');
  });

  it('turns the skeleton, Bit sob and Bit tear animations off under reduced motion', () => {
    for (const utility of ['skeleton-pulse', 'bit-sob', 'bit-tear']) {
      const start = stylesCss.indexOf(`@utility ${utility} {`);
      expect(start, utility).toBeGreaterThanOrEqual(0);
      const body = stylesCss.slice(start, stylesCss.indexOf('@utility', start + 1));
      expect(body, utility).toMatch(
        /@media \(prefers-reduced-motion: reduce\)\s*\{\s*animation: none;/,
      );
    }
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
      '& pre',
      '& table',
      'width: 100%',
      'overflow-x: auto',
    ]) {
      expect(rule).toContain(declaration);
    }
  });
});
