import { describe, expect, it } from 'vitest';
import { exemptFromRocketLoader } from './exempt-rocket-loader';

describe('exemptFromRocketLoader', () => {
  it('marks inline, classic and module scripts, and nothing else', () => {
    const html =
      '<link rel="modulepreload" href="/a.js"><script>var a;</script><script type="module" crossorigin src="/x.js"></script>';
    expect(exemptFromRocketLoader(html)).toBe(
      '<link rel="modulepreload" href="/a.js"><script data-cfasync="false">var a;</script><script data-cfasync="false" type="module" crossorigin src="/x.js"></script>',
    );
  });

  it('leaves a script that already chose, and is idempotent', () => {
    const once = exemptFromRocketLoader('<script src="/x.js"></script>');
    expect(exemptFromRocketLoader(once)).toBe(once);
    expect(exemptFromRocketLoader('<script data-cfasync="true" src="/y.js"></script>')).toBe(
      '<script data-cfasync="true" src="/y.js"></script>',
    );
  });
});
