import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { cannedReply } from '@/test/community-fixtures';
import {
  cannedReplyRefusal,
  cannedReplySave,
  checkCannedReplyForm,
  toCannedReplyForm,
} from './canned-reply-form';

const form = (overrides: Partial<ReturnType<typeof toCannedReplyForm>> = {}) => ({
  ...toCannedReplyForm(null),
  title: 'Đã nhận',
  body: 'Chào {tên}',
  ...overrides,
});

describe('canned reply form', () => {
  it('asks for a title and a text, counts code points against the limits and checks the order', () => {
    expect(checkCannedReplyForm(form({ title: '  ', body: '' }))).toEqual({
      title: 'Nhập tiêu đề.',
      body: 'Nhập nội dung.',
    });
    expect(checkCannedReplyForm(form({ title: '😀'.repeat(60) }))).toEqual({});
    expect(checkCannedReplyForm(form({ title: 'x'.repeat(61) })).title).toBe(
      'Tiêu đề dài 61 ký tự, tối đa 60.',
    );
    expect(checkCannedReplyForm(form({ body: 'x'.repeat(8193) })).body).toBe(
      'Nội dung dài 8193 ký tự, tối đa 8192.',
    );
    for (const order of ['-1', '1.5', 'abc', '10001'])
      expect(checkCannedReplyForm(form({ order })).order, order).toBe(
        'Thứ tự phải là số nguyên từ 0 đến 10000.',
      );
    expect(checkCannedReplyForm(form({ order: '' }))).toEqual({});
  });

  it('creates with trimmed text and leaves the order to the server when empty', () => {
    expect(cannedReplySave(null, form({ title: ' Đã nhận ', order: '' }))).toEqual({
      kind: 'create',
      body: { title: 'Đã nhận', body: 'Chào {tên}' },
    });
    expect(cannedReplySave(null, form({ order: '4' }))).toEqual({
      kind: 'create',
      body: { title: 'Đã nhận', body: 'Chào {tên}', order: 4 },
    });
  });

  it('updates only what changed', () => {
    const reply = cannedReply();
    expect(cannedReplySave(reply, toCannedReplyForm(reply))).toEqual({
      kind: 'update',
      id: reply.id,
      body: {},
    });
    expect(cannedReplySave(reply, { ...toCannedReplyForm(reply), order: '3' })).toEqual({
      kind: 'update',
      id: reply.id,
      body: { order: 3 },
    });
  });

  it('names the 100 cap and a reply deleted elsewhere in its own words', () => {
    expect(cannedReplyRefusal(new ApiError('conflict', 409, 'full'))).toBe(
      'Đã đủ 100 mẫu. Xóa bớt một mẫu trước khi thêm.',
    );
    expect(cannedReplyRefusal(new ApiError('not_found', 404, 'gone'))).toBe(
      'Mẫu này đã bị xóa ở nơi khác. Danh sách đã được tải lại.',
    );
    expect(cannedReplyRefusal(new ApiError('forbidden', 403, 'no'))).toBe(
      'Bạn không có quyền làm việc này.',
    );
  });
});
