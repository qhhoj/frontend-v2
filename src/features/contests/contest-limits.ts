import type { ContestProblem } from '@/api/types/contests';
import { i18n } from '@/i18n';

const KIB_PER_MIB = 1024;

/** M5B's one "Giới hạn" cell: time and memory together, or a dash when the viewer may not see the problem (null limits). */
export function limitsText(problem: Pick<ContestProblem, 'timeLimit' | 'memoryLimit'>): string {
  if (problem.timeLimit === null || problem.memoryLimit === null) return '—';
  const seconds = new Intl.NumberFormat(i18n.global.locale.value, {
    maximumFractionDigits: 2,
  }).format(problem.timeLimit);
  return `${seconds} s · ${Math.round(problem.memoryLimit / KIB_PER_MIB)} MB`;
}
