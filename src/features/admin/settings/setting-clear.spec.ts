import { describe, expect, it } from 'vitest';
import { setting } from '@/test/admin-fixtures/settings';
import { clearConsequences, clearValueOf, isClearable } from './setting-clear';

const google = (enabled: boolean, secretSet: boolean) =>
  setting('auth.google', { enabled, clientId: 'id', clientSecret: { set: secretSet } });

describe('clearing a secret', () => {
  it('is offered only for a sealed setting whose secret is set', () => {
    expect(isClearable(setting('mail.smtpUrl', { set: true }))).toBe(true);
    expect(isClearable(setting('mail.smtpUrl', { set: false }))).toBe(false);
    expect(isClearable(setting('discord.webhooks', { set: true }))).toBe(true);
    expect(isClearable(google(true, true))).toBe(true);
    expect(isClearable(google(false, false))).toBe(false);
    expect(isClearable(setting('pdf.maxBytes', 1))).toBe(false);
  });

  it('sends the empty value of each kind, and switches an enabled client off with it', () => {
    expect(clearValueOf(setting('mail.smtpUrl', { set: true }))).toBe('');
    expect(clearValueOf(setting('discord.webhooks', { set: true }))).toEqual({});
    expect(clearValueOf(google(true, true))).toEqual({ enabled: false, clientSecret: '' });
  });

  it('refuses to build a clear for a setting with no secret', () => {
    expect(() => clearValueOf(setting('pdf.maxBytes', 1))).toThrow('pdf.maxBytes');
  });

  it('lists what the clear changes, the history that keeps nothing, and what stays', () => {
    expect(clearConsequences(setting('mail.smtpUrl', { set: true }))).toEqual([
      'mailOff',
      'notRestorable',
      'senderKept',
    ]);
    expect(clearConsequences(google(true, true))).toEqual([
      'providerOff',
      'notRestorable',
      'clientIdKept',
    ]);
    expect(clearConsequences(google(false, true))).toEqual(['notRestorable', 'clientIdKept']);
  });
});
