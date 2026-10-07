/** SVG path through `values`, left to right, scaled into the box with a margin; one value draws a flat line. */
export function sparklinePath(
  values: readonly number[],
  width: number,
  height: number,
  padding = 4,
): string {
  if (!values.length) return '';
  const series = values.length > 1 ? values : [values[0]!, values[0]!];
  const low = Math.min(...series);
  const span = Math.max(...series) - low || 1;
  const stepX = (width - 2 * padding) / (series.length - 1);
  return series
    .map((value, index) => {
      const left = padding + index * stepX;
      const top = height - padding - ((value - low) / span) * (height - 2 * padding);
      return `${index ? 'L' : 'M'}${left.toFixed(1)} ${top.toFixed(1)}`;
    })
    .join(' ');
}
