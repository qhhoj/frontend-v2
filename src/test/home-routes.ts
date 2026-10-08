import {
  contestItem,
  leaderboardEntry,
  problemMeta,
  ratingHistory,
  submissionItem,
  userPage,
} from './fixtures';
import { ok, page } from './mock-api';

/** What the home page loads for the signed-in viewer `user_01`, the account a sign-in lands on. */
export const homeRoutes = {
  'GET /users/user_01': ok(userPage()),
  'GET /users/user_01/ratings': ok(ratingHistory()),
  'GET /submissions': page([submissionItem()]),
  'GET /problems/meta': ok(problemMeta()),
  'GET /contests': page([contestItem()]),
  'GET /users': page([leaderboardEntry(1, 'user_07', 2788)]),
};
