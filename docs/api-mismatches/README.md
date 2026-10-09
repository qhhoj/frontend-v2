# API mismatches

One file per migration lane (`auth.md`, `problems.md`, ...). A mismatch is a place where the backend's OpenAPI document and the frontend disagree. Each gets a section `## M<lane>-<nn>` with: route, what the document says, what the code needs, the verdict (frontend fixed, or backend ask), and for a backend ask the file to change. `trustedUntilBackendFixed('M<lane>-<nn>', value)` marks the one use site of an open ask.

A section marked `Resolved` is history: its `trustedUntilBackendFixed` calls are gone. All six asks M2-01, M2-02, M5-01, M5-02, M7-01 and M7-02 were resolved by backend `ba5db96`; no ask is open, so the "Backend asks" table of `docs/decisions.md` needs no `C<k>` row.
