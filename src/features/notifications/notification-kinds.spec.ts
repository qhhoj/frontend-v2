import { Bell, Building2, LifeBuoy, Trophy } from 'lucide-vue-next';
import { describe, expect, it } from 'vitest';
import { isTicketKind, kindIcon, kindsOfGroup } from './notification-kinds';

describe('kindIcon', () => {
  it('draws one icon per family of known kinds', () => {
    expect(['ticket-new', 'ticket-message', 'ticket-status'].map(kindIcon)).toEqual([
      LifeBuoy,
      LifeBuoy,
      LifeBuoy,
    ]);
    expect(kindIcon('contest-announcement')).toBe(Trophy);
    expect(kindIcon('organization-request-decided')).toBe(Building2);
  });

  it('draws the bell for a kind added after this build (quota-warning)', () => {
    expect(kindIcon('quota-warning')).toBe(Bell);
    expect(kindIcon('')).toBe(Bell);
  });
});

describe('kind groups (the "Loại" chips; the lists feed the `kind` query, requires VNOI backend B1 ask)', () => {
  it('maps each chip to the backend kinds it stands for and no kind to two chips', () => {
    expect(kindsOfGroup('ticket')).toEqual(['ticket-new', 'ticket-message', 'ticket-status']);
    expect(kindsOfGroup('contest')).toEqual(['contest-announcement']);
    expect(kindsOfGroup('organization')).toEqual(['organization-request-decided']);
    const all = (['ticket', 'contest', 'organization', 'other'] as const).flatMap(kindsOfGroup);
    expect(new Set(all).size).toBe(all.length);
  });

  it('tells ticket kinds from the rest (the banner says "Xem phiếu" for tickets)', () => {
    expect(isTicketKind('ticket-message')).toBe(true);
    expect(isTicketKind('contest-announcement')).toBe(false);
  });
});
