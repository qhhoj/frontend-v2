<script setup lang="ts">
import { lookupOrganization } from '@/api/admin-common.api';
import type { OrganizationChip } from '@/api/types/admin-common';
import ExactChips from './ExactChips.vue';
import { shortId } from './short-id';
import { useOrganizationNames } from './use-organization-names';

const chips = defineModel<OrganizationChip[]>({ required: true });
defineProps<{ label: string; max?: number; error?: string; lockedBy?: string }>();
/** A chip from an edit form carries only an id: its name is fetched, and a typed one shows its slug. */
const names = useOrganizationNames(() => chips.value.some((chip) => chip.slug === null));
const nameOf = (chip: OrganizationChip) =>
  names.value.get(chip.id) ?? chip.slug ?? shortId(chip.id);
const isNamed = (chip: OrganizationChip) => chip.slug !== null || names.value.has(chip.id);
</script>

<template>
  <ExactChips
    v-model="chips"
    :label="label"
    :lookup="lookupOrganization"
    :name-of="nameOf"
    :is-named="isNamed"
    :placeholder="$t('admin.ui.addBySlug')"
    :no-such-text="(name: string) => $t('admin.ui.noSuchOrganization', { name })"
    chip-test-id="organization-chip"
    :max="max"
    :error="error"
    :locked-by="lockedBy"
  />
</template>
