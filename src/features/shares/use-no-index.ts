import { onBeforeUnmount } from 'vue';

/**
 * While the page is open the document asks crawlers to skip it (`<meta name="robots" content="noindex, nofollow">`);
 * the meta is added during setup and removed when the page unmounts. The API's raw and download answers carry the same
 * request as a header.
 */
export function useNoIndex() {
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, nofollow';
  document.head.append(meta);
  onBeforeUnmount(() => meta.remove());
}
