// The class names in the string literals of one source line, shared by the class-string checks (scripts/*-utilities.mjs).
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;
const QUOTED = /(['"`])((?:(?!\1).)*)\1/g;

/** The words of each quoted string of the line, as written (`md:hover:text-lg`, `!p-2`, `-mt-1`); quotes nested in an expression (`:class="a ? 'x' : 'y'"`) separate words. Comment lines give none. */
export const classLiterals = (line) =>
  COMMENT_LINE.test(line)
    ? []
    : [...line.matchAll(QUOTED)].map(([, , text]) => text.split(/[\s'"`]+/).filter(Boolean));

/** Every class word of the line, as written. */
export const classTokens = (line) => classLiterals(line).flat();

/** The utility itself: without its variants (`md:hover:`) and its `!` or `-` marks. */
export const utilityOf = (token) =>
  token.replace(/^.*:/, '').replace(/^[!-]/, '').replace(/!$/, '');
