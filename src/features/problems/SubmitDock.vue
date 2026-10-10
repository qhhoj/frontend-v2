<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { ProblemDetail } from '@/api/types/problems';
import SubmitForm from './SubmitForm.vue';
import SubmitSheet from './SubmitSheet.vue';
import SubmitSignInLink from './SubmitSignInLink.vue';
import { useDockHeight } from './use-dock-height';
import type { useSubmitForm } from './use-submit-form';

const BODY_ID = 'submit-dock-body';
/** The phone gets a bottom sheet, anything wider the pinned dock; both share the form state the page owns. */
defineProps<{
  problem: ProblemDetail;
  form: ReturnType<typeof useSubmitForm>;
  isPhone: boolean;
  isSignedIn: boolean;
  resubmitId: string | null;
}>();
/** Whether the editor shows (dock expanded, sheet open); the rail's submit card can open it too. */
const open = defineModel<boolean>('open', { required: true });
const isCollapsed = computed({
  get: () => !open.value,
  set: (collapsed) => (open.value = !collapsed),
});
const dock = ref<HTMLElement | null>(null);
useDockHeight(dock);
</script>

<template>
  <SubmitSheet
    v-if="isPhone"
    v-model:open="open"
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
    <div class="mx-auto max-h-[70dvh] max-w-[920px] overflow-x-hidden overflow-y-auto px-4 py-2">
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
