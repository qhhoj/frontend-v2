# Settings pages (override of MASTER.md)

Mock-ups: the account-settings canvas (2026-10-08): SetProfile, SetProfileErrors, SetSecurityA to D, SetData, SetImpersonation and SetPhone / SetPhone2FA. Everything is styled through tokens, so Clay (default) and Glass come out of the same markup. This file records intent; the code is the truth.

- **Frame**: `SettingsLayout` draws one `h1` ("Cài đặt") and one breadcrumb. From `lg` a 240 px glass rail holds the section nav; below `lg` the nav is a row of pills that scrolls on its own, never the page. Anonymous visitors on `/settings/appearance` see the frame without the nav.
- **Cards**: `SettingsCard` is a glass card with an `h2` in the display font (20 px, bold); its lead is muted text, at most 620 px wide. Each section is one or more cards.
- **Notices**: `SettingsNotice` takes a tone (success = AC tint, error = WA tint, warning = TLE tint, info = accent-soft) and an optional Bit. Crown and sweat mark results only (save, backup codes shown, 2FA turned on, export ready or failed). The `security` padlock marks the security-page empties, the locked notices and the TOTP enrolment header.
- **Dialogs**: every confirmation uses the shared `ConfirmDialog` (`canConfirm`, Enter submits, focus returns to the opener, labelled close button).
- **Buttons**: `BUTTON` in `settings/buttons.ts`. Primary is a pill on `bg-gradient-accent` (flat accent-soft while pending or not yet allowed); secondary is a pill with a hairline; danger is outlined in `negative`, never filled. No opacity on disabled or busy states: token colour pairs only.
- **Save bar**: the profile's `SaveBar` is a sticky glass bar at the bottom (safe-area aware), with the status text and Undo and Save. The status reads "Có thay đổi chưa lưu" or "Không có thay đổi chưa lưu".
- **Errors**: a failed save puts `SaveErrorSummary` (a `role="alert"` with the sweat Bit) above the form; it takes focus and each line links to its field.
- **Impersonation banner**: `caution-strong`, 56 px minimum, sticky at the top above the page, with a pill "Dừng xem" button. The locked security page carries the padlock notice and disabled actions; the locked data page carries the padlock notice only.
- **QR tile**: `qr-ink` modules on `qr-paper` in every theme, with a quiet zone. Shown from `md` up; below `md` the page shows the app link instead ("Mở trực tiếp trong ứng dụng trên điện thoại này").
- **Phone**: no sideways scroll at 375 px; the nav pills scroll inside themselves; the save bar stays on screen.
