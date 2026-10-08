import { ok, page } from './mock-api';
import { organizationItem, problemMeta } from './fixtures';

/** What every page that renders the social buttons loads. `mockApi` fails on an unmocked request, so each such page's spec spreads this. */
export const socialRoutes = {
  'GET /auth/social/providers': ok({ providers: ['google', 'github'] }),
};

/** What the signup pages load: the open schools and the languages. Each such page's spec spreads this too. */
export const registerRoutes = {
  'GET /organizations': page([organizationItem()]),
  'GET /problems/meta': ok(problemMeta()),
};
