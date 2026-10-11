import { renderPreview } from '@/api/admin-common.api';
import type { PreviewSource } from '@/api/types/admin-common';
import { useDebouncedPreview } from '@/lib/use-debounced-preview';

export { PREVIEW_DELAY_MS } from '@/lib/use-debounced-preview';

/** The staff Markdown preview (`POST /problems/render-preview`) in the style of `source`. */
export const useRenderPreview = (markdown: () => string, source: () => PreviewSource) =>
  useDebouncedPreview(markdown, (text) => renderPreview(source(), text), { alsoWatch: [source] });
