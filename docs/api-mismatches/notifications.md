# Notifications API mismatches

## N1-01 `quota-warning` is not a `NotificationKind`

Status: resolved. Backend B7 added `quota-warning` to `NotificationKind`.

Route: `GET /notifications` (`kind` query).

- Was: `NotificationKind` listed five kinds, so the "Khác" (other) chip had no kind to ask for and stayed hidden (an empty `kind` filter lists every row).
- Now: `GROUP_KINDS.other` is `['quota-warning']`, the chip is shown, and its row draws the bell icon.
- Use site: `src/features/notifications/notification-kinds.ts`.
