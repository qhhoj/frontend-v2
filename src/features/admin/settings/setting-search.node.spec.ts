import { describe, expect, it } from 'vitest';
import { settingSearchHits } from './setting-search';

const ROWS = [
  { key: 'site.timeZone', texts: ['site.timeZone', 'Tên múi giờ IANA', 'Múi giờ'] },
  { key: 'mail.from', texts: ['mail.from', 'Địa chỉ gửi', 'Thư điện tử'] },
  { key: 'mail.smtpUrl', texts: ['mail.smtpUrl', 'URL SMTP', 'Thư điện tử'] },
];

describe('settingSearchHits', () => {
  it('finds a row by its label, its key or its block title, ignoring case', () => {
    expect(settingSearchHits('MÚI GIỜ', ROWS)).toEqual(new Set(['site.timeZone']));
    expect(settingSearchHits('smtpurl', ROWS)).toEqual(new Set(['mail.smtpUrl']));
    expect(settingSearchHits('thư điện', ROWS)).toEqual(new Set(['mail.from', 'mail.smtpUrl']));
  });

  it('is no search for a blank term, and an empty set when nothing matches', () => {
    expect(settingSearchHits('   ', ROWS)).toBeNull();
    expect(settingSearchHits('polygon', ROWS)).toEqual(new Set());
  });

  it('reads the term literally, never as a pattern', () => {
    expect(settingSearchHits('.*', ROWS)).toEqual(new Set());
  });
});
