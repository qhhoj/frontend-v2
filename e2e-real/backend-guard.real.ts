import { expect, test } from '@playwright/test';
import { API, getData, signIn } from './support';

test('the backend answers with the shapes the app reads', async ({ page }) => {
  await signIn(page);
  const stats = await getData<Record<string, number>>(page, '/submissions/stats');
  for (const field of [
    'judgedToday',
    'acceptedToday',
    'queueLength',
    'judgesOnline',
    'judgesTotal',
  ])
    expect(typeof stats[field], `stats.${field}`).toBe('number');
  expect(stats.judgesOnline, 'the fake judge must be online (npm run stack:up)').toBeGreaterThan(0);
  const meta = await getData<{ languages: Array<{ key: string }> }>(page, '/problems/meta');
  expect(meta.languages.map((language) => language.key)).toContain('PY3');
  const me = await page.request.get(`${API}/auth/me`);
  expect((await me.json()).data.csrfToken).toBeTruthy();
});
