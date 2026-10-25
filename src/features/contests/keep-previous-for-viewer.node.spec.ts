import { describe, expect, it } from 'vitest';
import { keepPreviousForSameViewer, keepPreviousForViewer } from './keep-previous-for-viewer';

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

describe('keepPreviousForViewer', () => {
  it('keeps the previous data only when its key carries the viewer, wherever the viewer sits', () => {
    const keep = keepPreviousForViewer('user-b');
    expect(keep('rows of A', { queryKey: ['posts', 'list', 'new', 3, 'user-a'] })).toBeUndefined();
    expect(keep('rows of B', { queryKey: ['posts', 'list', 'new', 3, 'user-b'] })).toBe(
      'rows of B',
    );
    expect(keep('rows', undefined)).toBeUndefined();
  });
});
