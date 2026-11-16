import type { RouteLocationRaw } from 'vue-router';

/** One tab of the problem page: a link to its own place (the statement and editorial share the problem route, the rest are child routes). */
export interface ProblemTab {
  id: string;
  labelKey: string;
  to: RouteLocationRaw;
}
