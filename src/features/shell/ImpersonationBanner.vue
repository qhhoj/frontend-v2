<script setup lang="ts">
import { Eye } from 'lucide-vue-next';
import { useAuthAction } from '@/features/auth/use-auth-action';
import { useSessionStore } from '@/stores/session.store';

/** On top of every page while a staff member views as another user (board SetImpersonation): deep amber, apart from the brand colour, sticky. */
const session = useSessionStore();
const { pending, summary, run } = useAuthAction();
// The account cache is cleared by `useAccountCacheSync` when the user changes; the page refetches as the staff account.
const stop = () => run(() => session.stopImpersonating());
</script>

<template>
  <div
    v-if="session.impersonatorId && session.user"
    role="region"
    :aria-label="$t('impersonation.region')"
    class="sticky top-0 z-40 flex min-h-14 flex-wrap items-center gap-x-3.5 gap-y-1 bg-caution-strong px-4 py-2 text-sm text-on-caution-strong md:px-8"
  >
    <Eye aria-hidden="true" class="size-[18px] shrink-0" />
    <p class="m-0 min-w-0 flex-1">
      <strong>{{ $t('impersonation.title') }}</strong>
      {{ $t('impersonation.body', { username: session.user.username }) }}
    </p>
    <button
      type="button"
      class="min-h-11 rounded-pill border border-on-caution-strong px-4 font-semibold"
      :aria-disabled="pending"
      @click="pending || stop()"
    >
      {{ $t('impersonation.stop') }}
    </button>
    <p v-if="summary" role="alert" class="m-0 w-full font-semibold">{{ summary }}</p>
  </div>
</template>
