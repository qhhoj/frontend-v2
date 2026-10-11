/** What a drawer tab's form exposes (`defineExpose`) so the drawer footer can save it. */
export interface DrawerForm {
  formId: string;
  saveLabel: string;
  dirtyCount: number;
  isPending: boolean;
  savedAt: Date | null;
  discard: () => void;
}
