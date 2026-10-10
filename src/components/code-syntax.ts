import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tagHighlighter, tags, type Tag } from '@lezer/highlight';

export type SyntaxToken = 'keyword' | 'type' | 'number' | 'string' | 'comment' | 'function';

interface SyntaxRule {
  token: SyntaxToken;
  tags: Tag[];
}

/**
 * The one tag-to-colour mapping: the editor (inline colours) and the static highlighter (classes, see
 * `code-highlight.css`) both derive from it, so edit-time and read-only code always look alike.
 */
export const SYNTAX_RULES: readonly SyntaxRule[] = [
  {
    token: 'keyword',
    tags: [
      tags.keyword,
      tags.controlKeyword,
      tags.operatorKeyword,
      tags.definitionKeyword,
      tags.moduleKeyword,
      tags.modifier,
      tags.meta,
      tags.processingInstruction,
    ],
  },
  { token: 'type', tags: [tags.typeName, tags.className, tags.namespace] },
  { token: 'number', tags: [tags.number, tags.bool, tags.null, tags.atom] },
  {
    token: 'string',
    tags: [tags.string, tags.special(tags.string), tags.character, tags.regexp],
  },
  { token: 'comment', tags: [tags.comment, tags.lineComment, tags.blockComment] },
  {
    token: 'function',
    tags: [
      tags.function(tags.variableName),
      tags.function(tags.propertyName),
      tags.definition(tags.function(tags.variableName)),
    ],
  },
];

/** Class on a highlighted span; `code-highlight.css` colours it from the `--qh-syntax-*` token. */
export const syntaxClass = (token: SyntaxToken) => `syn-${token}`;

/** For the static highlighter: the same rules, as class names. */
export const syntaxClasses = tagHighlighter(
  SYNTAX_RULES.map((rule) => ({ tag: rule.tags, class: syntaxClass(rule.token) })),
);

/** Six colours from the theme's `--qh-syntax-*` tokens, so a theme recolours code with CSS only; comments are italic. */
export const syntaxStyle = HighlightStyle.define(
  SYNTAX_RULES.map((rule) => ({
    tag: rule.tags,
    color: `var(--qh-syntax-${rule.token})`,
    ...(rule.token === 'comment' && { fontStyle: 'italic' }),
  })),
);
export const syntaxHighlight = syntaxHighlighting(syntaxStyle);
