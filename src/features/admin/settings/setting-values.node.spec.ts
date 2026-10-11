import { describe, expect, it } from 'vitest';
import { setting } from '@/test/admin-fixtures/settings';
import { checkDraft, draftOf, valueToSend } from './setting-values';

describe('setting values', () => {
  it('sends a changed scalar and nothing for an unchanged one', () => {
    const timeout = setting('pdf.renderTimeoutMs', 30000);
    expect(valueToSend(timeout, draftOf(timeout))).toBeNull();
    expect(valueToSend(timeout, { value: 45000 })).toEqual({ value: 45000 });
  });

  it('never resends a sealed client secret that was not replaced', () => {
    const google = setting('auth.google', {
      enabled: false,
      clientId: 'old',
      clientSecret: { set: true },
    });
    const draft = { ...draftOf(google), enabled: true } as ReturnType<typeof draftOf>;
    expect(valueToSend(google, draft)).toEqual({ value: { enabled: true, clientId: 'old' } });
  });

  it('sends a new client secret only when "Thay thế" was used and something was typed', () => {
    const google = setting('auth.google', {
      enabled: true,
      clientId: 'x',
      clientSecret: { set: true },
    });
    const replacing = { ...draftOf(google), isReplacing: true, secret: '' } as ReturnType<
      typeof draftOf
    >;
    expect(valueToSend(google, replacing)).toBeNull();
    expect(valueToSend(google, { ...replacing, secret: 's3cret' })).toEqual({
      value: { clientSecret: 's3cret' },
    });
  });

  it('sends a whole-secret value only when replaced with something typed', () => {
    const smtp = setting('mail.smtpUrl', { set: true });
    expect(valueToSend(smtp, draftOf(smtp))).toBeNull();
    expect(
      valueToSend(smtp, { isSet: true, isReplacing: true, replacement: 'smtps://u:p@h' }),
    ).toEqual({ value: 'smtps://u:p@h' });
  });

  it('never wipes the stored SMTP URL: "Thay thế" with an empty or blank box sends nothing', () => {
    const smtp = setting('mail.smtpUrl', { set: true });
    for (const replacement of ['', '   '])
      expect(
        valueToSend(smtp, { isSet: true, isReplacing: true, replacement }),
        JSON.stringify(replacement),
      ).toBeNull();
  });

  it('trims a typed OAuth client secret and sends nothing for a blank one', () => {
    const google = setting('auth.google', {
      enabled: true,
      clientId: 'x',
      clientSecret: { set: true },
    });
    const replacing = { ...draftOf(google), isReplacing: true };
    expect(valueToSend(google, { ...replacing, secret: '   ' })).toBeNull();
    expect(valueToSend(google, { ...replacing, secret: ' s3cret ' })).toEqual({
      value: { clientSecret: 's3cret' },
    });
  });

  it('checks integer ranges before sending', () => {
    const pdf = setting('pdf.maxBytes', 52428800);
    const outOfRange = /^Phải là số nguyên từ 1 đến 1\D?073\D?741\D?824\.$/;
    expect(checkDraft(pdf, { value: 0 })).toMatch(outOfRange);
    expect(checkDraft(pdf, { value: 1.5 })).toMatch(outOfRange);
    expect(checkDraft(pdf, { value: 10 })).toBeNull();
  });

  it('accepts a plain http address only where the key allows it', () => {
    const judge = setting('externalJudge.baseUrl', '');
    expect(checkDraft(judge, { value: 'http://pcd.example:8080' })).toBeNull();
    expect(checkDraft(judge, { value: 'ftp://pcd.example' })).not.toBeNull();
    const pwned = setting('auth.pwnedApiUrl', '');
    expect(checkDraft(pwned, { value: 'http://pwned.example' })).not.toBeNull();
  });
});
