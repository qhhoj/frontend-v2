<script setup lang="ts">
import { ChevronDown, ChevronUp, LogIn } from 'lucide-vue-next';
import { computed, ref, toRef } from 'vue';
import { useRoute } from 'vue-router';
import type { ProblemDetail } from '@/api/types/problems';
import { safeRedirect } from '@/router/safe-redirect';
import { useSessionStore } from '@/stores/session.store';
import SubmitForm from './SubmitForm.vue';
import { useDockHeight } from './use-dock-height';
import { useSubmitForm } from './use-submit-form';

const BODY_ID = 'submit-dock-body';
const props = defineProps<{ problem: ProblemDetail }>();
const route = useRoute();
const session = useSessionStore();
const isSignedIn = computed(() => session.status === 'authenticated');
// An anonymous viewer would only get a 401 for the fetch, so it is not started.
const resubmitId = computed(() =>
  isSignedIn.value && typeof route.query.resubmit === 'string' ? route.query.resubmit : null,
);
const form = useSubmitForm(toRef(props, 'problem'), resubmitId);
/** Per page load: no storage. */
const isCollapsed = ref(false);
const dock = ref<HTMLElement | null>(null);
useDockHeight(dock);
const signInTarget = computed(() => ({
  path: '/login',
  query: { redirect: safeRedirect(route.fullPath) },
}));
</script>

<template>
  <section
    ref="dock"
    :aria-label="$t('submit.title')"
    class="fixed inset-x-0 bottom-0 z-30 border-t border-line-accent bg-surface-solid pb-[env(safe-area-inset-bottom)]"
  >
    <div class="mx-auto max-h-[70dvh] max-w-[920px] overflow-x-hidden overflow-y-auto px-4 py-3">
      <RouterLink
        v-if="!isSignedIn"
        :to="signInTarget"
        class="flex h-11 items-center justify-center gap-2 font-display font-semibold text-accent"
      >
        <LogIn class="size-5" aria-hidden="true" />
        {{ $t('submit.signIn') }}
      </RouterLink>
      <SubmitForm v-else :id="BODY_ID" :problem="problem" :form="form" :collapsed="isCollapsed">
        <template #actions>
          <button
            type="button"
            :aria-expanded="!isCollapsed"
            :aria-controls="BODY_ID"
            :aria-label="$t(isCollapsed ? 'submit.expand' : 'submit.collapse')"
            class="flex size-11 items-center justify-center rounded-pill border border-line bg-surface hover:bg-surface-hover"
            @click="isCollapsed = !isCollapsed"
          >
            <ChevronUp v-if="isCollapsed" class="size-5" aria-hidden="true" />
            <ChevronDown v-else class="size-5" aria-hidden="true" />
          </button>
        </template>
      </SubmitForm>
    </div>
  </section>
</template>
