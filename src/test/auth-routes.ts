import { ok } from './mock-api';

/** What every page that renders the social buttons loads. `mockApi` fails on an unmocked request, so each such page's spec spreads this. */
export const socialRoutes = {
  'GET /auth/social/providers': ok({ providers: ['google', 'github'] }),
};
