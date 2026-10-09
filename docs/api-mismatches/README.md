# API mismatches

One file per migration lane (`auth.md`, `problems.md`, ...). A mismatch is a place where the backend's OpenAPI document and the frontend disagree. Each gets a section `## M<lane>-<nn>` with: route, what the document says, what the code needs, the verdict (frontend fixed, or backend ask), and for a backend ask the file to change. `trustedUntilBackendFixed('M<lane>-<nn>', value)` marks the one use site of an open ask.
