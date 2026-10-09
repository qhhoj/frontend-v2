---
'qhhoj-frontend-v2': patch
---

Replay: a later refusal (board hidden or re-frozen) drops a loaded board at once; "not ready" polls with backoff and offers a retry; polling stops after a refusal; big boards redraw only changed rows, skip row slides above 100 rows and read the replay without deep reactivity; the clock follows wall time; a held scrub thumb no longer jumps; speed buttons have spoken names. Ghosts: a refused replace shows once and clears on the next preview, and "deleted" clears when a new set is stored.
