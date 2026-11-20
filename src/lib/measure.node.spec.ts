import { afterEach, describe, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import {
  formatCaseMemory,
  formatCaseTime,
  formatFileSize,
  formatMemoryLimit,
  formatTimeLimit,
} from './measure';

/** The functions join number and unit with a no-break space; the expectations are written with a plain one. */
const plain = (text: string) => text.replace(/ /g, ' ');

describe('measured time and memory', () => {
  it('writes the decimal comma in Vietnamese and the point in English', () => {
    expect(plain(formatCaseTime(1.05, 'vi'))).toBe('1,05 s');
    expect(plain(formatCaseTime(1.05, 'en'))).toBe('1.05 s');
    expect(plain(formatCaseMemory(3686, 'vi'))).toBe('3,5 MB');
    expect(plain(formatCaseMemory(3686, 'en'))).toBe('3.5 MB');
  });

  it('keeps fixed decimals, so a column lines up', () => {
    expect(plain(formatCaseTime(0, 'vi'))).toBe('0,00 s');
    expect(plain(formatCaseTime(2, 'vi'))).toBe('2,00 s');
    expect(plain(formatCaseMemory(2048, 'vi'))).toBe('2,0 MB');
  });

  it('cuts memory instead of rounding: a run under its limit never prints as the limit', () => {
    expect(plain(formatCaseMemory(262143, 'vi'))).toBe('255,9 MB');
    expect(plain(formatCaseMemory(262144, 'vi'))).toBe('256,0 MB');
  });

  it('keeps the number and its unit on one line', () => {
    expect(formatCaseTime(1.05, 'vi')).toBe('1,05 s');
  });
});

describe('limits', () => {
  it('shows a time limit with one decimal, two when the limit has them', () => {
    expect(plain(formatTimeLimit(1, 'vi'))).toBe('1,0 s');
    expect(plain(formatTimeLimit(1.5, 'en'))).toBe('1.5 s');
    expect(plain(formatTimeLimit(0.25, 'vi'))).toBe('0,25 s');
  });

  it('shows a memory limit without padding and without digit grouping', () => {
    expect(plain(formatMemoryLimit(262144, 'vi'))).toBe('256 MB');
    expect(plain(formatMemoryLimit(1536, 'vi'))).toBe('1,5 MB');
    expect(plain(formatMemoryLimit(1048576, 'vi'))).toBe('1024 MB');
    expect(plain(formatMemoryLimit(1048576, 'en'))).toBe('1024 MB');
  });
});

describe('file sizes', () => {
  it('uses megabytes from one megabyte up and whole kilobytes below', () => {
    expect(plain(formatFileSize(1887437, 'vi'))).toBe('1,8 MB');
    expect(plain(formatFileSize(1048576, 'en'))).toBe('1.0 MB');
    expect(plain(formatFileSize(65536, 'vi'))).toBe('64 KB');
    expect(plain(formatFileSize(0, 'vi'))).toBe('0 KB');
  });
});

describe('the site locale', () => {
  afterEach(() => {
    i18n.global.locale.value = 'vi';
  });

  it('is the default: the same call follows a language switch', () => {
    i18n.global.locale.value = 'vi';
    expect(plain(formatCaseTime(1.05))).toBe('1,05 s');
    i18n.global.locale.value = 'en';
    expect(plain(formatCaseTime(1.05))).toBe('1.05 s');
  });
});
