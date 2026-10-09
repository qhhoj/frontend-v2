import { expect, test } from '@playwright/test';
import {
  gate,
  PYTHON_SUM,
  signIn,
  submitSource,
  VERDICT_LABELS,
  waitForEmptyQueue,
} from './support';

test('a submission moves processing, grading, accepted on screen without a reload', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const stages = [gate('ack'), gate('begin'), gate('end')];
  try {
    await signIn(page);
    await waitForEmptyQueue(page);
    stages.forEach((stage) => stage.hold());
    const streams: string[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/events')) streams.push(response.url());
    });
    await submitSource(page, 'e2e_sum', PYTHON_SUM);
    const summary = page.getByTestId('submission-summary');
    const navigations: string[] = [];
    page.on('framenavigated', (frame) => navigations.push(frame.url()));

    // The bridge claims the submission as soon as it dispatches it, so it is processing while the ack is held.
    await expect(summary).toContainText(VERDICT_LABELS.P);
    stages[0].release();
    await expect(summary).toContainText(VERDICT_LABELS.P);
    stages[1].release();
    await expect(summary).toContainText(VERDICT_LABELS.G);
    stages[2].release();
    await expect(summary).toContainText(VERDICT_LABELS.AC);

    expect(streams.length, 'the page must have opened the server event stream').toBeGreaterThan(0);
    expect(navigations, 'the status must change without any navigation').toEqual([]);
  } finally {
    stages.forEach((stage) => stage.release());
  }
});
