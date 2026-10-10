<script setup lang="ts">
import { computed, ref } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import StateBit from '@/components/StateBit.vue';
import StatePanel from '@/components/StatePanel.vue';
import { translate } from '@/i18n';
import { useNewTicket } from './use-new-ticket';
import type { TicketDraft } from './ticket-draft';

const KIND_OPTIONS = [
  { value: 'problem', titleKey: 'tickets.new.problemKind', bodyKey: 'tickets.new.problemKindBody' },
  { value: 'general', titleKey: 'tickets.new.generalKind', bodyKey: 'tickets.new.generalKindBody' },
] as const;
const INPUT =
  'min-h-11 w-full rounded-lg border bg-surface px-3.5 text-base text-content placeholder:text-muted';
const FIELD = 'flex flex-col gap-1.5 text-sm font-medium';
const ERROR = 'text-[13px] text-negative';

const form = ref<HTMLFormElement | null>(null);
const { draft, problemName, problemMissing, panelFailure, isPending, issueKeyOf, submit } =
  useNewTicket(form);

/** The one field whose target the kind picks: a problem code, or a page link. */
const targetField = computed<keyof TicketDraft>(() =>
  draft.kind === 'problem' ? 'problemCode' : 'issueUrl',
);
const hasError = (field: keyof TicketDraft) => issueKeyOf(field) !== undefined;
const invalid = (field: keyof TicketDraft) => (hasError(field) ? 'true' : undefined);
const errorId = (field: keyof TicketDraft) => (hasError(field) ? `${field}-error` : undefined);
const borderFor = (field: keyof TicketDraft) =>
  hasError(field) ? 'border-negative' : 'border-line';
const errorText = (field: keyof TicketDraft) => {
  const key = issueKeyOf(field);
  return key ? translate(key, { code: draft.problemCode.trim() }) : undefined;
};
const trimmedCode = computed(() => draft.problemCode.trim());
/** The lookup line describes the code field; the field error (when any) joins it. */
const problemCodeDescribedBy = computed(() =>
  ['problem-lookup', errorId('problemCode')].filter(Boolean).join(' '),
);
const SUBMIT = 'inline-flex min-h-11 items-center rounded-pill px-6 font-semibold';
/** A busy submit keeps its shape and changes colour only (token colours, no opacity). */
const IDLE = 'bg-accent text-on-accent';
const BUSY = 'cursor-progress bg-accent-soft text-accent-soft-text';
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
    <p class="text-[13px] text-muted">
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
                class="flex cursor-pointer flex-col gap-1 rounded-xl border p-4"
                :class="
                  draft.kind === option.value ? 'border-accent bg-accent-soft' : 'border-line'
                "
              >
                <span class="flex items-center gap-2 font-semibold">
                  <input v-model="draft.kind" type="radio" name="kind" :value="option.value" />
                  {{ $t(option.titleKey) }}
                </span>
                <span class="text-[13px] text-muted">{{ $t(option.bodyKey) }}</span>
              </label>
            </div>
          </fieldset>

          <template v-if="draft.kind === 'problem'">
            <label :class="FIELD">
              {{ $t('tickets.new.problemCode') }}
              <input
                v-model="draft.problemCode"
                name="problemCode"
                type="text"
                autocomplete="off"
                :class="[INPUT, borderFor('problemCode')]"
                :aria-invalid="invalid('problemCode')"
                :aria-describedby="problemCodeDescribedBy"
              />
            </label>
            <p id="problem-lookup" aria-live="polite" class="min-h-6 text-[13px] text-muted">
              <template v-if="problemName">{{
                $t('tickets.new.problemName', { name: problemName })
              }}</template>
              <template v-else-if="problemMissing">{{
                $t('tickets.new.problemMissing', { code: trimmedCode })
              }}</template>
            </p>
          </template>
          <label v-else :class="FIELD">
            {{ $t('tickets.new.url') }}
            <input
              v-model="draft.issueUrl"
              name="issueUrl"
              type="url"
              autocomplete="off"
              :class="[INPUT, borderFor('issueUrl')]"
              :aria-invalid="invalid('issueUrl')"
              :aria-describedby="errorId('issueUrl')"
            />
            <span class="text-[13px] font-normal text-muted">{{ $t('tickets.new.urlHint') }}</span>
          </label>
          <p v-if="errorText(targetField)" :id="errorId(targetField)" :class="ERROR">
            {{ errorText(targetField) }}
          </p>

          <label :class="FIELD">
            {{ $t('tickets.new.title') }}
            <input
              v-model="draft.title"
              name="title"
              type="text"
              :class="[INPUT, borderFor('title')]"
              :aria-invalid="invalid('title')"
              :aria-describedby="errorId('title')"
            />
          </label>
          <p v-if="errorText('title')" :id="errorId('title')" :class="ERROR">
            {{ errorText('title') }}
          </p>

          <label :class="FIELD">
            {{ $t('tickets.new.body') }}
            <textarea
              v-model="draft.body"
              name="body"
              rows="8"
              :class="[INPUT, 'min-h-40 py-2.5', borderFor('body')]"
              :aria-invalid="invalid('body')"
              :aria-describedby="errorId('body')"
            />
          </label>
          <p v-if="errorText('body')" :id="errorId('body')" :class="ERROR">
            {{ errorText('body') }}
          </p>

          <StatePanel
            v-if="panelFailure"
            kind="error"
            :title="$t(panelFailure.titleKey)"
            :body="$t(panelFailure.bodyKey, panelFailure.bodyParams ?? {})"
          />
          <div class="flex flex-wrap items-center justify-end gap-3">
            <RouterLink
              :to="{ name: 'tickets' }"
              class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
            >
              {{ $t('tickets.new.cancel') }}
            </RouterLink>
            <button
              type="submit"
              :aria-busy="isPending ? 'true' : undefined"
              :class="[SUBMIT, isPending ? BUSY : IDLE]"
            >
              {{ $t('tickets.new.submit') }}
            </button>
          </div>
        </form>
      </GlassCard>

      <GlassCard as="aside" class="h-fit p-6">
        <h2 class="font-display text-base font-bold">{{ $t('tickets.new.before') }}</h2>
        <ul class="mt-3 list-disc space-y-2 pl-5 text-[15px] text-muted">
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
