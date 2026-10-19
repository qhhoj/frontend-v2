<script setup lang="ts">
import { computed, useId, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Lock } from 'lucide-vue-next';
import OrganizationLogo from '@/features/organizations/OrganizationLogo.vue';
import { INPUT } from '../ui/controls';
import CreationOwnerNotice from './CreationOwnerNotice.vue';
import { useCreationOwnersQuery, initialOwner } from './creation-owners';
import type { CreationOwner } from './creation-owners';
import { useCreationScope } from './creation-scope';
import type { CreationKind } from './creation-scope';

/**
 * Who owns the new problem or contest. Radio chips for a few organizations, a select for many, a fixed line when there is
 * one choice, a notice (why, and where to go) when there is none; nothing for a viewer with no creation scope. The form
 * beside it learns the outcome through `ready` and `blocked` and says why it cannot be submitted. The organizations are the ones the backend says the viewer may create this kind in; "Không thuộc tổ chức" only for site-wide
 * creators. `layout`: `strip` is one wrapping row above the form; `field` is a labelled field inside the form card, where a
 * site-wide creator always gets the select.
 */
const props = withDefaults(defineProps<{ kind: CreationKind; layout?: 'strip' | 'field' }>(), {
  layout: 'strip',
});
const owner = defineModel<CreationOwner | null>({ required: true });
/** False until the owners are known, and while there is nowhere to create, so the form waits instead of posting to the wrong place. */
const isReady = defineModel<boolean>('ready', { default: false });
/** True once the owners are known and the viewer has nowhere to create, so the form says why next to its submit (not while loading). */
const isBlocked = defineModel<boolean>('blocked', { default: false });
const route = useRoute();
const { scope, canCreate: isOffered } = useCreationScope(props.kind);
const owners = useCreationOwnersQuery(props.kind);
const options = computed(() => owners.data.value ?? []);
const isLoading = computed(() => scope.value.organizations && owners.isPending.value);
const choiceCount = computed(() => options.value.length + (scope.value.site ? 1 : 0));
/**
 * What the picker has to explain: the first read failed (a refetch that fails keeps the list it has), or the list is empty
 * and the viewer has no site-wide choice either.
 */
const notice = computed<'failed' | 'none' | null>(() => {
  if (owners.isError.value && owners.data.value === undefined) return 'failed';
  return !isLoading.value && choiceCount.value === 0 ? 'none' : null;
});
const SITE = '';
const MAX_CARDS = 6;
const OWNER_CARD =
  'flex min-h-10 min-w-0 cursor-pointer items-center gap-2 rounded-row border border-line-control bg-surface-solid px-3 py-1.5 has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:ring-1 has-[:checked]:ring-accent';
const groupId = useId();

const requestedSlug = computed(() =>
  typeof route.query.organization === 'string' ? route.query.organization : null,
);
watch(
  [options, isLoading],
  () => {
    if (isLoading.value) return;
    if (!isReady.value)
      owner.value = initialOwner(options.value, requestedSlug.value, scope.value.site);
    isReady.value = choiceCount.value > 0;
    isBlocked.value = isOffered.value && !isReady.value;
  },
  { immediate: true },
);

const selectedSlug = computed({
  get: () => owner.value?.slug ?? SITE,
  set: (slug: string) => {
    owner.value = options.value.find((option) => option.slug === slug) ?? null;
  },
});
/** The field layout offers a site-wide creator a select once there is an organization to pick. */
const isSelect = computed(
  () =>
    options.value.length > MAX_CARDS ||
    (props.layout === 'field' && scope.value.site && options.value.length > 0),
);
const ownerHint = computed(() => {
  if (owner.value) return 'admin.creation.owner.privateHint';
  return props.layout === 'field' && isSelect.value
    ? 'admin.creation.owner.chooseHint'
    : 'admin.creation.owner.siteHint';
});
</script>

<template>
  <fieldset
    v-if="isOffered"
    class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2"
    data-testid="creation-owner"
  >
    <legend class="sr-only">{{ $t('admin.creation.owner.label') }}</legend>
    <span
      aria-hidden="true"
      class="text-sm font-semibold"
      :class="layout === 'field' && 'w-full'"
      >{{ $t('admin.creation.owner.label') }}</span
    >
    <span v-if="isLoading" class="text-sm text-muted">{{
      $t('admin.creation.owner.loading')
    }}</span>
    <template v-else-if="choiceCount === 1">
      <span class="flex min-w-0 items-center gap-2">
        <template v-if="owner">
          <OrganizationLogo :organization="owner" />
          <b class="truncate">{{ owner.name }}</b>
          <span class="text-muted">· {{ $t('admin.creation.owner.orgPrivate') }}</span>
        </template>
        <b v-else>{{ $t('admin.creation.owner.site') }}</b>
      </span>
      <span class="inline-flex items-center gap-1 text-sm text-muted">
        <Lock class="size-3.5" aria-hidden="true" />{{ $t('admin.creation.owner.fixed') }}
      </span>
    </template>
    <select
      v-else-if="isSelect"
      v-model="selectedSlug"
      :class="[INPUT, layout === 'field' ? 'w-full lg:w-1/2' : 'w-auto max-w-full']"
      :aria-label="$t('admin.creation.owner.label')"
    >
      <option v-if="scope.site" :value="SITE">{{ $t('admin.creation.owner.site') }}</option>
      <option v-for="option in options" :key="option.slug" :value="option.slug">
        {{ option.name }} ({{ option.problemCodePrefix }}…)
      </option>
    </select>
    <template v-else-if="choiceCount > 1">
      <label v-for="option in options" :key="option.slug" :class="OWNER_CARD">
        <input
          v-model="selectedSlug"
          type="radio"
          :name="groupId"
          :value="option.slug"
          class="size-4 shrink-0 accent-accent"
        />
        <OrganizationLogo :organization="option" />
        <b class="truncate">{{ option.name }}</b>
        <span class="font-mono text-sm text-muted">{{ option.problemCodePrefix }}…</span>
      </label>
      <label v-if="scope.site" :class="OWNER_CARD">
        <input
          v-model="selectedSlug"
          type="radio"
          :name="groupId"
          :value="SITE"
          class="size-4 shrink-0 accent-accent"
        />
        <b>{{ $t('admin.creation.owner.site') }}</b>
      </label>
    </template>
    <CreationOwnerNotice
      v-if="notice"
      :kind="kind"
      :reason="notice"
      class="w-full"
      @retry="owners.refetch()"
    />
    <span
      v-if="isReady"
      class="min-w-0 text-xs text-muted"
      :class="layout === 'field' && 'w-full'"
      >{{ $t(ownerHint) }}</span
    >
  </fieldset>
</template>
