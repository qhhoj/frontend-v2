<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import { useCreationScope } from './creation-scope';
import type { CreationKind } from './creation-scope';

/**
 * Mock-up 2C: "Tạo bài tập" / "Tạo kỳ thi" on the public lists, only for a viewer the backend lets create (site-wide or in
 * an organization they administer); nobody else sees a button. The create form asks who owns the new item.
 */
const props = defineProps<{ kind: CreationKind }>();
const { canCreate } = useCreationScope(props.kind);
const ROUTE = { problem: 'admin-problemNew', contest: 'admin-contestNew' } as const;
</script>

<template>
  <AppButton
    v-if="canCreate"
    :data-testid="`create-${kind}`"
    :to="{ name: ROUTE[kind] }"
    tone="primary"
  >
    <template #icon><Plus class="size-4" aria-hidden="true" /></template>
    {{ $t(`create.${kind}`) }}
  </AppButton>
</template>
