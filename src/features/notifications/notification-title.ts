import { DEFAULT_LOCALE, i18n, translate } from '@/i18n';

/**
 * The backend stores each notification title already rendered in Vietnamese (libs/community/src/ticket-notifications.ts,
 * notifications/notification-draft.ts, quota-warning.notifier.ts). Until it sends structured data, the SPA recognises the
 * title of each kind and rebuilds it from `notifications.titles.<name>` in the reader's language.
 */
const TITLE_PATTERNS: ReadonlyArray<{ kind: string; pattern: RegExp; name: string }> = [
  { kind: 'ticket-new', pattern: /^Phiếu hỗ trợ mới: (?<name>.+)$/su, name: 'ticketNew' },
  {
    kind: 'ticket-new',
    pattern: /^Bạn được giao một phiếu hỗ trợ: (?<name>.+)$/su,
    name: 'ticketAssigned',
  },
  { kind: 'ticket-message', pattern: /^Phiếu hỗ trợ có trả lời mới$/u, name: 'ticketReply' },
  { kind: 'ticket-status', pattern: /^Phiếu hỗ trợ đã được mở lại$/u, name: 'ticketReopened' },
  { kind: 'ticket-status', pattern: /^Phiếu hỗ trợ đã được đóng$/u, name: 'ticketClosed' },
  {
    kind: 'contest-announcement',
    pattern: /^Thông báo mới trong "(?<name>.+)"$/su,
    name: 'contestAnnouncement',
  },
  {
    kind: 'organization-request-decided',
    pattern: /^Yêu cầu tham gia "(?<name>.+)" đã được duyệt$/su,
    name: 'requestApproved',
  },
  {
    kind: 'organization-request-decided',
    pattern: /^Yêu cầu tham gia "(?<name>.+)" đã bị từ chối$/su,
    name: 'requestRejected',
  },
  {
    kind: 'quota-warning',
    pattern: /^(?<name>.+) đã dùng 80% tín dụng tháng này$/su,
    name: 'quotaCredits',
  },
  {
    kind: 'quota-warning',
    pattern: /^(?<name>.+) đã dùng 80% dung lượng dữ liệu$/su,
    name: 'quotaStorage',
  },
];

/** The `notifications.titles.<name>` key and `{name}` parameter that rebuild a stored Vietnamese title; null when the title is not one this build knows. */
export function titleTemplateOf(
  kind: string,
  title: string,
): { name: string; subject: string } | null {
  for (const rule of TITLE_PATTERNS) {
    if (rule.kind !== kind) continue;
    const match = rule.pattern.exec(title);
    if (match) return { name: rule.name, subject: match.groups?.['name'] ?? '' };
  }
  return null;
}

/** The title in the reader's language: as stored in Vietnamese, or rebuilt from its template in English (a title this build does not know stays as stored). */
export function localizedTitle(item: { kind: string; title: string }): string {
  if (i18n.global.locale.value === DEFAULT_LOCALE) return item.title;
  const template = titleTemplateOf(item.kind, item.title);
  if (!template) return item.title;
  return translate(`notifications.titles.${template.name}`, { name: template.subject });
}
