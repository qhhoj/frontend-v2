/** The address people paste: the SPA renders `/c/<code>` itself, there is no redirect. */
export const shareUrl = (code: string, origin: string = window.location.origin): string =>
  `${origin}/c/${code}`;

/** "qhhoj.com/c/k7m2xq4p9d": the link without its scheme, as the dialog and the list print it. */
export const displayShareUrl = (url: string): string => url.replace(/^https?:\/\//, '');
