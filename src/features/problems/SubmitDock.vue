<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { computed, ref, toRef } from 'vue';
import { useRoute } from 'vue-router';
import type { ProblemDetail } from '@/api/types/problems';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useSessionStore } from '@/stores/session.store';
import SubmitForm from './SubmitForm.vue';
import SubmitSheet from './SubmitSheet.vue';
import SubmitSignInLink from './SubmitSignInLink.vue';
import { useDockHeight } from './use-dock-height';
import { useSubmitForm } from './use-submit-form';

const BODY_ID = 'submit-dock-body';
const props = defineProps<{ problem: ProblemDetail }>();
/** The phone gets a bottom sheet, anything wider the pinned dock; both share one form state. */
const isPhone = useMediaQuery(PHONE_QUERY);
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
</script>

<template>
  <SubmitSheet
    v-if="isPhone"
    :problem="problem"
    :form="form"
    :is-signed-in="isSignedIn"
    :resubmit-id="resubmitId"
  />
  <section
    v-else
    ref="dock"
    :aria-label="$t('submit.title')"
    class="fixed inset-x-0 bottom-0 z-30 border-t border-line-accent bg-surface-solid pb-[env(safe-area-inset-bottom)]"
  >
    <div class="mx-auto max-h-[70dvh] max-w-[920px] overflow-x-hidden overflow-y-auto px-4 py-3">
      <SubmitSignInLink v-if="!isSignedIn" />
      <SubmitForm
        v-else
        :id="BODY_ID"
        :problem="problem"
        :form="form"
        layout="dock"
        :collapsed="isCollapsed"
      >
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
