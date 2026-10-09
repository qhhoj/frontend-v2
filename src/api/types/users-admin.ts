import type { QueryOf } from '../typed';
import type { Schemas } from '../schemas';

export type StaffUser = Schemas['StaffUserResponse'];

/** `banned` true is banned only, false is not banned only, unset is everyone; `sort` unset is the server's order. */
export type StaffUserQuery = Omit<QueryOf<'/admin/users'>, 'pageSize'>;
