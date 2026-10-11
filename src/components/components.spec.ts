import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import stylesCss from '@/theme/styles.css?raw';
import { ApiError } from '@/api/client';
import { mountComponent } from '@/test/mount';
import CopyButton from './CopyButton.vue';
import CountdownTimer from './CountdownTimer.vue';
import QueryState from './QueryState.vue';
import UserContent from './UserContent.vue';

const stubClipboard = (writeText: ((text: string) => Promise<void>) | undefined) =>
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText === undefined ? undefined : { writeText },
    configurable: true,
  });

describe('shared components', () => {
  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('CopyButton copies its text, says "copied" for two seconds, then clears it', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const copy = mountComponent(CopyButton, {
      props: { text: '0 5 7 8', label: 'Sao chép ví dụ' },
    });
    await copy.get('button').trigger('click');
    await vi.advanceTimersByTimeAsync(0);
    expect(writeText).toHaveBeenCalledWith('0 5 7 8');
    expect(copy.get('[aria-live="polite"]').text()).toBe('Đã chép');
    await vi.advanceTimersByTimeAsync(2000);
    expect(copy.get('[aria-live="polite"]').text()).toBe('');
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
    expect(failed.get('[role="alert"] [data-testid="bit"]').attributes('aria-hidden')).toBe('true');
    await failed.get('button').trigger('click');
    expect(failed.emitted('retry')).toHaveLength(1);
    const ready = mountComponent(QueryState, {
      props: { loading: false, error: null },
      slots: { default: '<p>content</p>' },
    });
    await flushPromises();
    expect(ready.text()).toBe('content');
    expect(ready.find('[data-testid="bit"]').exists()).toBe(false);
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
});

describe('UserContent highlighting', () => {
  const block = (language: string, code: string) =>
    `<pre><code class="language-${language}">${code}</code></pre>`;

  it('re-colours after the html changes, with no stale spans and the exact text', async () => {
    const content = mountComponent(UserContent, { props: { html: block('cpp', 'return 1;') } });
    await vi.waitFor(() => expect(content.find('.syn-keyword').exists()).toBe(true));
    await content.setProps({ html: block('py', 'x = 2') } as never);
    expect(content.find('code').text()).toBe('x = 2');
    await vi.waitFor(() => expect(content.find('.syn-number').text()).toBe('2'));
    await content.setProps({ html: '<pre><code>return 1;</code></pre>' } as never);
    expect(content.find('span').exists()).toBe(false);
    expect(content.find('code').text()).toBe('return 1;');
  });
});
