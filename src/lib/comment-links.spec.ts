import { describe, expect, it } from 'vitest';
import { commentPageRoute } from './comment-links';

describe('commentPageRoute', () => {
  it('sends each page type to its own screen, by the natural key the backend gives', () => {
    expect(commentPageRoute({ type: 'blog', key: 'p-1', title: 'T' })).toEqual({
      name: 'post',
      params: { id: 'p-1' },
    });
    expect(commentPageRoute({ type: 'problem', key: 'aplusb', title: 'T' })).toEqual({
      name: 'problem',
      params: { code: 'aplusb' },
    });
    expect(commentPageRoute({ type: 'editorial', key: 'aplusb', title: 'T' })).toEqual({
      name: 'problem',
      params: { code: 'aplusb' },
      query: { tab: 'editorial' },
    });
    expect(commentPageRoute({ type: 'contest', key: 'r42', title: 'T' })).toEqual({
      name: 'contest',
      params: { key: 'r42' },
    });
  });
  it('gives no link for a tag problem, which has no screen', () => {
    expect(commentPageRoute({ type: 'tagProblem', key: 'x', title: 'T' })).toBeNull();
  });
});
