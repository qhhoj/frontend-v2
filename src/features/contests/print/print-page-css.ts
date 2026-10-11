import { onScopeDispose, watchEffect } from 'vue';

export interface PrintPageLabels {
  /** Running header, left: the contest's name. */
  title: string;
  /** Running header, right. */
  subtitle: string;
  /** Footer, left: the page's address. */
  address: string;
  /** Footer, right: the word before the numbers in "Page 3 / 7". */
  pageWord: string;
}

/** A CSS string literal for any text: quotes, backslashes and line breaks cannot end it early. */
export const cssString = (text: string): string =>
  `"${text.replace(/[\\"]/g, '\\$&').replace(/[\r\n\f]+/g, ' ')}"`;

/**
 * The `@page` rule of the "all statements" sheet: A4 with a running header and a numbered footer in the margin boxes
 * (browsers without margin-box support print the pages without them). Applies to `.print-doc` (`page: contest-all`).
 */
export function printPageCss(labels: PrintPageLabels): string {
  const pageNumber = `${cssString(`${labels.pageWord} `)} counter(page) ${cssString(' / ')} counter(pages)`;
  return `@page contest-all {
  size: A4;
  margin: 18mm 16mm 20mm;
  @top-left { content: ${cssString(labels.title)}; font-size: 9pt; color: black; }
  @top-right { content: ${cssString(labels.subtitle)}; font-size: 9pt; color: black; }
  @bottom-left { content: ${cssString(labels.address)}; font-size: 9pt; color: black; }
  @bottom-right { content: ${pageNumber}; font-size: 9pt; color: black; }
}`;
}

/** Keeps the sheet's `@page` rule in the document while the page is on screen. */
export function usePrintPageRules(labels: () => PrintPageLabels | null) {
  const style = document.createElement('style');
  style.dataset.printPage = 'contest-all';
  document.head.append(style);
  watchEffect(() => {
    const current = labels();
    style.textContent = current ? printPageCss(current) : '';
  });
  onScopeDispose(() => style.remove());
}
