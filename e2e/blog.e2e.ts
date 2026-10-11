import type { VoteScore } from '../src/api/types/votes';
import { postItem } from '../src/test/community-fixtures';
import { expect, list, test } from './fixtures/api';
import { ok } from './fixtures/reply';

const POST_SCORE = 58;

test('a signed-in reader votes up, then a second press takes the vote back', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  let vote: { score: number; viewerVote: VoteScore } = { score: POST_SCORE, viewerVote: 0 };
  api.routes['GET /posts'] = () => list([postItem({ ...vote })]);
  api.routes['PUT /posts/:id/vote'] = ({ body }) => {
    const { score } = body as { score: VoteScore };
    vote = { score: POST_SCORE + score, viewerVote: score };
    return ok(vote);
  };
  await page.goto('/blog');
  const up = page.getByRole('button', { name: 'Bình chọn lên' }).first();
  await up.click();
  await expect(page.getByTestId('vote-score').first()).toHaveText(String(POST_SCORE + 1));
  await expect(up).toHaveAttribute('aria-pressed', 'true');
  await up.click();
  await expect(page.getByTestId('vote-score').first()).toHaveText(String(POST_SCORE));
  await expect(up).toHaveAttribute('aria-pressed', 'false');
});
