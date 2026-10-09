import { describe, expect, it } from 'vitest';
import { checkConfigValue, configKindOf, previewDocument } from './config-kinds';

describe('config kinds', () => {
  it('reads the kind from the key, then the value', () => {
    expect(configKindOf('analytics', '<script></script>')).toBe('tracking');
    expect(configKindOf('discord_invite_link', 'https://discord.gg/x')).toBe('url');
    expect(configKindOf('announcement', '<p>x</p>')).toBe('html');
    expect(configKindOf('contact_email', 'a@b.c')).toBe('text');
  });

  it('accepts only http(s) or nothing for links, and caps every value at 20 000', () => {
    expect(checkConfigValue('url', 'javascript:alert(1)')).toBe(
      'Khoá liên kết chỉ nhận http hoặc https.',
    );
    expect(checkConfigValue('url', '')).toBeNull();
    expect(checkConfigValue('text', 'x'.repeat(20_001))).toBe('Tối đa 20 000 ký tự.');
  });

  it('puts the policy in the document head, before any of the value, so the value cannot come first', () => {
    const doc = previewDocument('<b>13:00</b><script>alert(1)</script>');
    expect(doc).toContain('<b>13:00</b>');
    expect(doc.indexOf('Content-Security-Policy')).toBeGreaterThan(-1);
    expect(doc.indexOf('Content-Security-Policy')).toBeLessThan(doc.indexOf('<b>13:00</b>'));
    expect(doc.indexOf('</head>')).toBeLessThan(doc.indexOf('<b>13:00</b>'));
  });
});
