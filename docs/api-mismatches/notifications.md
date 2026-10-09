# Notifications API mismatches

## N1-01 `quota-warning` is not a `NotificationKind`

Route: `GET /notifications` (`kind` query).

- Document: `NotificationKind` lists five kinds; `quota-warning` (backend plan B7) is not among them.
- Code needs: a "Khác" (other) chip on `/notifications` that asks for the kinds outside tickets, contests and organizations.
- Verdict: backend ask once B7 lands (add `quota-warning` to `NotificationKind`). Until then `GROUP_KINDS.other` is empty and the chip is hidden, because an empty `kind` filter would list every row. Rows of an unknown kind still render with the bell icon.
- Use site: `src/features/notifications/notification-kinds.ts`.
