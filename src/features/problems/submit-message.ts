/** A translatable message: the key and the placeholders it needs. */
export interface SubmitMessage {
  key: string;
  params?: Record<string, unknown>;
}
