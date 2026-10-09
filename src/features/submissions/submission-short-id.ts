/** Ids are long uuids: the first and last characters tell them apart. Shorter ids are shown whole. */
const ID_HEAD_LENGTH = 6;
const ID_TAIL_LENGTH = 3;

/** a long uuid becomes its first six and last three characters; the submission page's title uses the same rule. */
export const submissionShortId = (id: string): string =>
  id.length <= ID_HEAD_LENGTH + ID_TAIL_LENGTH
    ? `#${id}`
    : `#${id.slice(0, ID_HEAD_LENGTH)}…${id.slice(-ID_TAIL_LENGTH)}`;
