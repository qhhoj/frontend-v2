---
'qhhoj-frontend-v2': patch
---

Fix round for standalone features: very different large sources get a "too different to compare" notice instead of freezing the diff page; moved-line detection ignores short lines; expired integration keys show as expired; a past key expiry gets the Vietnamese refusal text; the new key is shown even if the list refresh is slow; short-link creation refuses a past expiry; the expired chip shows on narrow screens; deleting a short link drops its cached automatic copy; the compare bar leaves with the session; Tab indent in the low-power editor can be undone; English diff counts use singular forms.
