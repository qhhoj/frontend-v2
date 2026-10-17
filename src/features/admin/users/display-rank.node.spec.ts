import { describe, expect, it } from 'vitest';
import { displayRankLabel, memberRoleLabel } from './display-rank';

describe('display rank labels', () => {
  it('names every legacy display rank in words', () => {
    expect(displayRankLabel('user')).toBe('Thành viên');
    expect(displayRankLabel('daor')).toBe('Đội Bedao');
    expect(displayRankLabel('teacher')).toBe('Giáo viên');
    expect(displayRankLabel('banned')).toBe('Bị cấm');
  });

  it('reads a rating tier stored as a rank with the public tier label', () => {
    expect(displayRankLabel('candidate-master')).toBe('Candidate Master');
  });

  it('keeps an unknown rank as stored', () => {
    expect(displayRankLabel('wizard')).toBe('wizard');
  });

  it('leaves the ban to the status column: a banned member reads as a member', () => {
    expect(memberRoleLabel('banned')).toBe('Thành viên');
    expect(memberRoleLabel('setter')).toBe('Người ra đề');
  });
});
