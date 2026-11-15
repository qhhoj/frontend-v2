import { describe, expect, it } from 'vitest';
import { contestStateOf } from './contest-state';

describe('contestStateOf', () => {
  it('calls a hidden contest that has not started a draft', () => {
    expect(contestStateOf({ phase: 'upcoming', isVisible: false })).toBe('draft');
    expect(contestStateOf({ phase: 'upcoming', isVisible: true })).toBe('upcoming');
    expect(contestStateOf({ phase: 'upcoming' })).toBe('upcoming');
  });

  it('keeps the phase of a hidden contest that already started', () => {
    expect(contestStateOf({ phase: 'running', isVisible: false })).toBe('running');
    expect(contestStateOf({ phase: 'ended', isVisible: false })).toBe('ended');
  });

  it('shows frozen only once the contest started', () => {
    expect(contestStateOf({ phase: 'running', isFrozen: true })).toBe('frozen');
    expect(contestStateOf({ phase: 'ended', isFrozen: true })).toBe('frozen');
    expect(contestStateOf({ phase: 'upcoming', isFrozen: true })).toBe('upcoming');
  });
});
