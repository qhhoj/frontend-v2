import { afterEach, describe, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import { localizedTitle, titleTemplateOf } from './notification-title';

afterEach(() => {
  i18n.global.locale.value = 'vi';
});

describe('titleTemplateOf', () => {
  it('recognises each stored Vietnamese title by its kind and returns the variable part', () => {
    expect(titleTemplateOf('ticket-new', 'Phiếu hỗ trợ mới: Lỗi đề bài')).toEqual({
      name: 'ticketNew',
      subject: 'Lỗi đề bài',
    });
    expect(
      titleTemplateOf(
        'organization-request-decided',
        'Yêu cầu tham gia "public_org_priv" đã bị từ chối',
      ),
    ).toEqual({ name: 'requestRejected', subject: 'public_org_priv' });
    expect(titleTemplateOf('quota-warning', 'HCMUS đã dùng 80% dung lượng dữ liệu')).toEqual({
      name: 'quotaStorage',
      subject: 'HCMUS',
    });
  });
  it('knows nothing of a title under another kind or of a text it has not seen', () => {
    expect(titleTemplateOf('ticket-status', 'Phiếu hỗ trợ có trả lời mới')).toBeNull();
    expect(titleTemplateOf('ticket-message', 'Tiêu đề lạ')).toBeNull();
  });
});

describe('localizedTitle', () => {
  const reopened = { kind: 'ticket-status', title: 'Phiếu hỗ trợ đã được mở lại' } as const;

  it('keeps the stored Vietnamese title in the Vietnamese UI', () => {
    expect(localizedTitle(reopened)).toBe('Phiếu hỗ trợ đã được mở lại');
  });
  it('rebuilds the title in English, with the ticket or organization name in place', () => {
    i18n.global.locale.value = 'en';
    expect(localizedTitle(reopened)).toBe('A support ticket was reopened');
    expect(
      localizedTitle({
        kind: 'organization-request-decided',
        title: 'Yêu cầu tham gia "public_org_priv" đã được duyệt',
      }),
    ).toBe('Your request to join "public_org_priv" was approved');
  });
  it('leaves a title this build does not know as stored, in either language', () => {
    i18n.global.locale.value = 'en';
    expect(localizedTitle({ kind: 'brand-new-kind', title: 'Tiêu đề lạ' })).toBe('Tiêu đề lạ');
  });
});
