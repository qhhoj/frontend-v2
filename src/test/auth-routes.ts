import { ok, page } from './mock-api';
import { HOME_COUNTS, organizationItem, problemMeta } from './fixtures';

/** What every page that renders the social buttons loads. `mockApi` fails on an unmocked request, so each such page's spec spreads this. */
export const socialRoutes = {
  'GET /auth/social/providers': ok({ providers: ['google', 'github'] }),
};

/** The auth shell's brand panel (login, register, forgotten password): the site counts. */
export const brandRoutes = { 'GET /home': ok({ counts: HOME_COUNTS }) };

/** What the signup pages load: the open schools and the languages (for the C++17 default), and the brand panel. */
export const registerRoutes = {
  ...brandRoutes,
  'GET /organizations': page([organizationItem()]),
  'GET /problems/meta': ok(problemMeta()),
};

/** What the login screen loads: the social buttons and the brand panel's counts. */
export const loginRoutes = {
  ...socialRoutes,
  ...brandRoutes,
};
