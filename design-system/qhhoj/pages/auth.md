# Auth screens (override of MASTER.md)

Mock-ups: the Clay sign-in canvas (2026-10-08): Login B, sign-up A, second factor A, and the CheckEmail, Activation, TwoFactorStates, ForgotReset, ForcedChange and SocialComplete boards. Everything is styled through tokens, so Clay (default) and Glass come out of the same markup. This file records intent; the code is the truth.

- **Layout**: `meta.layout: 'auth'` removes the pill header. Every auth screen but `/login` is a top bar (logo, page action, locale toggle) over one centred `glass rounded-panel` card: 460 px for state cards and 2FA, 480 forced change, 520 social signup, 660 register (two columns from `sm`). `/login` has no layout meta: it keeps the pill header, and its page is a two-column split from `lg` (brand panel on `bg-accent-soft` with Bit, headline, paragraph and a mono counts line, beside the card). Below `lg` the panel is a band (small Bit, logo, counts) above a borderless form.
- **Fields**: label above, 48 px outlined input (`rounded-row`, `border-line-strong`, `bg-surface-solid`); green border for a confirmed username, red for an error or a taken name; a 44 px show/hide button in every password input; error text under the input with an icon and `aria-describedby`.
- **Buttons**: primary is a 48 px pill on `bg-gradient-accent` (flat in Clay), `aria-disabled` while pending; secondary is a 48 px pill with a hairline; a resend button cooling down reads "Gửi lại sau 0:42".
- **Pickers**: the school picker is a searchable select 44 px tall (`min-h-11`), placeholder "Gõ để tìm trường"; the default-language select is native and starts at C++17. Both are optional.
- **State cards**: a 56 px round badge (accent, positive, warning or negative tint) over a centred title and explanation; the explanation is the `status` (success) or `alert` (dead end). Dead ends end in a card, not a form: expired activation or reset links, a refused or spent social token, a linked social identity, a social email already registered.
- **Banners**: info on `bg-accent-soft`, success and failure on the AC/WA verdict tints, warning on the TLE tint; a notice handed over by another page can be dismissed.
- **Code boxes**: six 52 x 60 px mono boxes in a `role="group"` "Mã 6 chữ số"; paste and autofill spread across them.
- **Strength meter**: four steps, red / amber / green by level, always with the level in text ("Mức vừa — thêm ký tự đặc biệt hoặc vài từ nữa"); it is `role="meter"` with a value.
- **Loading**: the pickers show skeletons shaped like their frames and never hold the form; the social buttons and the login counts are decoration (blocks, nothing on failure, no Bits); activation waits through the shell.
- **Terms**: the rules checkbox is plain text, with no links, until the terms and privacy pages exist.
- **Deviations from the boards**: see `docs/decisions.md` ("8b auth screens").
