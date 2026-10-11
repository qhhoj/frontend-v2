import { describe, expect, it } from 'vitest';
import { keepPreviousForSameViewer } from './keep-previous-for-viewer';

const VIEWER_INDEX = 2;
const queryOf = (viewer: string) => ({ queryKey: ['contests', 'list', viewer, {}] });

describe('keepPreviousForSameViewer', () => {
  it('drops the previous data when the previous query was for a different viewer', () => {
    const keep = keepPreviousForSameViewer(VIEWER_INDEX, 'user-b');
    expect(keep('board of A', queryOf('user-a'))).toBeUndefined();
  });

  it('after sign-out drops what the account loaded but keeps a visitor page for a visitor', () => {
    const keep = keepPreviousForSameViewer(VIEWER_INDEX, 'anonymous');
    expect(keep('board of A', queryOf('user-a'))).toBeUndefined();
    expect(keep('public board', queryOf('anonymous'))).toBe('public board');
  });
});
