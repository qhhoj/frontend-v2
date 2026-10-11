import { describe, expect, it } from 'vitest';
import { freezeStateOf, rescoresOn } from './contest-admin';

const END = '2026-10-11T12:00:00.000Z';
const at = (iso: string) => Date.parse(iso);

describe('freezeStateOf', () => {
  const icpc = (frozenLastMinutes: number) => ({
    formatName: 'icpc' as const,
    endTime: END,
    frozenLastMinutes,
  });

  it('is scheduled before the window and frozen from its first minute, also after the end', () => {
    expect(freezeStateOf(icpc(60), at('2026-10-11T10:59:59.000Z')).kind).toBe('scheduled');
    expect(freezeStateOf(icpc(60), at('2026-10-11T11:00:00.000Z')).kind).toBe('frozen');
    expect(freezeStateOf(icpc(60), at('2026-10-12T00:00:00.000Z')).kind).toBe('frozen');
  });

  it('is off with no window, and unsupported in a format that never freezes', () => {
    expect(freezeStateOf(icpc(0), at(END)).kind).toBe('off');
    expect(freezeStateOf({ ...icpc(60), formatName: 'ioi' }, at(END)).kind).toBe('unsupported');
  });
});

describe('rescoresOn', () => {
  it('names the patches that make the backend rescore every participation', () => {
    expect(rescoresOn({ frozenLastMinutes: 0 })).toBe(true);
    expect(rescoresOn({ endTime: END })).toBe(true);
    expect(rescoresOn({ name: 'Renamed', isVisible: true })).toBe(false);
  });
});
