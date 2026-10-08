import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/** Six colours from the theme's `--qh-syntax-*` tokens, so a theme recolours code with CSS only; comments are italic. */
export const syntaxStyle = HighlightStyle.define([
  {
    tag: [
      tags.keyword,
      tags.controlKeyword,
      tags.operatorKeyword,
      tags.definitionKeyword,
      tags.moduleKeyword,
      tags.modifier,
      tags.meta,
      tags.processingInstruction,
    ],
    color: 'var(--qh-syntax-keyword)',
  },
  { tag: [tags.typeName, tags.className, tags.namespace], color: 'var(--qh-syntax-type)' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: 'var(--qh-syntax-number)' },
  {
    tag: [tags.string, tags.special(tags.string), tags.character, tags.regexp],
    color: 'var(--qh-syntax-string)',
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: 'var(--qh-syntax-comment)',
    fontStyle: 'italic',
  },
  {
    tag: [
      tags.function(tags.variableName),
      tags.function(tags.propertyName),
      tags.definition(tags.function(tags.variableName)),
    ],
    color: 'var(--qh-syntax-function)',
  },
]);
export const syntaxHighlight = syntaxHighlighting(syntaxStyle);
