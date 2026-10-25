<script setup lang="ts">
import { computed, ref } from 'vue';
import { ApiError } from '@/api/client';
import { createShortLink } from '@/api/short-links.api';
import type { CreatedShortLink } from '@/api/types/short-links';
import { CircleCheck } from 'lucide-vue-next';
import CopyButton from '@/components/CopyButton.vue';
import { shortLinkUrl } from '@/features/short-links/short-link-path';
import { translate } from '@/i18n';
import AdminField from '../ui/AdminField.vue';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf, isConflict } from '../ui/admin-errors';
import { BUTTON, CARD, INPUT } from '../ui/controls';
import { fromLocalInput } from '../ui/datetime';
import { useAdminMutation } from '../ui/use-admin-mutation';
import { shortLinksKey } from './short-links.queries';

const path = ref('');
const code = ref('');
const expires = ref('');
const created = ref<CreatedShortLink | null>(null);
const isExpiryPast = ref(false);
const create = useAdminMutation<void, CreatedShortLink>({
  mutate: () =>
    createShortLink({
      path: path.value.trim(),
      code: code.value.trim() || undefined,
      expiresAt: fromLocalInput(expires.value) ?? undefined,
    }),
  invalidates: () => [shortLinksKey],
  onDone: (link) => {
    created.value = link;
    path.value = '';
    code.value = '';
    expires.value = '';
  },
});
/** The backend raises `invalid` with an English message: the SPA text by (field, code); other codes go through `adminIssueText` (`fieldErrors`). */
function refusedText(field: string, refusedKey: string): string | undefined {
  const failure = create.failure.value;
  const isRefused =
    failure instanceof ApiError &&
    failure.issues.some((item) => item.field === field && item.code === 'invalid');
  return isRefused ? translate(refusedKey) : create.fieldErrors.value[field];
}
/** A taken code is a 409 with no issue: it belongs on the code field all the same. */
const codeError = computed(() =>
  isConflict(create.failure.value)
    ? translate('admin.shortlinks.form.codeTaken')
    : refusedText('code', 'admin.shortlinks.form.codeReserved'),
);
const pageFailure = computed(() => {
  const failure = create.failure.value;
  const hasFieldError = Object.keys(create.fieldErrors.value).length > 0;
  return failure && !isConflict(failure) && !hasFieldError ? failureTextOf(failure) : null;
});
/** A link that is dead on arrival is a slip: refused here before sending; the backend refuses it too (`invalid` on `expiresAt`). */
function isPast(local: string): boolean {
  const instant = fromLocalInput(local);
  return instant !== null && new Date(instant).getTime() <= Date.now();
}
function submit() {
  created.value = null;
  isExpiryPast.value = isPast(expires.value);
  if (!isExpiryPast.value) void create.run();
}
const expiresError = computed(() =>
  isExpiryPast.value
    ? translate('admin.shortlinks.form.expiresPast')
    : refusedText('expiresAt', 'admin.shortlinks.form.expiresPast'),
);
</script>

<template>
  <div :class="[CARD, 'p-4 sm:p-5']">
    <form
      data-testid="short-link-form"
      class="flex flex-col gap-4"
      novalidate
      @submit.prevent="submit"
    >
      <h2 class="font-display text-base font-semibold">{{ $t('admin.shortlinks.form.title') }}</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          input-id="short-link-path"
          :label="$t('admin.shortlinks.form.path')"
          :hint="$t('admin.shortlinks.form.pathHint')"
          :error="refusedText('path', 'admin.shortlinks.form.pathRefused')"
        >
          <input
            :id="id"
            v-model="path"
            type="text"
            spellcheck="false"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            :class="`${INPUT} font-mono`"
          />
        </AdminField>
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          input-id="short-link-code"
          :label="$t('admin.shortlinks.form.code')"
          :hint="$t('admin.shortlinks.form.codeHint')"
          :error="codeError"
        >
          <input
            :id="id"
            v-model="code"
            type="text"
            spellcheck="false"
            autocapitalize="off"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            :class="`${INPUT} font-mono`"
          />
        </AdminField>
        <AdminField
          v-slot="{ id, describedBy, invalid }"
          input-id="short-link-expires"
          :label="$t('admin.shortlinks.form.expires')"
          :hint="$t('admin.shortlinks.form.expiresHint')"
          :error="expiresError"
        >
          <input
            :id="id"
            v-model="expires"
            type="datetime-local"
            :aria-describedby="describedBy"
            :aria-invalid="invalid ? 'true' : undefined"
            :class="INPUT"
          />
        </AdminField>
      </div>
      <div>
        <button
          type="submit"
          :class="BUTTON.primary"
          :aria-disabled="create.isPending.value || undefined"
        >
          {{ $t('admin.shortlinks.form.submit') }}
        </button>
      </div>
      <div
        v-if="created"
        role="status"
        data-testid="short-link-created"
        class="flex flex-wrap items-center gap-2 text-sm"
      >
        <CircleCheck
          aria-hidden="true"
          class="size-4 shrink-0 text-positive"
          :stroke-width="1.75"
        />
        <span>{{ $t('admin.shortlinks.form.created', { code: created.code }) }}</span>
        <CopyButton :text="shortLinkUrl(created.code)" :label="$t('admin.shortlinks.form.copy')" />
      </div>
      <AdminStatus v-if="pageFailure" kind="refused" :text="pageFailure" />
    </form>
  </div>
</template>
