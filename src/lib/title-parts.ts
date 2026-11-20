/** What sets a series apart from its part in a name: "Tin học trẻ 2024 - Bảng C - Chuẩn hóa". */
const SERIES_SEPARATOR = ' - ';

/**
 * A name as its shared series and its own part: lists dim the series and keep the last ` - ` segment strong, so the
 * word that tells two rows apart is the one the eye lands on. A name without the separator is all `name`.
 */
export function titleParts(title: string): { series: string; name: string } {
  const cut = title.lastIndexOf(SERIES_SEPARATOR);
  if (cut <= 0) return { series: '', name: title };
  const name = title.slice(cut + SERIES_SEPARATOR.length);
  return name ? { series: title.slice(0, cut), name } : { series: '', name: title };
}
