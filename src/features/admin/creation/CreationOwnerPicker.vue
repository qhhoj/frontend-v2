<script setup lang="ts">
import { computed, useId, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Lock } from 'lucide-vue-next';
import OrganizationLogo from '@/features/organizations/OrganizationLogo.vue';
import { INPUT } from '../ui/controls';
import { useCreationOwnersQuery, initialOwner } from './creation-owners';
import type { CreationOwner } from './creation-owners';
import { useCreationScope } from './creation-scope';
import type { CreationKind } from './creation-scope';

/**
 * The first field of a create form (mock-up 2C): who owns the new problem or contest. Radio cards for a few organizations,
 * a select for many, a fixed line when there is one choice. "Không thuộc tổ chức" only for site-wide creators.
 */
const props = defineProps<{ kind: CreationKind }>();
const owner = defineModel<CreationOwner | null>({ required: true });
/** False until the owners are known, so the form waits instead of posting to the wrong place. */
const isReady = defineModel<boolean>('ready', { default: false });
const route = useRoute();
const { scope } = useCreationScope(props.kind);
const owners = useCreationOwnersQuery(() => scope.value.organizations);
const options = computed(() => (scope.value.organizations ? (owners.data.value ?? []) : []));
const choiceCount = computed(() => options.value.length + (scope.value.site ? 1 : 0));
const SITE = '';
const MAX_CARDS = 6;
const OWNER_CARD =
  'flex min-h-14 cursor-pointer items-center gap-3 rounded-row border border-line bg-surface-solid px-3 py-2 has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:ring-1 has-[:checked]:ring-accent';
const groupId = useId();

const requestedSlug = computed(() =>
  typeof route.query.organization === 'string' ? route.query.organization : null,
);
watch(
  [options, () => owners.isPending.value],
  () => {
    if (scope.value.organizations && owners.isPending.value) return;
    if (!isReady.value)
      owner.value = initialOwner(options.value, requestedSlug.value, scope.value.site);
    isReady.value = true;
  },
  { immediate: true },
);

const selectedSlug = computed({
  get: () => owner.value?.slug ?? SITE,
  set: (slug: string) => {
    owner.value = options.value.find((option) => option.slug === slug) ?? null;
  },
});
const ownerHint = computed(() =>
  owner.value ? 'admin.creation.owner.privateHint' : 'admin.creation.owner.siteHint',
);
</script>

<template>
  <fieldset class="flex min-w-0 flex-col gap-2" data-testid="creation-owner">
    <legend class="mb-1.5 text-sm font-semibold">{{ $t('admin.creation.owner.label') }}</legend>
    <p v-if="!isReady" class="text-sm text-muted">{{ $t('admin.creation.owner.loading') }}</p>
    <div
      v-else-if="choiceCount === 1 && owner"
      class="flex items-center gap-3 rounded-cell border border-dashed border-line-strong bg-surface-strong px-3 py-2.5"
    >
      <OrganizationLogo :organization="owner" />
      <span class="min-w-0 flex-1">
        <b>{{ owner.name }}</b>
        <span class="text-muted"> · {{ $t('admin.creation.owner.orgPrivate') }}</span>
      </span>
      <span class="inline-flex items-center gap-1 text-sm text-muted">
        <Lock class="size-3.5" aria-hidden="true" />{{ $t('admin.creation.owner.fixed') }}
      </span>
    </div>
    <select
      v-else-if="options.length > MAX_CARDS"
      v-model="selectedSlug"
      :class="INPUT"
      :aria-label="$t('admin.creation.owner.label')"
    >
      <option v-if="scope.site" :value="SITE">{{ $t('admin.creation.owner.site') }}</option>
      <option v-for="option in options" :key="option.slug" :value="option.slug">
        {{ option.name }} ({{ option.problemCodePrefix }}…)
      </option>
    </select>
    <div v-else class="grid gap-2 sm:grid-cols-2">
      <label v-for="option in options" :key="option.slug" :class="OWNER_CARD">
        <input
          v-model="selectedSlug"
          type="radio"
          :name="groupId"
          :value="option.slug"
          class="size-4 shrink-0 accent-accent"
        />
        <OrganizationLogo :organization="option" />
        <span class="flex min-w-0 flex-col">
          <b class="truncate">{{ option.name }}</b>
          <span class="font-mono text-sm text-muted">{{ option.problemCodePrefix }}…</span>
        </span>
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
    </div>
    <p v-if="isReady" class="text-xs text-muted">{{ $t(ownerHint) }}</p>
  </fieldset>
</template>
