import { ref, watch } from 'vue';
import type { VoteResponse, VoteScore } from '@/api/types/votes';
import { nextVote, scoreAfterVote, voteRefusalKey } from './vote-rules';

interface VoteState {
  score: number;
  viewerVote: VoteScore;
}

/** The shown score and vote: changed at once on a press, replaced by the server's answer, restored on a refusal. */
export function useVote(
  source: () => VoteState,
  send: (score: VoteScore) => Promise<VoteResponse>,
) {
  const score = ref(source().score);
  const viewerVote = ref<VoteScore>(source().viewerVote);
  const errorKey = ref<string | null>(null);
  const isPending = ref(false);
  watch(source, (next) => {
    score.value = next.score;
    viewerVote.value = next.viewerVote;
  });

  async function cast(pressed: 1 | -1): Promise<boolean> {
    const before = { score: score.value, viewerVote: viewerVote.value };
    const wanted = nextVote(before.viewerVote, pressed);
    score.value = scoreAfterVote(before.score, before.viewerVote, wanted);
    viewerVote.value = wanted;
    errorKey.value = null;
    isPending.value = true;
    try {
      const answer = await send(wanted);
      score.value = answer.score;
      viewerVote.value = answer.viewerVote;
      return true;
    } catch (error) {
      score.value = before.score;
      viewerVote.value = before.viewerVote;
      errorKey.value = voteRefusalKey(error);
      return false;
    } finally {
      isPending.value = false;
    }
  }
  return { score, viewerVote, cast, errorKey, isPending };
}
