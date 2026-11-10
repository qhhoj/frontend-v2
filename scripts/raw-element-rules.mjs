// The rules of the raw-element ratchet (scripts/raw-elements.mjs): what each one finds in a file and the kit part to use
// instead. Three kinds:
// - raw template elements (`<button>`, `<input>` by type, `<select>`, `<textarea>`, `<table>`, `<details>`, `<dialog>`), in
//   any letter case (`<BUTTON>` renders a button too) and through `<component :is="'button'">`; a capitalised tag that
//   names an import (`<Select>` from the kit) is that component, not the element;
// - imports that bypass the kit (scripts/wrapper-imports.mjs);
// - class words the standard retires (PLAN §1.9): `uppercase` labels, fixed `size-/h-/min-h-[N px|rem]`, opacity on a
//   disabled state, and `verdict-*` colours outside the verdict parts.
import { classTokens, COMMENT_LINE, utilityOf } from './class-tokens.mjs';
import { importUses, isKit } from './wrapper-imports.mjs';

/** Element rules: the tag (lower case) or `input` type they match, and the kit part. */
export const ELEMENT_RULES = {
  button: 'AppButton or IconButton',
  input: 'TextInput (numbers too) or DateTimeField',
  search: 'SearchInput',
  password: 'PasswordInput',
  checkbox: 'Checkbox or Switch',
  radio: 'RadioGroup, ChoiceCards or SegmentedControl',
  file: 'UploadButton',
  select: 'SelectField or ComboBox',
  textarea: 'TextArea or MarkdownEditor',
  table: 'DataTable',
  details: 'Disclosure',
  dialog: 'Modal or Drawer',
};
/** `<input type>` values with their own rule; range and hidden have no kit part and pass. */
const INPUT_TYPES = {
  search: 'search',
  password: 'password',
  checkbox: 'checkbox',
  radio: 'radio',
  file: 'file',
  button: 'button',
  submit: 'button',
  reset: 'button',
  range: null,
  hidden: null,
};

/** Files that draw a verdict (a submission's result or the viewer's solved state): `verdict-*` is theirs. */
export const VERDICT_PARTS = [
  'lib/verdicts.ts',
  'features/submissions/VerdictDistributionBar.vue',
  'features/submissions/TestOverview.vue',
  'features/submissions/test-overview.ts',
  'features/submissions/list/test-strip.ts',
  'features/submissions/list/TestStrip.vue',
  'features/submissions/ResultSummaryCard.vue',
  'features/submissions/CasesTable.vue',
  'features/contests/ProblemResultsTable.vue',
  'features/contests/OwnResultChip.vue',
  'features/contests/ranking-cell-classes.ts',
  'features/contests/ContestProblemSwitcher.vue',
  'features/problems/viewer-status.ts',
  'features/problems/ProblemStatusMark.vue',
  'features/profile/ProfileSolvedTab.vue',
  'features/appearance/AppearancePreview.vue',
];

const STATE_WORD = /(?<![\w:@-])(?:disabled|busy|pending)(?![\w-])/;
/** `:disabled="disabled"` is the control's own attribute, not a class condition; neither are quoted words. */
const BOUND_STATE = /[:@\w.-]+\s*=\s*"\s*(?:disabled|busy|pending)\s*"/g;
/** Whether a line's expression (not its quoted class words) names a disabled, busy or pending state. */
const mentionsDisabledState = (line) =>
  STATE_WORD.test(line.replace(BOUND_STATE, '').replace(/(['`])(?:(?!\1).)*\1/g, ''));

/** Class rules: whether a class word breaks it (for the file `rel`), and what to use instead. */
export const CLASS_RULES = {
  uppercase: {
    use: 'sentence case: text-caption font-semibold',
    breaks: (token) => utilityOf(token) === 'uppercase',
  },
  'fixed-size': {
    use: 'the size steps (icons size-3.5, size-4, size-5; controls min-h-(--qh-control)); a skeleton copies the real markup',
    breaks: (token) => /^(?:size|h|min-h)-\[[\d.]+(?:px|rem)\]$/.test(utilityOf(token)),
  },
  'disabled-opacity': {
    use: 'the muted disabled pair of the kit control (AppButton disabledReason), never opacity',
    breaks: (token, rel, line) =>
      /^opacity-/.test(utilityOf(token)) &&
      (token
        .split(':')
        .slice(0, -1)
        .some((variant) => /disabled/.test(variant)) ||
        mentionsDisabledState(line)),
  },
  'verdict-tone': {
    use: 'the status tones success/danger/warning (positive-bg, negative-bg); verdict-* is for verdict parts',
    breaks: (token, rel) => /-verdict-/.test(utilityOf(token)) && !VERDICT_PARTS.includes(rel),
  },
};

const ELEMENT_TAG = /<([a-zA-Z][\w-]*)\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const NON_TEMPLATE = /<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1>/g;
const STATIC_TYPE = /(?<![:\w-])type\s*=\s*["']([^"']*)["']/;
const IS_VALUE = /(?<![\w-])(?::|v-bind:)?is\s*=\s*(?:"([^"]*)"|'([^']*)')/;
const IMPORTED_NAME = /\bimport\s+(?:type\s+)?([\w$]+)|\b(?:as\s+)?([\w$]+)\s*(?=[,}])/g;
const IMPORT_CLAUSE = /\bimport\s+[^'"]*?\bfrom\b/g;
const lineOf = (source, index) => source.slice(0, index).split('\n').length;

/** The names a file's imports bind (`import Select from`, `{ a as Select }`): a tag of that name is the component. */
function importedNames(source) {
  const clauses = source.match(IMPORT_CLAUSE) ?? [];
  return new Set(
    clauses.flatMap((clause) =>
      [...clause.matchAll(IMPORTED_NAME)].map((match) => match[1] ?? match[2]),
    ),
  );
}

const ELEMENTS = ['button', 'input', 'select', 'textarea', 'table', 'details', 'dialog'];

/** The raw element a `<component is>` can render: `is="button"`, `:is="link ? 'a' : 'button'"`; '' when none. */
function dynamicElement(attrs) {
  const match = IS_VALUE.exec(attrs);
  if (!match) return '';
  const value = match[1] ?? match[2];
  const isBound = /^\s*(?::|v-bind:)/.test(match[0]);
  const names = isBound
    ? [...value.matchAll(/['"`](\w+)['"`]/g)].map((word) => word[1])
    : [value.trim()];
  return names.map((name) => name.toLowerCase()).find((name) => ELEMENTS.includes(name)) ?? '';
}

/** The rule a tag breaks, or null: `<input>` goes by its static type; a dynamic `:type` is a text input. */
function elementRule(element, attrs) {
  if (element !== 'input') return ELEMENTS.includes(element) ? element : null;
  const type = STATIC_TYPE.exec(attrs)?.[1].toLowerCase();
  return type !== undefined && type in INPUT_TYPES ? INPUT_TYPES[type] : 'input';
}

/** Every raw element of one .vue file's template, as `{ rule, line, text }`. */
export function elementUses(source, rel) {
  if (!rel.endsWith('.vue') || isKit(rel)) return [];
  const template = source.replace(NON_TEMPLATE, (block) => block.replace(/[^\n]/g, ' '));
  const components = importedNames(source);
  return [...template.matchAll(ELEMENT_TAG)].flatMap((match) => {
    const [tag, name, attrs] = match;
    if (name !== name.toLowerCase() && components.has(name)) return [];
    const element = name.toLowerCase() === 'component' ? dynamicElement(attrs) : name.toLowerCase();
    const rule = elementRule(element, attrs);
    return rule ? [{ rule, line: lineOf(template, match.index), text: tag.slice(0, 40) }] : [];
  });
}

/** A line without these words holds no class a CLASS_RULES rule refuses (it saves reading every line's classes). */
const CLASS_HINT = /uppercase|\[|opacity-|verdict-/;

/** Unquoted object keys of a line (`{ uppercase: on }`), which `:class` objects may use as class words. */
const bareKeys = (line) =>
  [...line.matchAll(/(?<=[{,]\s*)([A-Za-z][\w-]*)\s*:(?!:)/g)].map((match) => match[1]);

/** Every retired class word of one file, as `{ rule, line, text }`; HTML comments are skipped. */
export function classUses(source, rel) {
  const code = source.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '));
  return code.split('\n').flatMap((line, index) =>
    (CLASS_HINT.test(line) && !COMMENT_LINE.test(line)
      ? [...classTokens(line), ...bareKeys(line)]
      : []
    ).flatMap((token) =>
      Object.entries(CLASS_RULES)
        .filter(([, { breaks }]) => breaks(token, rel, line))
        .map(([rule]) => ({ rule, line: index + 1, text: token })),
    ),
  );
}

/** Every use of one file that a rule counts: raw elements, kit-bypassing imports and retired classes. */
export const ruleUses = (source, rel) => [
  ...elementUses(source, rel),
  ...importUses(source, rel),
  ...classUses(source, rel),
];
