<script setup lang="ts">
import { computed, ref } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import StateBit from '@/components/StateBit.vue';
import StatePanel from '@/components/StatePanel.vue';
import AppButton from '@/components/ui/AppButton.vue';
import FormField from '@/components/ui/FormField.vue';
import TextArea from '@/components/ui/TextArea.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { translate } from '@/i18n';
import { useNewTicket } from './use-new-ticket';
import type { TicketDraft } from './ticket-draft';

const KIND_OPTIONS = [
  { value: 'problem', titleKey: 'tickets.new.problemKind', bodyKey: 'tickets.new.problemKindBody' },
  { value: 'general', titleKey: 'tickets.new.generalKind', bodyKey: 'tickets.new.generalKindBody' },
] as const;

const form = ref<HTMLFormElement | null>(null);
const { draft, problemName, problemMissing, panelFailure, isPending, issueKeyOf, submit } =
  useNewTicket(form);

const errorText = (field: keyof TicketDraft) => {
  const key = issueKeyOf(field);
  return key ? translate(key, { code: draft.problemCode.trim() }) : undefined;
};
const trimmedCode = computed(() => draft.problemCode.trim());
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
    <p class="text-meta text-muted">
      <RouterLink :to="{ name: 'tickets' }" class="hover:underline">{{
        $t('tickets.title')
      }}</RouterLink>
      <span aria-hidden="true"> / </span>
      <span>{{ $t('tickets.new.breadcrumb') }}</span>
    </p>
    <div class="grid gap-6 lg:grid-cols-[1fr_300px]">
      <GlassCard as="section" class="p-6 sm:p-8">
        <div class="flex items-center gap-4">
          <StateBit variant="writing" size="inline" />
          <h1 class="page-title">
            {{ $t('tickets.newTicket') }}
          </h1>
        </div>
        <form ref="form" novalidate class="mt-6 flex flex-col gap-5" @submit.prevent="submit">
          <fieldset class="flex flex-col gap-3">
            <legend class="mb-2 text-sm font-semibold">{{ $t('tickets.new.about') }}</legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <label
                v-for="option in KIND_OPTIONS"
                :key="option.value"
                class="flex cursor-pointer flex-col gap-1 rounded-row border p-4"
                :class="
                  draft.kind === option.value ? 'border-accent bg-accent-soft' : 'border-line'
                "
              >
                <span class="flex items-center gap-2 font-semibold">
                  <input v-model="draft.kind" type="radio" name="kind" :value="option.value" />
                  {{ $t(option.titleKey) }}
                </span>
                <span class="text-meta text-muted">{{ $t(option.bodyKey) }}</span>
              </label>
            </div>
          </fieldset>

          <template v-if="draft.kind === 'problem'">
            <!-- The lookup line also describes the code field. -->
            <FormField
              input-id="problemCode"
              :label="$t('tickets.new.problemCode')"
              :error="errorText('problemCode')"
              described-by="problem-lookup"
            >
              <TextInput v-model="draft.problemCode" name="problemCode" autocomplete="off" />
            </FormField>
            <p id="problem-lookup" aria-live="polite" class="min-h-6 text-meta text-muted">
              <template v-if="problemName">{{
                $t('tickets.new.problemName', { name: problemName })
              }}</template>
              <template v-else-if="problemMissing">{{
                $t('tickets.new.problemMissing', { code: trimmedCode })
              }}</template>
            </p>
          </template>
          <FormField
            v-else
            input-id="issueUrl"
            :label="$t('tickets.new.url')"
            :hint="$t('tickets.new.urlHint')"
            :error="errorText('issueUrl')"
          >
            <TextInput v-model="draft.issueUrl" name="issueUrl" type="url" autocomplete="off" />
          </FormField>

          <FormField input-id="title" :label="$t('tickets.new.title')" :error="errorText('title')">
            <TextInput v-model="draft.title" name="title" />
          </FormField>

          <FormField input-id="body" :label="$t('tickets.new.body')" :error="errorText('body')">
            <TextArea v-model="draft.body" name="body" rows="8" class="min-h-40" />
          </FormField>

          <StatePanel
            v-if="panelFailure"
            kind="error"
            :title="$t(panelFailure.titleKey)"
            :body="$t(panelFailure.bodyKey, panelFailure.bodyParams ?? {})"
          />
          <div class="flex flex-wrap items-center justify-end gap-3">
            <AppButton :to="{ name: 'tickets' }">{{ $t('tickets.new.cancel') }}</AppButton>
            <AppButton type="submit" tone="primary" :loading="isPending">
              {{ $t('tickets.new.submit') }}
            </AppButton>
          </div>
        </form>
      </GlassCard>

      <GlassCard as="aside" class="h-fit p-6">
        <h2 class="font-display text-base font-bold">{{ $t('tickets.new.before') }}</h2>
        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
          <li>
            <RouterLink
              :to="{ name: 'tickets', query: { scope: 'all', open: '1' } }"
              class="text-content underline"
            >
              {{ $t('tickets.new.checkOpen') }}
            </RouterLink>
          </li>
          <li>{{ $t('tickets.new.describe') }}</li>
        </ul>
      </GlassCard>
    </div>
  </div>
</template>
