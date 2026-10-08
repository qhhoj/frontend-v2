import { describe, expect, it } from 'vitest';
import { keepPreviousForSameViewer } from './keep-previous-for-viewer';

const VIEWER_INDEX = 2;
const queryOf = (viewer: string) => ({ queryKey: ['contests', 'list', viewer, {}] });

describe('keepPreviousForSameViewer', () => {
  it('keeps the previous data when the previous query was for the same viewer', () => {
    const keep = keepPreviousForSameViewer(VIEWER_INDEX, 'user-a');
    expect(keep('board of A', queryOf('user-a'))).toBe('board of A');
  });

  it('drops the previous data when the previous query was for a different viewer', () => {
    const keep = keepPreviousForSameViewer(VIEWER_INDEX, 'user-b');
    expect(keep('board of A', queryOf('user-a'))).toBeUndefined();
  });

  it('after sign-out drops what the account loaded but keeps a visitor page for a visitor', () => {
    const keep = keepPreviousForSameViewer(VIEWER_INDEX, 'anonymous');
    expect(keep('board of A', queryOf('user-a'))).toBeUndefined();
    expect(keep('public board', queryOf('anonymous'))).toBe('public board');
  });

  it('drops the data when there is no previous query', () => {
    const keep = keepPreviousForSameViewer(VIEWER_INDEX, 'user-a');
    expect(keep('orphan', undefined)).toBeUndefined();
  });

  it('reads the viewer id at the index it is given', () => {
    const keep = keepPreviousForSameViewer(1, 'user-a');
    expect(keep('data', { queryKey: ['contests', 'user-a'] })).toBe('data');
    expect(keep('data', { queryKey: ['user-a', 'contests'] })).toBeUndefined();
  });
});
