<script setup lang="ts">
import { ArrowDown, ArrowUp, Building2, X } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { ProfileOrganization } from '@/api/types/profile';
import { translate } from '@/i18n';
import OfficialLockNote from '@/features/official-mode/OfficialLockNote.vue';
import { useOfficialLock } from '@/features/official-mode/use-official-lock';
import SettingsCard from '../settings/SettingsCard.vue';
import { moveItem, withoutItem } from './organization-order';
import { profileFieldId } from './profile-field-ids';

/** Board SetProfile "Tổ chức": reorder or leave; joining happens on the organization pages. */
const props = withDefaults(
  defineProps<{ organizations: ProfileOrganization[]; error?: string }>(),
  {
    error: undefined,
  },
);
const ids = defineModel<string[]>({ required: true });
const list = ref<HTMLElement | null>(null);
/** The browse link never leaves, so it is where focus goes when the list has no row left to hold it. */
const browseLink = ref<{ $el: HTMLElement } | null>(null);
const announcement = ref('');
/** Official contest: the order and the leave buttons are locked (B8 locks organization order and leave). */
const lock = useOfficialLock();
const describedBy = computed(() => (lock.isLocked.value ? lock.noteId : undefined));
/** Rows follow the chosen id order; an id the server no longer lists (after a reload) shows no row. */
const rows = computed(() =>
  ids.value.flatMap((id) => props.organizations.filter((organization) => organization.id === id)),
);
const ICON_BUTTON =
  'scroll-mb-28 flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface-solid hover:bg-surface-hover aria-disabled:cursor-not-allowed aria-disabled:border-line aria-disabled:text-muted';

/** Acts on the id, not the row index, so a row the list does not show can never be moved by mistake. */
function move(organization: ProfileOrganization, offset: -1 | 1) {
  if (lock.isLocked.value) return;
  const position = ids.value.indexOf(organization.id);
  const target = position + offset;
  if (target < 0 || target >= ids.value.length) return;
  ids.value = moveItem(ids.value, position, offset);
  announcement.value = translate('settings.organizations.moved', {
    name: organization.name,
    position: target + 1,
  });
}

function leave(organization: ProfileOrganization) {
  if (lock.isLocked.value) return;
  const remaining = withoutItem(ids.value, ids.value.indexOf(organization.id));
  ids.value = remaining;
  announcement.value = translate('settings.organizations.left', { name: organization.name });
  // The list leaves the page with its last row; focus must not fall to the body.
  if (remaining.length) list.value?.focus();
  else browseLink.value?.$el.focus();
}
</script>

<template>
  <SettingsCard
    :title="$t('settings.organizations.title')"
    :lead="$t('settings.organizations.lead')"
  >
    <ul
      v-if="rows.length"
      :id="profileFieldId('organizations')"
      ref="list"
      tabindex="-1"
      :aria-label="$t('settings.organizations.list')"
      class="m-0 flex list-none flex-col p-0"
    >
      <li
        v-for="(organization, index) in rows"
        :key="organization.id"
        class="flex flex-wrap items-center gap-3.5 border-t border-line py-3.5 first:border-t-0"
      >
        <span
          aria-hidden="true"
          class="flex size-10 shrink-0 items-center justify-center rounded-cell bg-accent-soft text-accent-text"
        >
          <Building2 class="size-[18px]" />
        </span>
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <strong class="font-semibold">{{ organization.name }}</strong>
          <span class="flex flex-wrap items-center gap-2 text-xs">
            <span class="font-mono text-muted">{{ organization.shortName }}</span>
            <span
              v-if="index === 0"
              class="rounded-pill bg-accent-soft px-2.5 py-0.5 font-semibold text-accent-soft-text"
            >
              {{ $t('settings.organizations.shownBesideName') }}
            </span>
            <span
              v-if="organization.isAdmin"
              class="rounded-pill bg-verdict-pending-bg px-2.5 py-0.5 font-semibold text-verdict-pending"
            >
              {{ $t('settings.organizations.admin') }}
            </span>
          </span>
        </span>
        <span class="flex gap-1.5">
          <button
            type="button"
            :class="ICON_BUTTON"
            :aria-label="$t('settings.organizations.up', { name: organization.name })"
            :aria-disabled="lock.isLocked.value || index === 0"
            :aria-describedby="describedBy"
            @click="move(organization, -1)"
          >
            <ArrowUp aria-hidden="true" class="size-[18px]" />
          </button>
          <button
            type="button"
            :class="ICON_BUTTON"
            :aria-label="$t('settings.organizations.down', { name: organization.name })"
            :aria-disabled="lock.isLocked.value || index === rows.length - 1"
            :aria-describedby="describedBy"
            @click="move(organization, 1)"
          >
            <ArrowDown aria-hidden="true" class="size-[18px]" />
          </button>
          <button
            v-if="!organization.isAdmin"
            type="button"
            :class="[ICON_BUTTON, 'text-negative']"
            :aria-label="$t('settings.organizations.leave', { name: organization.name })"
            v-bind="lock.lockAttrs.value"
            @click="leave(organization)"
          >
            <X aria-hidden="true" class="size-[18px]" />
          </button>
        </span>
        <p v-if="organization.isAdmin" class="w-full text-[13px] text-muted">
          {{ $t('settings.organizations.adminNote') }}
        </p>
      </li>
    </ul>
    <p v-else class="text-sm text-muted">{{ $t('settings.organizations.empty') }}</p>
    <OfficialLockNote v-if="lock.isLocked.value && rows.length" :id="lock.noteId" />
    <p v-if="error" class="text-[13px] text-negative" role="alert">{{ error }}</p>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
    <!-- With no row the anchor sits on this link, so the error summary's link to the organizations always has a target. -->
    <RouterLink
      :id="rows.length ? undefined : profileFieldId('organizations')"
      ref="browseLink"
      :to="{ name: 'organizations' }"
      class="inline-flex min-h-11 items-center self-start font-semibold text-accent-text"
    >
      {{ $t('settings.organizations.browse') }}
    </RouterLink>
  </SettingsCard>
</template>
