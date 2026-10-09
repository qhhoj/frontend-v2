import { ref } from 'vue';
import { mintFeedKey, releaseFeedKey, revokeFeedKey } from '@/api/contest-ops.api';
import type { MintedFeedKey, MintFeedKeyBody } from '@/api/types/contest-ops';
import { useViewerId } from '@/stores/use-viewer-id';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { feedKeyStatusKey } from '../contest-ops.queries';

/**
 * Mint, revoke and release. The minted key is kept only in `minted` (never in the query cache) until `forgetMinted`,
 * which the reveal dialog calls when it closes: the key is shown once.
 */
export function useFeedKeyActions(contestKey: () => string) {
  const viewer = useViewerId();
  const invalidates = () => [feedKeyStatusKey(contestKey(), viewer.value)];
  const minted = ref<MintedFeedKey | null>(null);
  const mint = useAdminMutation({
    mutate: (body: MintFeedKeyBody) => mintFeedKey(contestKey(), body),
    invalidates,
    onDone: (key: MintedFeedKey) => {
      minted.value = key;
    },
  });
  const revoke = useAdminMutation({ mutate: () => revokeFeedKey(contestKey()), invalidates });
  const release = useAdminMutation({ mutate: () => releaseFeedKey(contestKey()), invalidates });
  function forgetMinted() {
    minted.value = null;
    mint.reset();
  }
  return { mint, revoke, release, minted, forgetMinted };
}
