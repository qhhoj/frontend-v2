---
'qhhoj-frontend-v2': patch
---

Rendered Markdown in statements, posts, comments and other user content gets its typography back (paragraph spacing, heading sizes, list markers, link colour, inline code, table borders, blockquotes, rules), which Tailwind's reset had removed; KaTeX's stylesheet now loads wherever user content is shown, so formulas in posts no longer appear twice.
