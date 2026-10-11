/** What a judge row's ⋯ menu asks the page to do: open the drawer, or open one of the confirm dialogs. */
export type JudgeAction = 'details' | 'block' | 'unblock' | 'rotate' | 'disconnect' | 'delete';

/** The actions that confirm first (unblock and details do not). */
export type JudgeDialog = Extract<JudgeAction, 'block' | 'rotate' | 'disconnect' | 'delete'>;
