import { shallowReactive } from 'vue';
import type { ScoreScale } from '@/features/problems/submit-result';

/** A submission the viewer sent: followed until its final verdict, wherever the viewer goes meanwhile. */
export interface TrackedSubmission {
  id: string;
  /** The problem showed as solved when the submission was sent. */
  wasSolvedBefore: boolean;
  /** What a score on the problem was out of where the viewer sent it (the contest's scale inside a contest). */
  scale: ScoreScale;
}

/** In send order. The shell follows each one (VerdictToastWatcher); the problem page adds them. */
export const trackedSubmissions = shallowReactive(new Map<string, TrackedSubmission>());
/** Ids whose result the viewer is looking at now (the open result strip), set by the page that shows it. */
export const submissionsOnScreen = shallowReactive(new Set<string>());
/** Problems whose first solve already got its Bit in this tab. */
export const celebratedProblems = new Set<string>();

export const trackSubmission = (entry: TrackedSubmission) =>
  void trackedSubmissions.set(entry.id, entry);
export const untrackSubmission = (id: string) => void trackedSubmissions.delete(id);
