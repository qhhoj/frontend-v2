import { describe, expect, it } from 'vitest';
import { SETTING_KINDS } from './setting-blocks';
import { diffLines, hasSealedPart, isRestorable } from './revisions';

const revision = (before: unknown, after: unknown, changedFields: string[]) => ({
  id: 'r',
  before,
  after,
  changedFields,
  actor: 'a',
  createdAt: '2026-10-08T03:41:00.000Z',
});

describe('setting revisions', () => {
  it('shows a scalar change as before and after of "value"', () => {
    expect(diffLines(revision(30000, 45000, ['value']))).toEqual([
      { field: 'value', before: '30000', after: '45000' },
    ]);
  });

  it('shows sealed fields as set or not set, never a value', () => {
    expect(
      diffLines(
        revision(
          { enabled: false, clientSecret: { set: false } },
          { enabled: true, clientSecret: { set: true } },
          ['enabled', 'clientSecret'],
        ),
      ),
    ).toEqual([
      { field: 'enabled', before: 'false', after: 'true' },
      { field: 'clientSecret', before: 'chưa đặt', after: 'đã đặt' },
    ]);
  });

  it('offers a restore for scalars and for a partly sealed client, never for a whole secret', () => {
    expect(isRestorable(SETTING_KINDS['pdf.renderTimeoutMs'])).toBe(true);
    expect(isRestorable(SETTING_KINDS['auth.google'])).toBe(true);
    expect(isRestorable(SETTING_KINDS['mail.smtpUrl'])).toBe(false);
    expect(isRestorable(SETTING_KINDS['discord.webhooks'])).toBe(false);
  });

  it('shows a sealed revision as set or not set on every field, such as webhook event names', () => {
    expect(diffLines(revision({ set: true }, { set: true }, ['default']))).toEqual([
      { field: 'default', before: 'đã đặt', after: 'đã đặt' },
    ]);
  });

  it('finds a sealed part at the top of a side or inside one of its fields', () => {
    expect(hasSealedPart({ set: false })).toBe(true);
    expect(hasSealedPart({ enabled: false, clientId: 'x', clientSecret: { set: true } })).toBe(
      true,
    );
    expect(hasSealedPart(30000)).toBe(false);
  });
});
